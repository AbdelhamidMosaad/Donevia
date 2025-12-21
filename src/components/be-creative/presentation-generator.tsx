// src/components/be-creative/presentation-generator.tsx
'use client';

import { useEffect, useState } from 'react';

export default function PresentationGenerator() {
  const [PptxGenJS, setPptxGenJS] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadPptx = async () => {
      try {
        // FIX: Use the correct import path
        const module = await import('pptxgenjs');
        setPptxGenJS(module.default || module);
      } catch (error) {
        console.error('Failed to load pptxgenjs:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    // Only load on client side
    if (typeof window !== 'undefined') {
      loadPptx();
    }
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading presentation tool...</p>
        </div>
      </div>
    );
  }

  if (!PptxGenJS) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center p-6 border border-destructive/20 rounded-lg bg-destructive/5">
          <h3 className="text-lg font-semibold text-destructive mb-2">
            Presentation Tool Unavailable
          </h3>
          <p className="text-muted-foreground">
            The presentation generator failed to load. Please refresh the page.
          </p>
        </div>
      </div>
    );
  }

  // Your component logic here
  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Presentation Generator</h2>
        <p className="text-muted-foreground">
          Create beautiful presentations with AI assistance
        </p>
      </div>
      
      <div className="border rounded-lg p-6 bg-card">
        <p className="text-center text-muted-foreground">
          Presentation generator is ready to use!
        </p>
        <button
          onClick={() => {
            const pres = new PptxGenJS();
            pres.addSlide();
            pres.writeFile({ fileName: 'presentation.pptx' });
          }}
          className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Create Sample Presentation
        </button>
      </div>
    </div>
  );
}