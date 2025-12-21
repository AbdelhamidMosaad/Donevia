// src/components/be-creative/presentation-generator.tsx
'use client';

import { useEffect, useState } from 'react';

export default function PresentationGenerator() {
  const [PptxGenJS, setPptxGenJS] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadPptx = async () => {
      try {
        // Dynamic import to ensure it only runs on client
        const module = await import('pptxgenjs');
        setPptxGenJS(module.default || module);
      } catch (error) {
        console.error('Failed to load pptxgenjs:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadPptx();
  }, []);

  if (isLoading) {
    return <div>Loading presentation tool...</div>;
  }

  if (!PptxGenJS) {
    return <div>Failed to load presentation tool</div>;
  }

  // Your component logic here using PptxGenJS
  return (
    <div>
      {/* Your presentation generator UI */}
    </div>
  );
}