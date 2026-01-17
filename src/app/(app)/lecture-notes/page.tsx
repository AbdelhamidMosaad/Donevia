'use client';

import { LectureNotesGenerator } from "@/components/lecture-notes-generator";
import { LectureNotesIcon } from "@/components/icons/tools/lecture-notes-icon";

export default function LectureNotesPage() {
  return (
    <div className="flex flex-col h-full gap-6">
      <div className="flex items-center gap-4">
        <LectureNotesIcon className="h-10 w-10 text-primary" />
        <div>
          <h1 className="text-3xl font-bold font-headline">Lecture Notes Generator</h1>
          <p className="text-muted-foreground">
            Automatically create structured lecture notes from your documents.
          </p>
        </div>
      </div>
      <LectureNotesGenerator />
    </div>
  );
}
