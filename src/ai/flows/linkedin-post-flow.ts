
'use server';
/**
 * @fileOverview An AI flow for enhancing LinkedIn posts.
 * - enhanceLinkedInPost - A function that uses Gemini to rewrite a LinkedIn post draft.
 */

import { ai } from '@/ai/genkit';
import { LinkedInPostRequestSchema, LinkedInPostResponseSchema, type LinkedInPostRequest, type LinkedInPostResponse } from '@/lib/types/linkedin-post';

// ========== Prompt Template ==========

const linkedInPostPrompt = ai.definePrompt({
  name: 'linkedInPostPrompt',
  input: { schema: LinkedInPostRequestSchema },
  output: { schema: LinkedInPostResponseSchema },
  prompt: `
    You are an expert LinkedIn content writing assistant. Your task is to rewrite and enhance a user's draft to make it professional, polished, and engaging for a LinkedIn audience.

    **User's Draft Post:**
    ---
    {{{draftText}}}
    ---

    {{#if notes}}
    **User's Notes:**
    ---
    {{{notes}}}
    ---
    {{/if}}

    **Your Instructions:**

    1.  **Enhance the Post**: Rewrite the draft to improve its clarity, flow, and style. Ensure it sounds professional and human-like.
        -   Incorporate any specific instructions from the user's notes.
        -   Do not change the core message or meaning of the post.
        -   Add 3-6 relevant, trending hashtags at the very end of the post.
        -   Place the final, enhanced post content in the \`enhancedPost\` field.

    2.  **Explain the Improvements**: In the \`explanation\` field, provide a concise, bullet-point summary of the key changes you made and why they improve the post. For example:
        -   "Restructured the opening for a stronger hook."
        -   "Simplified complex sentences for better readability."
        -   "Added relevant hashtags to increase visibility."

    3.  **JSON Output**: Ensure your entire output is a single, valid JSON object that strictly adheres to the schema.
  `,
});


// ========== Flow Definition ==========

const enhanceLinkedInPostFlow = ai.defineFlow(
  {
    name: 'enhanceLinkedInPostFlow',
    inputSchema: LinkedInPostRequestSchema,
    outputSchema: LinkedInPostResponseSchema,
  },
  async (input) => {
    const { output } = await linkedInPostPrompt(input);
    if (!output) {
      throw new Error('The AI failed to generate an enhanced post. Please try again.');
    }
    return output;
  }
);

// ========== API Function Export ==========

export async function enhanceLinkedInPost(
  input: LinkedInPostRequest
): Promise<LinkedInPostResponse> {
  return await enhanceLinkedInPostFlow(input);
}
