
'use server';
/**
 * @fileOverview An AI flow for generating structured, professional lecture notes from a given text.
 * - generateLectureNotes - A function that uses Gemini to generate notes.
 */

import { ai } from '@/ai/genkit';
import { LectureNotesRequestSchema, LectureNotesResponseSchema, type LectureNotesRequest, type LectureNotesResponse } from '@/lib/types';


// Prompt
const lectureNotesPrompt = ai.definePrompt({
  name: 'lectureNotesPrompt',
  input: { schema: LectureNotesRequestSchema },
  output: { schema: LectureNotesResponseSchema },
  prompt: `
    Role: Act as a Senior University Teaching Assistant and Subject Matter Expert.

    Task: Transform the provided raw content into a structured, professional set of lecture notes suitable for an executive-level or graduate-level course.

    Formatting Requirements:

    1.  **Executive Summary**: Start with a high-level overview of the core themes.
    2.  **Hierarchical Structure**: Use Markdown headings (H1, H2, H3) to organize the content into logical modules.
    3.  **The "Definitions" Block**: For every key concept, provide a clear, concise definition.
    4.  **Comparative Analysis**: If there are two or more competing technologies, systems, or methodologies, create a Markdown table comparing their advantages, limitations, and use cases.
    5.  **Technical Synthesis**: Summarize specific tools, mathematical models, or software platforms into a "Toolbox" or "Methodology" section.
    6.  **Best Practices & Governance**: Group any "Do/Don’t" or "Procedural" lists into a strategic management section.
    7.  **Visual Placeholders**: Where the text implies a process or trend (e.g., a data flow or a graph), include a brief description of what a diagram should represent at that point (e.g., "[Diagram: A flowchart illustrating the data pipeline from ingestion to analysis.]").
    8.  **JSON Output**: Ensure your entire output is a single, valid JSON object that strictly adheres to the required schema.

    Tone and Style:
    *   Maintain an objective, professional, and insightful tone.
    *   Use **bolding** for key terms and concepts to improve scannability.
    *   Avoid "walls of text"; use bullet points and numbered lists to break down complex procedures.
    *   Ensure all content is logically sequenced—moving from foundational "What" to operational "How" and strategic "Why."

    ---
    **Source Text:**
    {{{sourceText}}}
    ---
  `,
});

// Flow
export async function generateLectureNotes(
  input: LectureNotesRequest
): Promise<LectureNotesResponse> {
  const { output } = await lectureNotesPrompt(input);
  if (!output) {
    throw new Error('The AI failed to generate lecture notes. The provided text might be too short or unclear.');
  }
  return output;
}

