// src/components/be-creative/presentation-generator.tsx
'use client';

import { useEffect, useState } from 'react';
import PptxGenJS from 'pptxgenjs';

export default function PresentationGenerator() {
  const [pptx, setPptx] = useState<any>(null);

  useEffect(() => {
    // PptxGenJS is now directly imported, so we just create a new instance.
    setPptx(new PptxGenJS());
  }, []);
  
  if (!pptx) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading presentation tool...</p>
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
