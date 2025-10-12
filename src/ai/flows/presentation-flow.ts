
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

    3.  **Slides**: Generate exactly {{numSlides}} slides. 
        - The first slide MUST be a 'title' layout. Its content should be a concise, impactful subtitle or tagline.
        - The last slide should be a 'Thank You' or 'Q&A' slide, likely with a 'text-only' layout.
        - For the slides in between, vary the layout ('text-and-visual', 'text-only', 'visual-only') to keep the presentation engaging.

    4.  **Slide Content**: For each slide:
        -   **Title**: Give each slide a clear and concise title.
        -   **Content**: Provide 3-5 bullet points of content. **Do not use markdown formatting like dashes (-).** Each bullet point should be a clean string.
        -   **Speaker Notes**: Write brief speaker notes for each slide to guide the presenter.
        -   **Visual Suggestion**: Provide a very brief (1-3 words) suggestion for a visual aid, like "bar chart showing growth", "team photo", "lightbulb icon", "process flowchart". This should be placed in the \`visualSuggestion\` field. If a slide layout is 'text-only', you can omit this or provide a simple icon suggestion.
        -   **Layout**: Assign a layout for each slide from: 'title', 'text-and-visual', 'text-only', 'visual-only'.

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
