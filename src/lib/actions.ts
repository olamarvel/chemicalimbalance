'use server';

import { summarizeReport, type SummarizeReportInput } from '@/ai/flows/summarize-report';
import type { Report, DrugAnalysisInput } from '@/types';
import { getDrugInfo } from './dummy-data';

export async function getDrugReportAction(input: DrugAnalysisInput): Promise<Report | { error: string }> {
  const drugInfo = getDrugInfo(input.drugName);

  if (!drugInfo) {
    return { error: `Information for "${input.drugName}" not found. Please try another drug name or check spelling.` };
  }

  const aiInput: SummarizeReportInput = {
    drugName: input.drugName,
    components: drugInfo.components.map(c => c.name),
    sideEffects: drugInfo.sideEffects.map(s => s.name),
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
    return { error: "Failed to generate AI summary. Please try again." };
  }
}
