// SummarizeReport.ts
'use server';

/**
 * @fileOverview Summarizes the components and potential side effects of a drug.
 *
 * - summarizeReport - A function that handles the summarization process.
 * - SummarizeReportInput - The input type for the summarizeReport function.
 * - SummarizeReportOutput - The return type for the summarizeReport function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeReportInputSchema = z.object({
  drugName: z.string().describe('The name of the drug to summarize.'),
  components: z.array(z.string()).describe('The components of the drug.'),
  sideEffects: z.array(z.string()).describe('The potential side effects of the drug.'),
  userConditions: z.string().optional().describe('User specified medical conditions.'),
});
export type SummarizeReportInput = z.infer<typeof SummarizeReportInputSchema>;

const SummarizeReportOutputSchema = z.object({
  summary: z.string().describe('A summary of the drug components and potential side effects, and personalized advice based on user conditions.'),
});
export type SummarizeReportOutput = z.infer<typeof SummarizeReportOutputSchema>;

export async function summarizeReport(input: SummarizeReportInput): Promise<SummarizeReportOutput> {
  return summarizeReportFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeReportPrompt',
  input: {schema: SummarizeReportInputSchema},
  output: {schema: SummarizeReportOutputSchema},
  prompt: `You are a pharmacist summarizing the components and potential side effects of a drug. 

Drug Name: {{{drugName}}}

Components: {{#each components}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}

Side Effects: {{#each sideEffects}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}

{{#if userConditions}}
User Conditions: {{{userConditions}}}
\nBased on the user's conditions, provide personalized advice regarding the drug.
{{/if}}

Provide a concise summary of the drug's components and potential side effects. Be sure to provide context around the side effects and components.
`,
});

const summarizeReportFlow = ai.defineFlow(
  {
    name: 'summarizeReportFlow',
    inputSchema: SummarizeReportInputSchema,
    outputSchema: SummarizeReportOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
