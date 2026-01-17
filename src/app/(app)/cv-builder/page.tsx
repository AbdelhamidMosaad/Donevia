'use client';
import { CVBuilderForm } from "@/components/cv-builder/cv-builder-form";
import { CVBuilderIcon } from "@/components/icons/tools/cv-builder-icon";

export default function CVBuilderPage() {
  return (
    <div className="flex flex-col h-full gap-6">
      <div className="flex items-center gap-4">
        <CVBuilderIcon className="h-10 w-10 text-primary" />
        <div>
          <h1 className="text-3xl font-bold font-headline">ATS CV Builder</h1>
          <p className="text-muted-foreground">
            Create a professional, ATS-friendly resume with AI-powered suggestions.
          </p>
        </div>
      </div>
      <CVBuilderForm />
    </div>
  );
}
