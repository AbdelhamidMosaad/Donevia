
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { FileText, PlusCircle, LayoutGrid, List } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { GenerateDialog } from '@/components/lecture-notes/generate-dialog';

export default function LectureNotesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);


  if (loading || !user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
            <h1 className="text-3xl font-bold font-headline">Lecture Notes</h1>
            <p className="text-muted-foreground">Generate, store, and manage your lecture notes.</p>
        </div>
        <div className="flex items-center gap-2">
            <Button onClick={() => setIsGenerateDialogOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Generate Notes
            </Button>
        </div>
      </div>
      
        <div className="flex flex-col items-center justify-center h-full text-center p-8 border rounded-lg bg-muted/50">
            <FileText className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold font-headline">No Notes Yet</h3>
            <p className="text-muted-foreground">Click "Generate Notes" to create your first set of AI-powered lecture notes.</p>
        </div>
        
        <GenerateDialog open={isGenerateDialogOpen} onOpenChange={setIsGenerateDialogOpen} />
    </div>
  );
}
