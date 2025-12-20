
'use server';
/**
 * @fileOverview An AI flow for generating structured lecture notes from a given text.
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
    You are an intelligent lecture-notes builder. The user has provided content from a document. Your task is to generate well-structured lecture notes strictly from this content. Do not add external information or assumptions.

    Your goal is to simplify, organize, and clarify the material for learning purposes while preserving all important details.

    **Instructions:**

    1.  **Analyze the Content**: Carefully read the entire source text to understand its structure and key information.
    2.  **Create a Title**: Generate a concise, descriptive title for the lecture notes and place it in the \`title\` field.
    3.  **Write an Overview**: Summarize the main ideas and learning objectives in a brief 2-3 sentence paragraph. Place this in the \`overview\` field.
    4.  **Build Sections**:
        *   Identify the key concepts, main points, important definitions, and examples.
        *   Organize these into logical sections. Each section must have a clear \`heading\`.
        *   The \`content\` for each section should be an array of strings, where each string is a bullet point or a short paragraph.
        *   **Crucially, preserve all important formulas, numbers, technical content, and specific examples from the source text.**
        *   If the source text is from slides, combine fragmented bullet points into meaningful explanations.
    5.  **Summarize Key Takeaways**: Create a final summary of the most critical points. Place this in the \`summary\` field.
    6.  **Formatting**: Use Markdown for tables or lists within the content strings if it improves clarity. Do not use markdown for headings; use the structured 'heading' field instead.
    7.  **No Hallucination**: If any part of the document is unreadable or ambiguous, do not invent content. You can mention "Some content was unclear in the original document" in a relevant section if necessary.
    8.  **Output**: Ensure your entire output is a single, valid JSON object that strictly adheres to the schema.

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
