
'use server';
/**
 * @fileOverview An AI flow for searching the web and retrieving content from URLs.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

// ========== Web Search Schemas ==========

const WebSearchRequestSchema = z.object({
  query: z.string().describe('The search query to find relevant web articles.'),
});

export type WebSearchRequest = z.infer<typeof WebSearchRequestSchema>;

const SearchResultSchema = z.object({
  title: z.string(),
  link: z.string().url(),
  snippet: z.string(),
});

const WebSearchResponseSchema = z.object({
  results: z.array(SearchResultSchema).describe('A list of relevant web search results.'),
});

export type WebSearchResponse = z.infer<typeof WebSearchResponseSchema>;

// ========== Content Fetching Schemas ==========

const FetchContentRequestSchema = z.object({
  urls: z.array(z.string().url()).describe('An array of URLs to fetch content from.'),
});

export type FetchContentRequest = z.infer<typeof FetchContentRequestSchema>;

const FetchedContentSchema = z.object({
  url: z.string().url(),
  content: z.string(),
});

const FetchContentResponseSchema = z.object({
  sources: z.array(FetchedContentSchema).describe('An array of objects containing the URL and its fetched text content.'),
});

export type FetchContentResponse = z.infer<typeof FetchContentResponseSchema>;


// ========== Search Prompt & Flow ==========

const webSearchTool = ai.defineTool(
  {
    name: 'webSearch',
    description: 'Search the web for a given query and return a list of relevant results with titles, links, and snippets.',
    inputSchema: z.object({ query: z.string() }),
    outputSchema: z.object({
      results: z.array(
        z.object({
          title: z.string(),
          link: z.string().url(),
          snippet: z.string(),
        })
      ),
    }),
  },
  async ({ query }) => {
    console.log(`Performing web search for: ${query}`);
    // This is a placeholder. In a real scenario, this would call a search API.
    // For now, we'll simulate a search result.
    // In a real implementation with a search tool, Genkit would handle this.
    // We are simulating what a tool like Google Custom Search or similar would return.
    return {
      results: [
        { title: `Introduction to ${query}`, link: `https://en.wikipedia.org/wiki/${query.replace(/ /g, '_')}`, snippet: `An overview of ${query}, its history, and key concepts.` },
        { title: `Getting Started with ${query}`, link: `https://www.google.com/search?q=getting+started+with+${query.replace(/ /g, '+')}`, snippet: `A tutorial on how to begin working with ${query}.` },
        { title: `Advanced ${query} Techniques`, link: `https://www.google.com/search?q=advanced+${query.replace(/ /g, '+')}`, snippet: `Explore advanced techniques and best practices for ${query}.` },
        { title: `The Future of ${query}`, link: `https://www.google.com/search?q=future+of+${query.replace(/ /g, '+')}`, snippet: `Predictions and trends related to the future of ${query}.` },
        { title: `Comparing ${query} with other technologies`, link: `https://www.google.com/search?q=${query.replace(/ /g, '+')}+vs`, snippet: `A comparison of ${query} against its alternatives.` },
      ]
    };
  }
);


const searchPrompt = ai.definePrompt({
    name: 'webSearchPrompt',
    tools: [webSearchTool],
    prompt: `Please search the web for "{{query}}"`
});

const searchFlow = ai.defineFlow({
    name: 'webSearchFlow',
    inputSchema: WebSearchRequestSchema,
    outputSchema: WebSearchResponseSchema
}, async ({ query }) => {
    const llmResponse = await searchPrompt({ query });
    const toolResponse = llmResponse.toolRequest?.tool?.(webSearchTool)?.output;

    if (!toolResponse?.results) {
        // Fallback if the tool doesn't work as expected in the environment
        console.warn("Web search tool did not return results, using fallback.");
        const fallbackResults = (await webSearchTool({query})).results;
        return { results: fallbackResults };
    }

    return { results: toolResponse.results };
});

export async function searchWeb(input: WebSearchRequest): Promise<WebSearchResponse> {
    return searchFlow(input);
}


// ========== Content Fetching Prompt & Flow ==========

async function fetchPageContent(url: string): Promise<string> {
    try {
        const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        if (!response.ok) {
            console.error(`Failed to fetch ${url}: ${response.statusText}`);
            return `Error: Could not retrieve content from ${url}. Status: ${response.status}`;
        }
        const html = await response.text();
        
        // Basic content extraction - this is a simplified approach
        const mainContentRegex = /<main[^>]*>([\s\S]*?)<\/main>|<article[^>]*>([\s\S]*?)<\/article>/i;
        const bodyContentRegex = /<body[^>]*>([\s\S]*?)<\/body>/i;
        
        let contentMatch = html.match(mainContentRegex);
        let textContent = contentMatch ? contentMatch[1] || contentMatch[2] : '';
        
        if (!textContent) {
            contentMatch = html.match(bodyContentRegex);
            textContent = contentMatch ? contentMatch[1] : html;
        }

        // Strip HTML tags and clean up text
        return textContent
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
    } catch (error) {
        console.error(`Error fetching or parsing ${url}:`, error);
        return `Error: Could not fetch or parse content from ${url}.`;
    }
}


const fetchContentFlow = ai.defineFlow({
    name: 'fetchWebContentFlow',
    inputSchema: FetchContentRequestSchema,
    outputSchema: FetchContentResponseSchema
}, async ({ urls }) => {
    const contentPromises = urls.map(url => 
        fetchPageContent(url).then(content => ({ url, content }))
    );

    const sources = await Promise.all(contentPromises);
    return { sources };
});


export async function fetchWebContent(input: FetchContentRequest): Promise<FetchContentResponse> {
    return fetchContentFlow(input);
}
