'use server';
/**
 * @fileOverview Provides personalized advice on potential drug interactions and side effects based on user-specified medical conditions.
 *
 * - personalizedAdvice - A function that takes a drug name and medical conditions as input and returns personalized advice.
 * - PersonalizedAdviceInput - The input type for the personalizedAdvice function.
 * - PersonalizedAdviceOutput - The return type for the personalizedAdvice function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PersonalizedAdviceInputSchema = z.object({
  drugName: z.string().describe('The name of the drug (popular name, product name, or medical term).'),
  medicalConditions: z.string().describe('The user’s medical conditions.'),
});
export type PersonalizedAdviceInput = z.infer<typeof PersonalizedAdviceInputSchema>;

const PersonalizedAdviceOutputSchema = z.object({
  advice: z.string().describe('Personalized advice on potential drug interactions and side effects based on the user’s medical conditions.'),
});
export type PersonalizedAdviceOutput = z.infer<typeof PersonalizedAdviceOutputSchema>;

export async function personalizedAdvice(input: PersonalizedAdviceInput): Promise<PersonalizedAdviceOutput> {
  return personalizedAdviceFlow(input);
}

const prompt = ai.definePrompt({
  name: 'personalizedAdvicePrompt',
  input: {schema: PersonalizedAdviceInputSchema},
  output: {schema: PersonalizedAdviceOutputSchema},
  prompt: `You are a medical expert providing personalized advice on drug interactions and side effects.

  Based on the drug name and the user's medical conditions, provide personalized advice.

  Drug Name: {{{drugName}}}
  Medical Conditions: {{{medicalConditions}}}
  `,
});

const personalizedAdviceFlow = ai.defineFlow(
  {
    name: 'personalizedAdviceFlow',
    inputSchema: PersonalizedAdviceInputSchema,
    outputSchema: PersonalizedAdviceOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
