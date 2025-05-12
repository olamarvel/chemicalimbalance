
'use server';
/**
 * @fileOverview Processes a single side effect description into a concise bullet point.
 *
 * - processSideEffect - A function that takes a side effect string and returns a concise bullet point.
 * - ProcessSideEffectInput - The input type for the processSideEffect function.
 * - ProcessSideEffectOutput - The return type for the processSideEffect function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ProcessSideEffectInputSchema = z.object({
  originalEffect: z.string().describe('The original side effect description text from the API.'),
});
export type ProcessSideEffectInput = z.infer<typeof ProcessSideEffectInputSchema>;

const ProcessSideEffectOutputSchema = z.object({
  bulletPoint: z.string().describe('A concise, informative bullet point summarizing the side effect, suitable for a patient.'),
});
export type ProcessSideEffectOutput = z.infer<typeof ProcessSideEffectOutputSchema>;

export async function processSideEffect(input: ProcessSideEffectInput): Promise<ProcessSideEffectOutput> {
  // If the original effect is very short, it might already be a good bullet point.
  // Add a simple heuristic to avoid unnecessary AI calls for very short strings.
  if (input.originalEffect.length < 20 && !input.originalEffect.includes('.')) {
    return { bulletPoint: input.originalEffect };
  }
  return processSideEffectFlow(input);
}

const prompt = ai.definePrompt({
  name: 'processSideEffectPrompt',
  input: {schema: ProcessSideEffectInputSchema},
  output: {schema: ProcessSideEffectOutputSchema},
  prompt: `You are a medical communication assistant.
Your task is to convert a potentially lengthy or technical side effect description into a single, short, and informative bullet point.
This bullet point should be easily understandable by a patient.
Focus on clarity, conciseness, and retain the core medical meaning.
Directly start the bullet point. Avoid introductory phrases like "This may cause..." or "Potential for..." unless absolutely essential for conveying the meaning accurately.

Original Side Effect Description:
"{{{originalEffect}}}"

Concise Bullet Point:
`,
});

const processSideEffectFlow = ai.defineFlow(
  {
    name: 'processSideEffectFlow',
    inputSchema: ProcessSideEffectInputSchema,
    outputSchema: ProcessSideEffectOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    // Fallback to original effect if AI output is missing or the bulletPoint field is empty
    if (!output || !output.bulletPoint) {
        return { bulletPoint: input.originalEffect };
    }
    return {
        bulletPoint: output.bulletPoint.trim(),
    };
  }
);

