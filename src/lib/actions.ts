
'use server';

import { summarizeReport, type SummarizeReportInput } from '@/ai/flows/summarize-report';
import { processSideEffect, type ProcessSideEffectInput } from '@/ai/flows/process-side-effect-flow';
import type { Report, DrugAnalysisInput } from '@/types';
import { fetchDrugDetailsFromFDA } from '@/services/openfda_api';

export async function getDrugReportAction(input: DrugAnalysisInput): Promise<Report | { error: string }> {
  const drugInfo = await fetchDrugDetailsFromFDA(input.drugName);

  if (!drugInfo) {
    return { error: `Information for "${input.drugName}" not found via OpenFDA. Please check the drug name or try a different one.` };
  }

  let processedSideEffects: string[] = [];
  if (drugInfo.sideEffects && drugInfo.sideEffects.length > 0) {
    try {
      const sideEffectProcessingPromises = drugInfo.sideEffects.map(async (effectString) => {
        if (!effectString || effectString.trim() === "") {
          return ""; // Skip empty or whitespace-only strings
        }
        const aiInput: ProcessSideEffectInput = { originalEffect: effectString };
        const { bulletPoint } = await processSideEffect(aiInput);
        return bulletPoint;
      });
      
      processedSideEffects = (await Promise.all(sideEffectProcessingPromises)).filter(bp => bp && bp.trim() !== ""); // Filter out any empty results

    } catch (processingError) {
      console.error("Error processing side effects with AI:", processingError);
      // Fallback to original side effects if AI processing fails.
      // Ensure original effects are also filtered for empty strings if this path is taken.
      processedSideEffects = drugInfo.sideEffects.filter(se => se && se.trim() !== "");
    }
  }
  // If after processing (or fallback) there are no side effects, ensure it's an empty array
  if (!processedSideEffects) {
    processedSideEffects = [];
  }


  const summaryAiInput: SummarizeReportInput = {
    drugName: input.drugName,
    components: drugInfo.components.map(c => c.name),
    sideEffects: processedSideEffects, // Use AI-processed or original (if fallback) side effects
    userConditions: input.medicalConditions || undefined,
  };

  try {
    const aiOutput = await summarizeReport(summaryAiInput);
    return {
      drugName: input.drugName,
      components: drugInfo.components,
      sideEffects: processedSideEffects, // Return the processed side effects
      aiSummary: aiOutput.summary,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error calling AI summarizeReport flow:", error);
    const errorMessage = (typeof error === 'object' && error !== null && 'message' in error) 
        ? (error as {message: string}).message 
        : "An unexpected error occurred while generating the main summary.";
    return { error: `Failed to generate AI summary: ${errorMessage}. Please try again.` };
  }
}

