
'use server';
/**
 * @fileOverview A flow for generating comprehensive study materials.
 *
 * - generateStudyMaterial - A function that creates a study guide.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { GenerateStudyGuideRequestSchema, GenerateStudyGuideResponseSchema, GenerateStudyGuideRequest } from '@/lib/types';

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
): Promise<z.infer<typeof GenerateStudyGuideResponseSchema>> {
  return generateStudyMaterialFlow(input);
}
