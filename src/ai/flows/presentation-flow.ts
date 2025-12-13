
'use server';
/**
 * @fileOverview An AI flow for generating presentation slides.
 * - generatePresentation - Creates presentation content based on a topic or source text.
 */

import { ai } from '@/ai/genkit';
import { PresentationRequestSchema, PresentationResponseSchema, type PresentationRequest, type PresentationResponse } from '@/lib/types/presentation';

const presentationPrompt = ai.definePrompt({
  name: 'presentationPrompt',
  input: { schema: PresentationRequestSchema },
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
        -   Identify the main sections or themes. Each theme should become a slide with a clear, descriptive title.
        -   Extract the most important key points to use as bullet points.
        -   If a 'topic' is provided, create a logical presentation structure from scratch.

    2.  **Generate Speaker-Ready Content**:
        -   **Concise Bullet Points**: Each slide's content must consist of 3-5 short, impactful bullet points.
        -   **Speaker Notes**: For each slide, write brief, clear speaker notes that elaborate on the bullet points.

    3.  **Slide Structure & Layout**:
        -   Generate exactly {{numSlides}} slides.
        -   The **first slide** MUST be a 'title' layout. Its \`content\` field can be empty or have a short tagline.
        -   The **last slide** should be a concluding slide (e.g., 'Thank You', 'Q&A') with a 'text-only' layout.
        -   Vary the layout for other slides ('text-and-visual', 'text-only', 'visual-only') to keep it interesting.

    4.  **Generate SMART Visuals (VERY IMPORTANT)**:
        -   For any slide with a 'text-and-visual' or 'visual-only' layout, you MUST provide a structured 'visual' object.
        -   **Be Specific**: Do not suggest "image" or "graphic". Choose a specific, meaningful visual type.
        -   **Valid Visual Types**: 'process', 'cycle', 'chart', 'icon', 'image'.
        -   **For 'process' or 'cycle'**: You MUST provide an 'items' array with 2-5 short text labels for the diagram steps/stages. Example: \`"visual": { "type": "process", "items": ["Step 1: Research", "Step 2: Design", "Step 3: Build"] }\`
        -   **For 'chart' or 'icon'**: Provide a descriptive 'items' array with a single string describing what it should be. Example: \`"visual": { "type": "chart", "items": ["Bar chart of user growth"] }\` or \`"visual": { "type": "icon", "items": ["lightbulb"] }\`
        -   **For 'image'**: Provide a descriptive 'items' array with a single string of 1-2 keywords for a photo. Example: \`"visual": { "type": "image", "items": ["team collaboration"] }\`
    
    Ensure your entire output is a single, valid JSON object that strictly adheres to the defined schema.
  `,
  config: {
    temperature: 0.8,
  }
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
