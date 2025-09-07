
'use server';
/**
 * @fileOverview Flow for generating lecture notes from raw text.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { generateJSON } from '@tiptap/html';
import StarterKit from '@tiptap/starter-kit';
import { JSDOM } from 'jsdom';
import { remark } from 'remark';
import html from 'remark-html';

const LectureNotesInputSchema = z.object({
  sourceText: z.string().describe('The raw text from a book or study material.'),
});

const LectureNotesOutputSchema = z.object({
  title: z.string().describe('A concise, relevant title for the generated lecture notes.'),
  content: z.string().describe('The generated lecture notes in Markdown format. Use headings, bullet points, bold text, and other formatting to create well-structured and easy-to-read notes.'),
});

const generateLectureNotesPrompt = ai.definePrompt({
    name: 'generateLectureNotesPrompt',
    input: { schema: LectureNotesInputSchema },
    output: { schema: LectureNotesOutputSchema },
    prompt: `You are an expert academic assistant. Your task is to transform the following raw text into clear, structured, and well-organized lecture notes.

    Instructions:
    1.  Read the entire source text to understand the main topics and concepts.
    2.  Create a short, descriptive title for the lecture notes.
    3.  Organize the content logically using headings (#, ##, ###) for main topics and sub-topics.
    4.  Use bullet points (-) for key details, lists, and examples.
    5.  Use bold text (**) to highlight important keywords, definitions, and key concepts.
    6.  Rewrite and summarize the content to be concise and easy to digest. Do not just copy the source text.
    7.  Ensure the final output is in valid Markdown format.

    Source Text:
    ---
    {{{sourceText}}}
    ---
    `,
});

export const generateLectureNotesFlow = ai.defineFlow(
  {
    name: 'generateLectureNotesFlow',
    inputSchema: LectureNotesInputSchema,
    outputSchema: z.object({
        title: z.string(),
        content: z.any(), // TipTap JSON object
    }),
  },
  async (input) => {
    const { output } = await generateLectureNotesPrompt(input);
    
    if (!output) {
      throw new Error('AI failed to generate lecture notes.');
    }

    // Convert the generated Markdown to HTML string
    const processedContent = await remark().use(html).process(output.content);
    const htmlContent = processedContent.toString();

    // Create a virtual DOM to parse the HTML
    const dom = new JSDOM(htmlContent);
    
    // Convert the HTML string to TipTap's JSON structure using the virtual DOM
    const tiptapJSON = generateJSON(dom.window.document.body.innerHTML, [StarterKit]);

    return {
      title: output.title,
      content: tiptapJSON,
    };
  }
);
