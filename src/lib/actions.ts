
'use server';

import { summarizeReport, type SummarizeReportInput } from '@/ai/flows/summarize-report';
import type { Report, DrugAnalysisInput } from '@/types';
import { fetchDrugDetailsFromFDA } from '@/services/openfda_api';

export async function getDrugReportAction(input: DrugAnalysisInput): Promise<Report | { error: string }> {
  const drugInfo = await fetchDrugDetailsFromFDA(input.drugName);

  if (!drugInfo) {
    return { error: `Information for "${input.drugName}" not found via OpenFDA. Please check the drug name or try a different one.` };
  }

  const aiInput: SummarizeReportInput = {
    drugName: input.drugName,
    components: drugInfo.components.map(c => c.name),
    sideEffects: drugInfo.sideEffects, // Directly use the string array from API
    userConditions: input.medicalConditions || undefined,
  };

  try {
    const aiOutput = await summarizeReport(aiInput);
    return {
      drugName: input.drugName,
      components: drugInfo.components,
      sideEffects: drugInfo.sideEffects,
      aiSummary: aiOutput.summary,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error calling AI summarizeReport flow:", error);
    // Check if error is an object and has a message property
    const errorMessage = (typeof error === 'object' && error !== null && 'message' in error) 
        ? (error as {message: string}).message 
        : "An unexpected error occurred";
    return { error: `Failed to generate AI summary: ${errorMessage}. Please try again.` };
  }
}
