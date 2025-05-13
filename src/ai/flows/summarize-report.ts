// src/ai/flows/summarize-report.ts
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// Define schemas...
const SummarizeReportInputSchema = z.object({
  drugName: z.string().describe('The name of the drug to summarize (usually the product name).'),
  components: z.array(z.string()).describe('The active components (ingredients) of the drug.'),
  sideEffects: z.array(z.string()).describe('The potential side effects or warnings associated with the drug (already processed into concise points).'),
  userConditions: z.string().optional().describe('User specified medical conditions.'),
});
export type SummarizeReportInput = z.infer<typeof SummarizeReportInputSchema>;

const SummarizeReportOutputSchema = z.object({
  summary: z.string().describe('A comprehensive summary including drug purpose context, potential relevance to user conditions, side effect overview, and crucial warnings about self-diagnosis and consulting a doctor.'),
});
export type SummarizeReportOutput = z.infer<typeof SummarizeReportOutputSchema>;

// Define the prompt
const prompt = ai.definePrompt({
  name: 'summarizeReportPrompt',
  input: { schema: SummarizeReportInputSchema },
  output: { schema: SummarizeReportOutputSchema },
  config: {
    safetySettings: [
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
    ],
  },
  prompt: `You are a helpful medical information assistant providing a balanced summary about a specific drug. Your goal is to inform, not to provide medical advice.

Drug Name: {{{drugName}}}

Active Components: {{{componentsString}}}

Potential Side Effects / Warnings (summarized):
{{#if sideEffects}}
{{#each sideEffects}}
- {{{this}}}
{{/each}}
{{else}}
- No specific side effects or warnings were listed in the available data for these components.
{{/if}}

---

Analysis:
{{#if userConditions}}
User's Stated Conditions: {{{userConditions}}}

Analyze the relationship between the drug's active components ({{{componentsString}}}) and the user's stated conditions ({{{userConditions}}}). Based on general medical knowledge, briefly indicate if this type of drug *might potentially* be considered by a doctor for conditions like those mentioned. Do NOT state it *is* used or *should* be used. Frame it cautiously (e.g., "Drugs containing [component] are sometimes used in managing...", "Component X has properties relevant to...").
{{else}}
User did not specify any medical conditions. Briefly explain the general purpose or typical effect of this type of drug/components on a healthy individual, based on general knowledge (e.g., how a painkiller works, what a vitamin does), without giving specific health advice.
{{/if}}

---

Summary:
1. Briefly explain the general purpose or class of the drug based on its active components (e.g., "This drug contains components typically used as pain relievers/antibiotics/antihistamines...").
2. Referencing the potential side effects/warnings listed above, mention they represent potential risks and may not affect everyone.
3. Based on the Analysis section above, state the potential relevance to the user's conditions or the general effect on a healthy individual.
4. Conclude with a **CRUCIAL WARNING**: This information is NOT medical advice. DO NOT self-diagnose or self-medicate. Always consult a doctor or pharmacist for any health concerns, before taking or stopping any medication, and to see if this drug is right for you. Side effects can vary; some may be serious and need immediate medical help.
`,
});


export async function summarizeReport(input: SummarizeReportInput): Promise<SummarizeReportOutput> {
  return summarizeReportFlow(input);
}

const summarizeReportFlow = ai.defineFlow(
  {
    name: 'summarizeReportFlow',
    inputSchema: SummarizeReportInputSchema,
    outputSchema: SummarizeReportOutputSchema,
  },
  async input => {
    // Prepare input: Join components into a string here
    const componentsArray = input.components.length > 0 ? input.components : ['Unknown component'];
    const componentsString = componentsArray.join(', ');

    const populatedInput = {
      ...input,
      components: componentsArray, // Keep original array if needed elsewhere, though template doesn't use it now
      componentsString: componentsString, // Add the new components string for the template
      sideEffects: input.sideEffects || [],
    };

    try {
      console.log('Attempting to generate AI summary with input:', JSON.stringify(populatedInput, null, 2));
      // Call the prompt function with the modified input
      const { output } = await prompt(populatedInput);

      if (!output || !output.summary || output.summary.trim().length < 50) {
        console.warn("AI summary generation resulted in empty or very short output. Falling back.");
        return { summary: `Could not generate a detailed AI summary for ${input.drugName}. Basic Information: Components: ${populatedInput.componentsString || 'N/A'}. Side Effects: ${input.sideEffects && input.sideEffects.length > 0 ? input.sideEffects.join(', ') : 'N/A'}. 

**IMPORTANT:** Always consult a healthcare professional for medical advice.` };
      }
      // Log success after a successful call
      console.log('AI summary generated successfully.');
      return output;

    } catch (error: any) {
      console.error("Error during AI summary generation prompt call:", error); // Log the specific error
      let errorMessage = "An unknown error occurred.";
      if (error instanceof Error) {
          errorMessage = error.message; // This should contain the 'unknown helper join' message if the fix didn't work
      }
      if (error.cause) console.error("Error Cause:", error.cause);
      if (error.details) console.error("Error Details:", error.details);
      console.error(`Failed to generate AI summary for ${input.drugName}. Input was:`, JSON.stringify(populatedInput, null, 2));

      // Return the fallback summary using the pre-formatted string
      return { summary: `An error occurred while generating the AI summary for ${input.drugName}. Please consult official sources or a healthcare professional. Basic Information: Components: ${populatedInput.componentsString || 'N/A'}. Side Effects: ${input.sideEffects && input.sideEffects.length > 0 ? input.sideEffects.join(', ') : 'N/A'}. 

**IMPORTANT:** Always consult a healthcare professional for medical advice.` };
    }
  }
);
