
'use server';
/**
 * @fileOverview An AI flow for generating presentation slides.
 * - generatePresentation - Creates presentation content based on a topic or source text.
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
    - **Audience:** {{audience}}
    - **Number of Slides:** {{numSlides}}
    - **Tone/Style:** {{tone}}

    {{#if topic}}
    - **Topic:** {{topic}}
    {{else}}
    - **Source Text:** 
      ---
      {{{sourceText}}}
      ---
    {{/if}}

    **Your Instructions:**

    1.  **Analyze Request**:
        -   If a 'topic' is provided, generate a presentation structure and content from scratch about that topic.
        -   If 'sourceText' is provided, your entire presentation MUST be a summary and structured representation of that text. Do not introduce outside information.

    2.  **Title**: Create a strong, engaging title for the entire presentation.

    3.  **Slides**: Generate exactly {{numSlides}} slides. One of these must be a Title slide and another a 'Thank You' or 'Q&A' slide at the end.

    4.  **Slide Content**: For each slide:
        -   **Title**: Give each slide a clear and concise title.
        -   **Content**: Provide 3-5 bullet points of content. The language, complexity, and tone should be appropriate for the specified **{{audience}}** and **{{tone}}**.
        -   **Speaker Notes**: Write brief speaker notes for each slide to guide the presenter.
        -   **Visual Suggestion**: Provide a very brief (1-3 words) suggestion for a visual aid, like "bar chart", "team photo", "lightbulb icon", "process flowchart". This should be placed in the \`visualSuggestion\` field.

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
