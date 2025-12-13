
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
  input: { schema: PresentationRequestSchema.omit({ audience: true }) },
  output: { schema: PresentationResponseSchema },
  prompt: `
    You are an expert presentation designer and content strategist. Your task is to generate a compelling and professional presentation based on the user's request.

    **User Request:**
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

    **CRITICAL INSTRUCTIONS:**

    1.  **Analyze and Structure**:
        -   If 'sourceText' is provided, your primary goal is to intelligently summarize and structure THAT text. Do not introduce outside information.
        -   Identify the main sections or themes in the source text. Each main theme should become a slide with a clear, descriptive title.
        -   Extract the most important key points from each section to use as bullet points.
        -   If a 'topic' is provided, create a logical presentation structure from scratch.

    2.  **Generate Speaker-Ready Content**:
        -   **Concise Bullet Points**: Each slide's content must consist of 3-5 short, impactful bullet points. Each bullet point should be a clean string.
        -   **No Long Paragraphs**: Do not write long paragraphs. The content must be easy to read and glance at during a live presentation.
        -   **Speaker Notes**: For each slide, write brief, clear speaker notes that elaborate on the bullet points, providing the presenter with talking points.

    3.  **Slide Structure & Layout**:
        -   Generate exactly {{numSlides}} slides.
        -   The **first slide** MUST be a 'title' layout. Its \`content\` field should contain a concise, engaging subtitle or tagline for the presentation.
        -   The **last slide** should be a concluding slide (e.g., 'Thank You', 'Q&A', or 'Next Steps') with a 'text-only' layout.
        -   For the slides in between, you MUST vary the layout ('text-and-visual', 'text-only', 'visual-only') to keep the presentation visually interesting.

    4.  **Suggest Meaningful Visuals (VERY IMPORTANT)**:
        -   For any slide with a 'text-and-visual' or 'visual-only' layout, you MUST provide a specific and descriptive suggestion in the 'visualSuggestion' field.
        -   **Be specific**: Instead of "image" or "chart", suggest concrete visual aids.
        -   Good Examples: 
            - "bar chart showing user growth from 2022-2024"
            - "pie chart of market share distribution"
            - "timeline of key project milestones"
            - "infographic illustrating the 4-step process"
            - "photo of a collaborative team working"
            - "a lightbulb icon representing a new idea"
            - "process flowchart for the user journey"
    
    Ensure your entire output is a single, valid JSON object that strictly adheres to the defined schema.
  `,
  config: {
    temperature: 0.8,
  }
});

const generatePresentationFlow = ai.defineFlow(
  {
    name: 'generatePresentationFlow',
    inputSchema: PresentationRequestSchema.omit({ audience: true }),
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
  input: Omit<PresentationRequest, 'audience'>
): Promise<PresentationResponse> {
  return await generatePresentationFlow(input);
}
