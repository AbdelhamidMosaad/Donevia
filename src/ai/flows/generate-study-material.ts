
'use server';
/**
 * @fileOverview A flow for generating comprehensive study materials.
 *
 * - generateStudyMaterial - A function that creates a study guide.
 * - GenerateStudyGuideRequest - The input type for the generation.
 * - GenerateStudyGuideResponse - The return type.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

export const GenerateStudyGuideRequestSchema = z.object({
  topic: z.string().describe('The main topic for the study guide.'),
  subtopics: z
    .string()
    .describe(
      'A comma-separated list of subtopics to focus on within the main topic.'
    ),
});
export type GenerateStudyGuideRequest = z.infer<
  typeof GenerateStudyGuideRequestSchema
>;

export const GenerateStudyGuideResponseSchema = z.object({
  htmlContent: z
    .string()
    .describe(
      'The generated study guide as a single, complete HTML string. It should be well-structured with headings (h2, h3), paragraphs, lists, and tables where appropriate. The entire response must be enclosed in a single root <div> tag.'
    ),
});
export type GenerateStudyGuideResponse = z.infer<
  typeof GenerateStudyGuideResponseSchema
>;

const generateStudyMaterialPrompt = ai.definePrompt({
  name: 'generateStudyMaterialPrompt',
  input: { schema: GenerateStudyGuideRequestSchema },
  output: { schema: GenerateStudyGuideResponseSchema },
  prompt: `
You are an expert instructional designer tasked with creating a comprehensive, clear, and engaging study guide.

The user wants to learn about the following topic:
Topic: {{{topic}}}

They have specified the following subtopics to cover:
Subtopics: {{{subtopics}}}

Please generate a detailed study guide in HTML format. The entire output must be a single HTML string enclosed in one root <div> element.

The guide should include:
1.  A brief introduction to the main topic.
2.  Detailed explanations for each subtopic, using <h2> for subtopic titles.
3.  Use <h3> for key concepts within each subtopic.
4.  Use <p>, <ul>, <ol>, and <li> tags for explanations and lists.
5.  Where appropriate, use <table> to summarize complex information or comparisons.
6.  End the study guide with a short, multiple-choice quiz (3-5 questions) to test understanding. The quiz should be under an <h2>Quiz</h2> heading.
`,
});

const generateStudyMaterialFlow = ai.defineFlow(
  {
    name: 'generateStudyMaterialFlow',
    inputSchema: GenerateStudyGuideRequestSchema,
    outputSchema: GenerateStudyGuideResponseSchema,
  },
  async (input) => {
    const { output } = await generateStudyMaterialPrompt(input);
    if (!output) {
      throw new Error('The AI failed to generate a study guide.');
    }
    return output;
  }
);

export async function generateStudyMaterial(
  input: GenerateStudyGuideRequest
): Promise<GenerateStudyGuideResponse> {
  return generateStudyMaterialFlow(input);
}
