'use client';
import type { Doc, DocFolder } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileSignature, MoreHorizontal, Edit, Trash2, Move, Folder as FolderIcon } from 'lucide-react';
import { Button } from '../ui/button';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger } from '../ui/dropdown-menu';
import { useState, useRef, useEffect } from 'react';
import { Input } from '../ui/input';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';
import { useRouter } from 'next/navigation';

interface DocListListViewProps {
  docs: Doc[];
  folders: DocFolder[];
  onDelete: (docId: string) => void;
  onMove: (docId: string, folderId: string | null) => void;
}

export function DocListListView({ docs, folders, onDelete, onMove }: DocListListViewProps) {
  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  const [editingDocName, setEditingDocName] = useState('');
  const { user } = useAuth();
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, docId: string) => {
    if (e.key === 'Enter') handleFinishEdit(docId);
    else if (e.key === 'Escape') handleCancelEdit();
  };
  
  const handleNavigate = (e: React.MouseEvent, docId: string) => {
    e.preventDefault();
    if (editingDocId === docId) return;
    router.push(`/docs/${docId}`);
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Created At</TableHead>
            <TableHead>Last Updated</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {docs.map(document => (
            <TableRow key={document.id} onDoubleClick={(e) => handleNavigate(e, document.id)} className="cursor-pointer">
              <TableCell>
                {editingDocId === document.id ? (
                  <div className="flex items-center gap-2">
                    <FileSignature className="h-4 w-4 shrink-0" />
                    <Input 
                      ref={inputRef}
                      value={editingDocName}
                      onChange={(e) => setEditingDocName(e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, document.id)}
                      onBlur={() => handleFinishEdit(document.id)}
                      className="h-8"
                    />
                  </div>
                ) : (
                  <a href={`/docs/${document.id}`} onClick={(e) => handleNavigate(e, document.id)} className="flex items-center gap-2 font-medium text-primary hover:underline">
                      <FileSignature className="h-4 w-4" />
                      {document.title}
                  </a>
                )}
              </TableCell>
              <TableCell>{document.createdAt?.toDate().toLocaleDateString()}</TableCell>
              <TableCell>{document.updatedAt && typeof document.updatedAt.toDate === 'function' ? document.updatedAt.toDate().toLocaleDateString() : 'Just now'}</TableCell>
              <TableCell>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onSelect={() => handleStartEdit(document)}><Edit className="mr-2 h-4 w-4" />Rename</DropdownMenuItem>
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
                       <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive"><Trash2 className="mr-2 h-4 w-4"/>Delete</DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                              <AlertDialogHeader>
                                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will permanently delete the "{document.title}" document. This action cannot be undone.
                                  </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => onDelete(document.id)}>Delete</AlertDialogAction>
                              </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                    </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
