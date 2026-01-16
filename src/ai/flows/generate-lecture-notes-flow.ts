'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const LectureNotesRequestSchema = z.object({
  sourceText: z.string().min(50, { message: 'Source text must be at least 50 characters.' }),
});
export type LectureNotesRequest = z.infer<typeof LectureNotesRequestSchema>;

const LectureNotesResponseSchema = z.object({
  title: z.string().describe("A concise and relevant title for the generated material."),
  learningObjectives: z.array(z.string()).describe("An array of 3-5 key learning objectives based on the source text."),
  notes: z.string().describe("The main body of the notes, structured with Markdown headings, lists, and bolded key terms."),
  learningSummary: z.string().describe("A 2-3 sentence paragraph that concisely summarizes the key takeaways of the lecture notes."),
});
export type LectureNotesResponse = z.infer<typeof LectureNotesResponseSchema>;

// ========== Helper: Text Chunking ==========

const chunkText = (text: string, maxChunkSize: number = 4000): string[] => {
  const chunks: string[] = [];
  const paragraphs = text.split('\n\n');
  
  let currentChunk = '';
  
  for (const paragraph of paragraphs) {
    if (currentChunk.length + paragraph.length > maxChunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = paragraph + '\n\n';
    } else {
      currentChunk += paragraph + '\n\n';
    }
  }
  
  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks;
};

// ========== Helper: Delay Function ==========

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// ========== STEP 1: Process Single Chunk (Optimized) ==========

const ChunkNotesSchema = z.object({
    notes: z.string().describe("Structured notes for this chunk."),
});

const chunkNotesPrompt = ai.definePrompt({
    name: 'chunkLectureNotesPrompt',
    input: { schema: z.object({ 
        chunk: z.string(),
        chunkNumber: z.number(),
        totalChunks: z.number(),
        overallTopic: z.string().optional(),
    }) },
    output: { schema: ChunkNotesSchema },
    model: 'googleai/gemini-2.5-flash',
    prompt: `
        Role: Act as a Senior University Teaching Assistant and Subject Matter Expert.

        Task: Process part {{chunkNumber}} of {{totalChunks}} of lecture material.
        {{#if overallTopic}}Overall topic: {{overallTopic}}{{/if}}

        Instructions:
        1. Focus ONLY on the text provided in this chunk.
        2. Create structured notes using Markdown formatting.
        3. Use **bolding** for key terms and concepts.
        4. Use bullet points for lists.
        5. Do not include titles, introductions, or conclusions - just the core content.
        6. Be concise but comprehensive.

        ---
        **Text to Process (Part {{chunkNumber}}/{{totalChunks}}):**
        {{{chunk}}}
        ---
    `
});

// ========== STEP 2: Generate Title from Source ==========

const TitleSchema = z.object({
    title: z.string().describe("A concise and relevant title for the entire material."),
    mainTopics: z.array(z.string()).describe("2-3 main topics identified in the text"),
});

const titlePrompt = ai.definePrompt({
    name: 'lectureTitlePrompt',
    input: { schema: z.object({ 
        sourceText: z.string(),
    }) },
    output: { schema: TitleSchema },
    model: 'googleai/gemini-2.5-flash',
    prompt: `
        Analyze this text and create:
        1. A concise, descriptive title for the entire content
        2. 2-3 main topics covered
        
        Return only the title and topics.

        ---
        **Text:**
        {{{sourceText}}}
        ---
    `
});

// ========== STEP 3: Combine Notes ==========

const CombineNotesSchema = z.object({
    combinedNotes: z.string().describe("Well-structured, comprehensive notes combining all chunks."),
});

const combineNotesPrompt = ai.definePrompt({
    name: 'combineLectureNotesPrompt',
    input: { schema: z.object({ 
        chunkNotes: z.array(z.string()),
        title: z.string(),
        mainTopics: z.array(z.string()),
    }) },
    output: { schema: CombineNotesSchema },
    model: 'googleai/gemini-2.5-flash',
    prompt: `
        Role: Senior Editor and Academic Content Specialist

        Task: Combine multiple sets of lecture notes into a single, coherent document.

        Instructions:
        1. Start with the title: # {{{title}}}
        2. Organize content around these main topics: {{#each mainTopics}}- {{this}}
{{/each}}
        3. Synthesize all provided notes into a unified structure
        4. Remove redundancies
        5. Ensure logical flow between sections
        6. Maintain proper Markdown formatting
        7. Keep **bolded** key terms

        ---
        **Notes to Combine:**
        {{#each chunkNotes}}
        --- Part {{@index_1}} ---
        {{this}}
        {{/each}}
        ---
    `
});

// ========== STEP 4: Generate Summary and Objectives ==========

const SummaryResponseSchema = z.object({
    learningObjectives: z.array(z.string()).describe("An array of 3-5 key learning objectives based on the provided notes."),
    learningSummary: z.string().describe("A 2-3 sentence paragraph that concisely summarizes the key takeaways of the notes."),
});

const summaryPrompt = ai.definePrompt({
    name: 'lectureSummaryPrompt',
    input: { schema: z.object({ notes: z.string() }) },
    output: { schema: SummaryResponseSchema },
    model: 'googleai/gemini-2.5-flash',
    prompt: `
        Based on these lecture notes, generate:
        1. 3-5 key learning objectives
        2. A 2-3 sentence summary

        ---
        **Notes:**
        {{{notes}}}
        ---
    `
});

// ========== Main Flow with Sequential Processing ==========

