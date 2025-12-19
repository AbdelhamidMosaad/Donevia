
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
    You are an expert presentation designer and information architect.

    Your task is to convert technical or business content into
    SMARTART and INFOGRAPHIC slide definitions.
    
    RULES:
    1. Choose the most suitable visual structure:
       - "process" → step-by-step flow
       - "cycle" → repeating or continuous loop
       - "hierarchy" → organizational or priority structure
       - "comparison" → differences or pros/cons
       - "timeline" → time-based progression
       - "matrix" → 2x2 or classification
       - "kpi" → metrics and performance indicators
       - "chart" → for bar, pie, line charts
       - "icon" → for general imagery
    
    2. Each slide must contain ONLY ONE visual concept.
    
    3. Text must be concise and diagram-ready:
       - Max 5 elements per visual
       - Each label ≤ 6 words
    
    4. Assign icons semantically (sensor, gear, chart, alert, user, clock).
    
    5. Include speaker notes explaining the visual.
    
    6. Generate exactly {{numSlides}} slides. The first slide MUST be a 'title' slide and the last should be a 'text-only' concluding slide.
    
    7. Output STRICT JSON only using the provided schema. Do not include markdown, explanations, or extra text.
    
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
  `,
  config: {
    temperature: 0.8,
    model: 'googleai/gemini-pro',
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
