
'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import type { Notebook, Section, Page } from '@/lib/types';
import { saveAs } from 'file-saver';
import { useToast } from '@/hooks/use-toast';
import { generateHTML } from '@tiptap/html';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import { htmlToMd } from 'html-to-md';
import Table from '@tiptap/extension-table'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import TableRow from '@tiptap/extension-table-row'


export function useNotebookExporter() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);

  const fetchNotebookData = async (notebookId: string) => {
    if (!user) throw new Error('User not authenticated');

    const sectionsQuery = query(
      collection(db, 'users', user.uid, 'sections'),
      where('notebookId', '==', notebookId),
      orderBy('order', 'asc')
    );
    const sectionsSnap = await getDocs(sectionsQuery);
    const sections = sectionsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Section));

    const pagesBySection: Record<string, Page[]> = {};
    for (const section of sections) {
      const pagesQuery = query(
        collection(db, 'users', user.uid, 'pages'),
        where('sectionId', '==', section.id),
        orderBy('createdAt', 'asc')
      );
      const pagesSnap = await getDocs(pagesQuery);
      pagesBySection[section.id] = pagesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Page));
    }

    return { sections, pagesBySection };
  };

  const convertTiptapToMarkdown = (content: any): string => {
    try {
        const html = generateHTML(content, [
            StarterKit,
            Underline,
            Link.configure({ openOnClick: false, autolink: false }),
            Table.configure({
                resizable: true,
            }),
            TableRow,
            TableHeader,
            TableCell,
        ]);

        return htmlToMd(html);
    } catch (e) {
        console.error("Error converting to markdown", e);
        return "Error converting content.";
    }
  };

  const exportNotebook = async (notebook: Notebook, format: 'json' | 'markdown') => {
    setIsExporting(true);
    toast({ title: 'Exporting...', description: `Preparing "${notebook.title}" for export.` });

    try {
      const { sections, pagesBySection } = await fetchNotebookData(notebook.id);

      let fileContent = '';
      let fileExtension = '';

      if (format === 'json') {
        const exportData = {
          notebook,
          sections: sections.map(section => ({
            ...section,
            pages: pagesBySection[section.id] || [],
          })),
        };
        fileContent = JSON.stringify(exportData, null, 2);
        fileExtension = 'json';
      } else if (format === 'markdown') {
        let mdContent = `# ${notebook.title}\n\n`;
        sections.forEach(section => {
          mdContent += `## ${section.title}\n\n`;
          const pages = pagesBySection[section.id] || [];
          pages.forEach(page => {
            mdContent += `### ${page.title}\n\n`;
            mdContent += convertTiptapToMarkdown(page.content);
            mdContent += '\n\n---\n\n';
          });
        });
        fileContent = mdContent;
        fileExtension = 'md';
      }

      const blob = new Blob([fileContent], { type: `text/${fileExtension};charset=utf-8` });
      saveAs(blob, `${notebook.title}.${fileExtension}`);
      toast({ title: 'Export complete!', description: `"${notebook.title}" has been downloaded.` });

    } catch (error) {
      console.error('Export failed:', error);
      toast({ variant: 'destructive', title: 'Export Failed', description: (error as Error).message });
    } finally {
      setIsExporting(false);
    }
  };

  return { exportNotebook, isExporting };
}
