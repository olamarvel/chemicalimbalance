
'use server';
/**
 * @fileOverview Extracts drug information from an image.
 *
 * - extractDrugInfoFromImage - A function that takes an image data URI and returns extracted drug name.
 * - ExtractDrugInfoInput - The input type for the extractDrugInfoFromImage function.
 * - ExtractDrugInfoOutput - The return type for the extractDrugInfoFromImage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExtractDrugInfoInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a drug's packaging or label, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ExtractDrugInfoInput = z.infer<typeof ExtractDrugInfoInputSchema>;

const ExtractDrugInfoOutputSchema = z.object({
  drugName: z.string().describe('The most prominent drug name extracted from the image. If multiple names are present, choose the main one. If no name is found, return an empty string.'),
});
export type ExtractDrugInfoOutput = z.infer<typeof ExtractDrugInfoOutputSchema>;

export async function extractDrugInfoFromImage(input: ExtractDrugInfoInput): Promise<ExtractDrugInfoOutput> {
  return extractDrugInfoFlow(input);
}

const prompt = ai.definePrompt({
  name: 'extractDrugInfoPrompt',
  input: {schema: ExtractDrugInfoInputSchema},
  output: {schema: ExtractDrugInfoOutputSchema},
  model: 'googleai/gemini-2.0-flash', // Explicitly use a model that supports vision
  prompt: `You are an expert at analyzing images of drug packaging and labels.
Your task is to extract the primary drug name from the provided image.
If there are multiple names, identify the main product name.
Focus on accuracy. If the drug name is unclear or not visible, return an empty string for drugName.

Image: {{media url=photoDataUri}}`,
});

const extractDrugInfoFlow = ai.defineFlow(
  {
    name: 'extractDrugInfoFlow',
    inputSchema: ExtractDrugInfoInputSchema,
    outputSchema: ExtractDrugInfoOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) {
        return { drugName: "" };
    }
    return {
        drugName: output.drugName || "",
    };
  }
);
