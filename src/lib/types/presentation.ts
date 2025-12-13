
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

export const SlideSizeSchema = z.enum(['16:9', '4:3']);
export type SlideSize = z.infer<typeof SlideSizeSchema>;

const VisualDetailSchema = z.object({
  type: z.enum(['process', 'cycle', 'pyramid', 'timeline', 'chart', 'icon', 'image']).describe("The type of visual to generate."),
  items: z.array(z.string()).optional().describe("A list of text items for the visual (e.g., steps in a process, items in a cycle)."),
}).describe("A structured object representing a suggested visual aid.");

export const PresentationRequestSchema = z.object({
  generationType: z.enum(['from_topic', 'from_text']),
  topic: z.string().optional(),
  sourceText: z.string().optional(),
  numSlides: z.coerce.number().min(3, { message: 'Must generate at least 3 slides.' }).max(30, { message: 'Cannot generate more than 30 slides.' }),
  tone: PresentationToneSchema,
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
  visual: VisualDetailSchema.optional().describe("A structured object describing the visual for the slide."),
});

export type Slide = z.infer<typeof SlideSchema>;

export const PresentationResponseSchema = z.object({
  title: z.string().describe("An engaging title for the overall presentation."),
  slides: z.array(SlideSchema).describe("An array of slide objects."),
});

export type PresentationResponse = z.infer<typeof PresentationResponseSchema>;
