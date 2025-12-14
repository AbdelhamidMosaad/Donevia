
'use server';
/**
 * @fileOverview An AI flow for answering questions based on text from a PDF.
 * - chatWithPdf - A function that uses Gemini to answer questions grounded in the provided text.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const ChatRequestSchema = z.object({
  pdfText: z.string().describe("The full text content extracted from the PDF file."),
  question: z.string().describe("The user's question about the PDF content."),
});

const ChatResponseSchema = z.object({
  answer: z.string().describe("The AI-generated answer, based strictly on the provided PDF text."),
});

export type ChatRequest = z.infer<typeof ChatRequestSchema>;
export type ChatResponse = z.infer<typeof ChatResponseSchema>;

const prompt = ai.definePrompt({
  name: 'chatWithPdfPrompt',
  input: { schema: ChatRequestSchema },
  output: { schema: ChatResponseSchema },
  prompt: `
    You are an AI assistant embedded inside an application that allows users to ask questions about an uploaded PDF file.

    Your task is to answer the user's question based *ONLY* on the information found in the provided PDF content.

    **Core Rules:**
    1.  **Grounding:** Your answer MUST be derived exclusively from the provided "PDF Content".
    2.  **No External Knowledge:** Do NOT use any information outside of the provided text. Do not make assumptions or infer information not present.
    3.  **Unknown Answers:** If the answer is not in the document, you MUST respond with exactly this phrase: "The uploaded document does not contain information to answer this question."

    **Answer Style:**
    *   Be precise and to the point.
    *   Use Markdown tables for comparisons, structured data, or summarizing points. Keep tables compact and easy to read.
    *   Use bullet points only if they improve clarity.
    *   Avoid introductions like "According to the document...". Just provide the answer.
    *   If the user asks for a table, format the relevant information into a Markdown table.

    ---
    **PDF Content:**
    {{{pdfText}}}
    ---

    **User's Question:**
    "{{question}}"
  `,
});

export async function chatWithPdf(input: ChatRequest): Promise<ChatResponse> {
  const { output } = await prompt(input);
  return output || { answer: "I couldn't find an answer to that. Please try rephrasing your question." };
}
