
import { z } from 'zod';

export const PresentationTemplateSchema = z.enum([
    'default', 'professional', 'creative', 'technical', 'minimalist', 
    'dark', 'playful', 'academic', 'corporate', 'elegant'
]);
export type PresentationTemplate = z.infer<typeof PresentationTemplateSchema>;

export const PresentationToneSchema = z.enum([
    'Professional', 'Educational', 'Creative', 'Technical / Data-driven', 'Marketing / Sales pitch'
]);
export type PresentationTone = z.infer<typeof PresentationToneSchema>;


export const PresentationRequestSchema = z.object({
  generationType: z.enum(['from_topic', 'from_text']),
  topic: z.string().optional(),
  sourceText: z.string().optional(),
  audience: z.string().min(3, { message: 'Audience must be at least 3 characters.' }),
  numSlides: z.coerce.number().min(3, { message: 'Must generate at least 3 slides.' }).max(15, { message: 'Cannot generate more than 15 slides.' }),
  tone: PresentationToneSchema,
  template: PresentationTemplateSchema,
}).refine(data => data.generationType === 'from_topic' ? !!data.topic : !!data.sourceText, {
    message: "Topic is required for topic-based generation, and source text is required for text-based generation.",
    path: ["topic"],
});

export type PresentationRequest = z.infer<typeof PresentationRequestSchema>;

export const SlideSchema = z.object({
  title: z.string().describe("The title of the slide."),
  content: z.array(z.string()).describe("An array of bullet points for the slide's main content."),
  speakerNotes: z.string().describe("Notes for the presenter for this specific slide."),
  layout: z.enum(['text-and-visual', 'text-only', 'visual-only', 'title']).describe("The suggested layout for the slide.").optional(),
  visualSuggestion: z.string().optional().describe("A brief, one or two-word suggestion for a visual element (e.g., 'bar chart', 'lightbulb icon', 'team photo')."),
});

export type Slide = z.infer<typeof SlideSchema>;

export const PresentationResponseSchema = z.object({
  title: z.string().describe("An engaging title for the overall presentation."),
  slides: z.array(SlideSchema).describe("An array of slide objects."),
});

export type PresentationResponse = z.infer<typeof PresentationResponseSchema>;
