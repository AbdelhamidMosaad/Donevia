
'use client';
import type { Doc, DocFolder } from '@/lib/types';
import { MoreHorizontal, Edit, Trash2, FileSignature, Move, Folder as FolderIcon } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent } from '../ui/dropdown-menu';
import { Button } from '../ui/button';
import { useState, useRef, useEffect } from 'react';
import { Input } from '../ui/input';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';
import { useRouter } from 'next/navigation';
import { Card } from '../ui/card';
import { cn } from '@/lib/utils';

interface DocListCardViewProps {
  docs: Doc[];
  folders: DocFolder[];
  onDelete: (docId: string) => void;
  onMove: (docId: string, folderId: string | null) => void;
  cardSize?: 'small' | 'medium' | 'large';
}

export function DocListCardView({ docs, folders, onDelete, onMove, cardSize = 'large' }: DocListCardViewProps) {
  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  const [editingDocName, setEditingDocName] = useState('');
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingDocId && inputRef.current) {
        inputRef.current.focus();
        inputRef.current.select();
    }
  }, [editingDocId]);

  const handleStartEdit = (doc: Doc) => {
    setEditingDocId(doc.id);
    setEditingDocName(doc.title);
  };

  const handleCancelEdit = () => {
    setEditingDocId(null);
    setEditingDocName('');
  };

  const handleFinishEdit = async (docId: string) => {
    if (!user) return;

    const originalDoc = docs.find(l => l.id === docId);
    const trimmedName = editingDocName.trim();
    
    handleCancelEdit();
    
    if (!trimmedName || !originalDoc) {
      toast({ variant: 'destructive', title: 'Error', description: 'Document name cannot be empty.' });
      return;
    }
    
    if (originalDoc.title === trimmedName) return;

    const docRef = doc(db, 'users', user.uid, 'docs', docId);
    try {
      await updateDoc(docRef, { title: trimmedName });
      toast({ title: '✓ Document Updated', description: `Document renamed to "${trimmedName}".` });
    } catch (e) {
      console.error("Error updating document: ", e);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to rename document.' });
    }
  };

  const handleNavigate = (e: React.MouseEvent, docId: string) => {
    e.preventDefault();
    if (editingDocId === docId) return;
    router.push(`/docs/${docId}`);
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, docId: string) => {
    if (e.key === 'Enter') handleFinishEdit(docId);
    else if (e.key === 'Escape') handleCancelEdit();
  };

  return (
     <div className={cn(
        "grid gap-6",
        cardSize === 'large' && "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5",
        cardSize === 'medium' && "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6",
        cardSize === 'small' && "grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7"
    )}>
      {docs.map(document => (
        <a key={document.id} href={`/docs/${document.id}`} onClick={(e) => handleNavigate(e, document.id)} className="block cursor-pointer group">
            <Card className="relative h-full overflow-hidden rounded-2xl bg-card/60 backdrop-blur-sm border-white/20 shadow-lg transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-xl cursor-pointer">
              <div className={cn(
                    "p-6 flex flex-col items-center text-center h-full justify-center",
                    cardSize === 'medium' && 'p-4',
                    cardSize === 'small' && 'p-3'
                )}>
                  <FileSignature className={cn(
                    "mb-4 text-primary",
                    cardSize === 'large' && 'h-24 w-24',
                    cardSize === 'medium' && 'h-16 w-16',
                    cardSize === 'small' && 'h-12 w-12 mb-2'
                  )} />
                  {editingDocId === document.id ? (
                    <Input 
                      ref={inputRef}
                      value={editingDocName}
                      onChange={(e) => setEditingDocName(e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, document.id)}
                      onBlur={() => handleFinishEdit(document.id)}
                      className="text-lg font-headline text-center bg-transparent"
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <h3 className={cn("font-bold font-headline text-foreground", 
                        cardSize === 'large' && 'text-lg',
                        cardSize === 'medium' && 'text-base',
                        cardSize === 'small' && 'text-sm'
                    )}>{document.title}</h3>
                  )}
                  {cardSize === 'large' && <p className="text-xs text-muted-foreground mt-1">
                    {document.updatedAt && typeof document.updatedAt.toDate === 'function' ? `Updated on ${document.updatedAt.toDate().toLocaleDateString()}` : 'Just now'}
                  </p>}
                </div>

                <div className="absolute top-2 right-2">
                    <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}>
                        <DropdownMenuItem onSelect={() => handleStartEdit(document)}><Edit className="mr-2 h-4 w-4" /> Rename</DropdownMenuItem>
                         <DropdownMenuSub>
                          <DropdownMenuSubTrigger>
                            <Move className="mr-2 h-4 w-4" />
                            Move to Folder
                          </DropdownMenuSubTrigger>
                          <DropdownMenuSubContent>
                            {document.folderId && 
                                <DropdownMenuItem onSelect={() => onMove(document.id, null)}>
                                    Remove from folder
                                </DropdownMenuItem>
                            }
                            {folders.map(folder => (
                              <DropdownMenuItem key={folder.id} onSelect={() => onMove(document.id, folder.id)} disabled={document.folderId === folder.id}>
                                <FolderIcon className="mr-2 h-4 w-4" />
                                {folder.name}
                              </DropdownMenuItem>
                            ))}
                            {folders.length === 0 && <DropdownMenuItem disabled>No folders created</DropdownMenuItem>}
                          </DropdownMenuSubContent>
                        </DropdownMenuSub>
                        <DropdownMenuSeparator />
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive w-full"><Trash2 className="mr-2 h-4 w-4"/> Delete</DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                    This will permanently delete the "{document.title}" document. This action cannot be undone.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => onDelete(document.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </Card>
          </a>
        ))}
    </div>
  );
}
