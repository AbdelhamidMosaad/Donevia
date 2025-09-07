
'use server';

import {
  generateStudyMaterial,
} from '@/ai/flows/generate-study-material';
import type { GenerateStudyGuideRequest, GenerateStudyGuideResponse } from '@/lib/types';


export async function generateStudyGuide(
  request: GenerateStudyGuideRequest
): Promise<{ htmlContent?: string; error?: string }> {
  try {
    const response = await generateStudyMaterial(request);
    return { htmlContent: response.htmlContent };
  } catch (e: any) {
    console.error(e);
    return { error: e.message || 'An unexpected error occurred.' };
  }
}
