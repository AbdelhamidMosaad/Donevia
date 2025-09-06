
'use client';

import { useState, useEffect, useMemo } from 'react';
import type { Page, Revision } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { diff_match_patch, DIFF_DELETE, DIFF_INSERT, DIFF_EQUAL } from 'diff-match-patch';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface RevisionPreviewProps {
  revision: Revision | null;
  currentPage: Page;
  currentContent: any;
  onRestore: (content: any, title: string) => void;
}

function extractTextFromNode(node: any): string {
  if (node.type === 'text' && node.text) {
    return node.text;
  }
  if (node.content && Array.isArray(node.content)) {
    return node.content.map(extractTextFromNode).join('\n');
  }
  return '';
}

function renderDiff(diffs: [number, string][]) {
  return diffs.map(([type, text], index) => {
    switch (type) {
      case DIFF_INSERT:
        return <ins key={index} className="bg-green-500/20 text-green-800 dark:text-green-200">{text}</ins>;
      case DIFF_DELETE:
        return <del key={index} className="bg-red-500/20 text-red-800 dark:text-red-200">{text}</del>;
      case DIFF_EQUAL:
      default:
        return <span key={index}>{text}</span>;
    }
  });
}

export function RevisionPreview({ revision, currentPage, currentContent, onRestore }: RevisionPreviewProps) {
  
  const diffs = useMemo(() => {
    if (!revision) return null;
    const dmp = new diff_match_patch();
    const currentText = extractTextFromNode(currentContent);
    const revisionText = extractTextFromNode(revision.snapshot);
    const diff = dmp.diff_main(revisionText, currentText);
    dmp.diff_cleanupSemantic(diff);
    return diff;
  }, [revision, currentContent]);
  

  if (!revision) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground p-8 text-center">
        Select a version from the left to preview it.
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <h3 className="font-semibold">{revision.title}</h3>
        <p className="text-sm text-muted-foreground">
          Saved on {new Date(revision.createdAt.toDate()).toLocaleString()}
        </p>
      </div>
      <ScrollArea className="flex-1 p-4">
        <div className="prose dark:prose-invert prose-sm max-w-none whitespace-pre-wrap break-words">
            {diffs ? renderDiff(diffs) : <p>Could not compute difference.</p>}
        </div>
      </ScrollArea>
      <div className="p-4 border-t flex justify-end">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button>Restore This Version</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Restore Version?</AlertDialogTitle>
              <AlertDialogDescription>
                This will replace the current content of the page with the content from this version. The current content will be saved as a new revision.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => onRestore(revision.snapshot, revision.title)}>
                Restore
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
