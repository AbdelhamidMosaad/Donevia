'use server';
/**
 * @fileOverview An AI flow for enhancing sections of a CV to be ATS-friendly.
 * - enhanceCVSection - A function that uses Gemini to rewrite a CV section.
 */

import { ai } from '@/ai/genkit';
import { CVSectionEnhancementRequestSchema, CVSectionEnhancementResponseSchema, type CVSectionEnhancementRequest, type CVSectionEnhancementResponse } from '@/lib/types/cv-builder';

const prompt = ai.definePrompt({
  name: 'cvSectionEnhancerPrompt',
  input: { schema: CVSectionEnhancementRequestSchema },
  output: { schema: CVSectionEnhancementResponseSchema },
  prompt: `
    You are an expert resume writer and career coach specializing in creating ATS-compatible CVs.
    Your task is to rewrite a specific section of a user's CV to be more impactful, professional, and optimized for Applicant Tracking Systems.

    **CV Section to improve:** {{section}}
    {{#if jobTitle}}**Job Title for context:** {{jobTitle}}{{/if}}

    **User's Original Text:**
    ---
    {{{originalText}}}
    ---

    **Your Instructions:**

    1.  **Rewrite for Impact**: In the \`enhancedText\` field, rewrite the original text. Use strong action verbs, quantify achievements with metrics where possible, and incorporate relevant keywords for the role and industry. Ensure the language is professional and concise.
    
    2.  **Provide Actionable Tips**: In the \`tips\` array, provide 2-3 specific, constructive tips explaining the key changes you made and why they are better. For example:
        - "Replaced 'Responsible for' with the action verb 'Managed' to show more ownership."
        - "Added a quantifiable metric ('increased sales by 15%') to demonstrate concrete impact."
        - "Simplified the language to ensure it is easily parsed by ATS systems."

    3.  **JSON Output**: Ensure your entire output is a single, valid JSON object that strictly adheres to the required schema. Do not include any text or formatting outside of this JSON structure.
  `,
});

export async function enhanceCVSection(input: CVSectionEnhancementRequest): Promise<CVSectionEnhancementResponse> {
  const { output } = await prompt(input);
  if (!output) {
    throw new Error('The AI failed to generate CV enhancements. Please try again.');
  }
  return output;
}