const generateLectureNotesFlow = ai.defineFlow(
  {
    name: 'generateLectureNotesFlow',
    inputSchema: LectureNotesRequestSchema,
    outputSchema: LectureNotesResponseSchema,
  },
  async (input) => {
    const { sourceText } = input;
    
    console.log('Starting lecture notes generation...');
    
    // 1. First, generate title and main topics (1 API call)
    console.log('Generating title and main topics...');
    const titleResult = await titlePrompt({ sourceText: sourceText.substring(0, 5000) });
    
    if (!titleResult.output) {
      throw new Error('Failed to generate title and topics');
    }
    
    const { title, mainTopics } = titleResult.output;
    console.log(`Title: ${title}`);
    console.log(`Main topics: ${mainTopics.join(', ')}`);
    
    // 2. Chunk the source text
    const chunks = chunkText(sourceText, 3500);
    console.log(`Text divided into ${chunks.length} chunks`);
    
    // 3. Process chunks SEQUENTIALLY with delays to avoid rate limits
    const chunkNotes: string[] = [];
    
    for (let i = 0; i < chunks.length; i++) {
      console.log(`Processing chunk ${i + 1} of ${chunks.length}...`);
      
      try {
        const chunkResult = await chunkNotesPrompt({
          chunk: chunks[i],
          chunkNumber: i + 1,
          totalChunks: chunks.length,
          overallTopic: mainTopics[0] // Pass main topic for context
        });
        
        if (chunkResult.output?.notes) {
          chunkNotes.push(chunkResult.output.notes);
        }
        
        // Add delay between API calls (15 seconds for free tier safety)
        if (i < chunks.length - 1) {
          console.log(`Waiting 15 seconds before next API call...`);
          await delay(15000); // 15 seconds delay
        }
        
      } catch (error) {
        console.error(`Error processing chunk ${i + 1}:`, error);
        // Continue with other chunks even if one fails
        chunkNotes.push(`*[Content from chunk ${i + 1} could not be processed]*`);
      }
    }
    
    if (chunkNotes.length === 0) {
      throw new Error('Failed to process any text chunks');
    }
    
    console.log(`Successfully processed ${chunkNotes.length} chunks`);
    
    // 4. Combine notes (1 API call)
    console.log('Combining notes...');
    const combineResult = await combineNotesPrompt({
      chunkNotes,
      title,
      mainTopics
    });
    
    if (!combineResult.output?.combinedNotes) {
      throw new Error('Failed to combine notes');
    }
    
    const notes = combineResult.output.combinedNotes;
    
    // 5. Generate summary and objectives (1 API call)
    console.log('Generating summary and objectives...');
    const summaryResult = await summaryPrompt({ notes });
    
    if (!summaryResult.output) {
      throw new Error('Failed to generate summary and objectives');
    }
    
    const { learningObjectives, learningSummary } = summaryResult.output;
    
    console.log('Lecture notes generation completed successfully');
    
    return {
      title,
      notes,
      learningObjectives,
      learningSummary,
    };
  }
);

// ========== Alternative: Single-Pass Approach (Fewer API calls) ==========

const SinglePassSchema = z.object({
  title: z.string(),
  notes: z.string(),
  learningObjectives: z.array(z.string()),
  learningSummary: z.string(),
});

const singlePassPrompt = ai.definePrompt({
  name: 'singlePassLectureNotesPrompt',
  input: { schema: LectureNotesRequestSchema },
  output: { schema: SinglePassSchema },
  model: 'googleai/gemini-2.5-flash',
  config: {
    maxOutputTokens: 4096, // Request more tokens
  },
  prompt: `
    Role: Senior University Teaching Assistant and Subject Matter Expert

    Task: Create comprehensive lecture notes from the source text in ONE PASS.

    IMPORTANT INSTRUCTIONS:
    1. You MUST cover ALL key points from the ENTIRE source text
    2. Be selective - focus on the most important 80% of content
    3. Use this structure exactly:
    
    # [Concise Title Here]
    
    ## Learning Objectives
    - [Objective 1]
    - [Objective 2]
    - [Objective 3]
    - [Objective 4]
    
    ## Notes
    [Structured notes with Markdown headings, **bolded terms**, and bullet points]
    
    ## Summary
    [2-3 sentence summary here]

    4. If the text is very long, create a HIGH-LEVEL overview covering all main sections
    5. Use **bold** for key terms
    6. Be concise but thorough

    ---
    **Source Text:**
    {{{sourceText}}}
    ---
  `
});

// ========== Fallback Function for Rate Limits ==========

export async function generateLectureNotes(
  input: LectureNotesRequest
): Promise<LectureNotesResponse> {
  try {
    // Strategy 1: Try single-pass approach first (fewer API calls)
    console.log('Attempting single-pass approach...');
    
    const singlePassResult = await singlePassPrompt(input);
    
    if (singlePassResult.output) {
      console.log('Single-pass approach succeeded');
      return singlePassResult.output;
    }
    
  } catch (singlePassError) {
    console.log('Single-pass failed, falling back to chunked approach...', singlePassError);
    
    // Strategy 2: Fall back to chunked approach if single-pass fails
    try {
      const result = await generateLectureNotesFlow(input);
      return result;
    } catch (chunkedError) {
      console.error('Both approaches failed:', chunkedError);
      
      // Strategy 3: Return a basic version with error message
      return {
        title: "Lecture Notes",
        notes: `# Notes Generation Issue\n\nDue to rate limits, we could not process the full text. Please try again in a minute or use shorter text.\n\n**First portion of your text:**\n${input.sourceText.substring(0, 1000)}...`,
        learningObjectives: ["Understand the main concepts", "Apply key principles", "Analyze core topics"],
        learningSummary: "The system encountered rate limiting issues. Please try again with shorter text or wait before retrying."
      };
    }
  }
  
  throw new Error('Failed to generate lecture notes');
}