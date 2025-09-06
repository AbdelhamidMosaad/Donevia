
'use client';

import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { useAuth } from '@/hooks/use-auth';
import { uploadAttachmentClient } from '@/lib/client-helpers';
import { useToast } from '@/hooks/use-toast';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Attachment } from '@/lib/types';
import { UploadCloud, Paperclip, File as FileIcon, Trash2 } from 'lucide-react';
import { Progress } from '../ui/progress';
import Image from 'next/image';
import { Button } from '../ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';
import { deleteDoc, doc } from 'firebase/firestore';
import { deleteObject, ref } from 'firebase/storage';
import { storage } from '@/lib/firebase'; // Assuming you export storage from firebase config

interface AttachmentUploaderProps {
  pageId: string;
}

export function AttachmentUploader({ pageId }: AttachmentUploaderProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});

  useEffect(() => {
    if(!user || !pageId) return;

    const q = query(collection(db, 'users', user.uid, 'attachments'), where('pageId', '==', pageId), orderBy('uploadedAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const attachedFiles = snapshot.docs.map(doc => ({id: doc.id, ...doc.data()}) as Attachment);
        setAttachments(attachedFiles);
    });

    return () => unsubscribe();
  }, [user, pageId]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!user) return;
    
    for (const file of acceptedFiles) {
       if (file.size > 10 * 1024 * 1024) { // 10MB limit
         toast({ variant: 'destructive', title: 'File too large', description: `${file.name} exceeds the 10MB limit.`});
         continue;
       }
      setUploadProgress(prev => ({ ...prev, [file.name]: 0 })); 
      try {
        await uploadAttachmentClient(pageId, file, (progress) => {
          setUploadProgress(prev => ({...prev, [file.name]: progress}));
        });
        toast({ title: 'Upload successful', description: `${file.name} has been attached.` });
      } catch (error) {
        toast({ variant: 'destructive', title: 'Upload failed', description: (error as Error).message });
      } finally {
        setTimeout(() => {
            setUploadProgress(prev => {
                const newProgress = {...prev};
                delete newProgress[file.name];
                return newProgress;
            });
        }, 2000);
      }
    }
  }, [user, pageId, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, noClick: true });

  const handleDelete = async (attachment: Attachment) => {
    if (!user) return;
    try {
      // Delete Firestore document
      await deleteDoc(doc(db, 'users', user.uid, 'attachments', attachment.id));
      
      // Delete file from storage
      const fileRef = ref(storage, attachment.url);
      await deleteObject(fileRef);

      // Delete thumbnail from storage if it exists
      if(attachment.thumbnailUrl) {
        const thumbRef = ref(storage, attachment.thumbnailUrl);
        await deleteObject(thumbRef);
      }

      toast({ title: 'Attachment deleted', description: `${attachment.filename} has been removed.` });
    } catch (error) {
        console.error("Error deleting attachment: ", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete attachment.' });
    }
  }

  return (
    <div className="mt-8">
        <h3 className="font-semibold text-lg mb-2 flex items-center gap-2"><Paperclip/> Attachments</h3>
      <div {...getRootProps()} className="relative">
        <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragActive ? 'border-primary bg-primary/10' : 'border-border'
            }`}
        >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                <UploadCloud className="h-10 w-10" />
                <p>Drag 'n' drop files here</p>
                <p className="text-xs">Maximum file size: 10MB</p>
            </div>
        </div>
        </div>
      
      {Object.keys(uploadProgress).length > 0 && (
          <div className="mt-4 space-y-2">
              <h4 className="font-medium">Uploading...</h4>
              {Object.entries(uploadProgress).map(([name, progress]) => (
                  <div key={name}>
                      <p className="text-sm font-medium truncate">{name}</p>
                      <Progress value={progress} className="w-full h-2"/>
                  </div>
              ))}
          </div>
      )}

      {attachments.length > 0 && (
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {attachments.map(att => (
                <div key={att.id} className="relative group border rounded-lg hover:shadow-md transition-shadow">
                  <a href={att.url} target="_blank" rel="noopener noreferrer" className="block p-2 flex flex-col items-center justify-center gap-2 h-36">
                      {att.thumbnailUrl ? (
                          <Image src={att.thumbnailUrl} alt={att.filename} width={80} height={80} className="object-cover rounded-md h-20 w-20"/>
                      ) : (
                          <FileIcon className="h-16 w-16 text-muted-foreground"/>
                      )}
                      <p className="text-xs text-center truncate w-full px-1">{att.filename}</p>
                  </a>
                   <AlertDialog>
                      <AlertDialogTrigger asChild>
                         <Button variant="destructive" size="icon" className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Trash2 className="h-3 w-3" />
                         </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Attachment?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{att.filename}"? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(att)}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                </div>
              ))}
          </div>
      )}

    </div>
  );
}
