
'use server';

import { summarizeReport, type SummarizeReportInput } from '@/ai/flows/summarize-report';
import { processSideEffect, type ProcessSideEffectInput } from '@/ai/flows/process-side-effect-flow';
import type { Report, DrugAnalysisInput, DrugComponent } from '@/types';
import { fetchNafdacDrugDetails, parseActiveIngredients } from '@/services/nafdac_api';
import { fetchSideEffectsForIngredients } from '@/services/openfda_api';

// Helper function to sanitize drug names
function sanitizeDrugName(name: string): string {
  // Removes trailing non-alphanumeric chars (excluding spaces, ., -) and trims whitespace
  return name.replace(/[^a-zA-Z0-9\s.-]+$/, '').trim();
}


export async function getDrugReportAction(input: DrugAnalysisInput): Promise<Report | { error: string }> {
  // Sanitize the input drug name first
  const sanitizedDrugName = sanitizeDrugName(input.drugName);
  console.log(`Starting analysis for input: ${input.drugName} (Sanitized: ${sanitizedDrugName})`);


  if (!sanitizedDrugName) {
      return { error: "Please enter a valid drug name." };
  }

  // 1. Fetch drug details from NAFDAC API using the sanitized name
  const nafdacResults = await fetchNafdacDrugDetails(sanitizedDrugName);

  if (!nafdacResults || nafdacResults.length === 0) {
    return { error: `Information for "${sanitizedDrugName}" not found via NAFDAC Greenbook. Please check the drug name or NAFDAC number.` };
  }

  // For simplicity, use the first match from NAFDAC.
  const drugInfo = nafdacResults[0];
  console.log(`NAFDAC found: ${drugInfo.product_name} (${drugInfo.nafdac_no})`);

  // Also sanitize the product name retrieved from the API, just in case
  const cleanProductName = sanitizeDrugName(drugInfo.product_name);


  // 2. Parse active ingredients from NAFDAC result
  const activeIngredientNames = parseActiveIngredients(drugInfo.active_ingredients);

  if (activeIngredientNames.length === 0) {
    return { error: `Could not identify active ingredients for "${cleanProductName}" from NAFDAC data.` };
  }
  console.log(`Parsed active ingredients: ${activeIngredientNames.join(', ')}`);

  const components: DrugComponent[] = activeIngredientNames.map(name => ({ name }));

  // 3. Fetch side effects from OpenFDA based on active ingredients
  const openFdaSideEffectInfo = await fetchSideEffectsForIngredients(activeIngredientNames);
  const rawSideEffects = openFdaSideEffectInfo?.sideEffects || [];
  console.log(`Found ${rawSideEffects.length} raw side effects/warnings from OpenFDA.`);


  // 4. Process side effects with AI (if any found)
  const preProcessSideEffect = rawSideEffects.join(" ")
  const aiInput: ProcessSideEffectInput = { originalEffect: preProcessSideEffect };
  const { bulletPoint } = await processSideEffect(aiInput);
  const bulletPoints = bulletPoint.split(',');


  let processedSideEffects: string[] = bulletPoints || [];


  // 5. Generate AI summary
  const summaryAiInput: SummarizeReportInput = {
    drugName: cleanProductName, // Use the sanitized product name from NAFDAC
    components: activeIngredientNames,
    sideEffects: processedSideEffects, // Use AI-processed or raw (if fallback) side effects
    userConditions: input.medicalConditions || undefined,
  };

  try {
    const aiOutput = await summarizeReport(summaryAiInput);
    console.log("AI summary generated successfully.");
    return {
      drugName: input.drugName, // Keep the original user input query
      productName: cleanProductName, // Return the sanitized product name
      nafdacNo: drugInfo.nafdac_no,
      components: components,
      sideEffects: processedSideEffects, // Return the processed side effects
      aiSummary: aiOutput.summary,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error calling AI summarizeReport flow:", error);
    const errorMessage = (typeof error === 'object' && error !== null && 'message' in error)
        ? (error as {message: string}).message
        : "An unexpected error occurred while generating the AI summary.";
    // Still return the fetched data even if AI summary fails? Or return error? Let's return error.
    // If we wanted to return partial data, we could construct a Report object here with aiSummary as an error message.
    return { error: `Successfully fetched drug data, but failed to generate AI summary: ${errorMessage}. Please try again.` };
  }
}
