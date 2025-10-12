
'use server';
/**
 * @fileOverview An AI flow for generating presentation slides.
 * - generatePresentation - Creates presentation content based on a topic.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { PresentationRequestSchema, PresentationResponseSchema, type PresentationRequest, type PresentationResponse } from '@/lib/types/presentation';

const presentationPrompt = ai.definePrompt({
  name: 'presentationPrompt',
  input: { schema: PresentationRequestSchema },
  output: { schema: PresentationResponseSchema },
  prompt: `
    You are a world-class presentation creator. Your task is to generate a compelling presentation based on the user's request.

    **User Request:**
    - **Topic:** {{topic}}
    - **Audience:** {{audience}}
    - **Number of Slides:** {{numSlides}}

    **Instructions:**

    1.  **Title**: Create a strong, engaging title for the entire presentation.
    2.  **Slides**: Generate exactly {{numSlides}} slides. One of these must be a Title slide and another a 'Thank You' or 'Q&A' slide.
    3.  **Slide Content**: For each slide:
        -   **Title**: Give each slide a clear and concise title.
        -   **Content**: Provide 3-5 bullet points of content. The language and complexity should be appropriate for the specified **{{audience}}**.
        -   **Speaker Notes**: Write brief speaker notes for each slide to guide the presenter.

    Ensure your entire output is a single, valid JSON object.
  `,
});

const generatePresentationFlow = ai.defineFlow(
  {
    name: 'generatePresentationFlow',
    inputSchema: PresentationRequestSchema,
    outputSchema: PresentationResponseSchema,
  },
  async (input) => {
    const { output } = await presentationPrompt(input);
    if (!output) {
      throw new Error('The AI failed to generate a presentation.');
    }
    return output;
  }
);


export async function generatePresentation(
  input: PresentationRequest
): Promise<PresentationResponse> {
  return await generatePresentationFlow(input);
}
