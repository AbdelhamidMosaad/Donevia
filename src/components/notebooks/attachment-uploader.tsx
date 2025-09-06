
'use client';

import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { useAuth } from '@/hooks/use-auth';
import { uploadAttachmentClient } from '@/lib/client-helpers';
import { useToast } from '@/hooks/use-toast';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Attachment } from '@/lib/types';
import { UploadCloud, Paperclip, File as FileIcon, Image as ImageIcon } from 'lucide-react';
import { Progress } from '../ui/progress';
import Image from 'next/image';

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

    const q = query(collection(db, 'users', user.uid, 'attachments'), where('pageId', '==', pageId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const attachedFiles = snapshot.docs.map(doc => ({id: doc.id, ...doc.data()}) as Attachment);
        setAttachments(attachedFiles);
    });

    return () => unsubscribe();
  }, [user, pageId]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!user) return;
    
    for (const file of acceptedFiles) {
      // We don't have a good way to track progress with the current setup
      // So we'll just show an indeterminate progress bar.
      setUploadProgress(prev => ({ ...prev, [file.name]: 50 })); 
      try {
        await uploadAttachmentClient(pageId, file);
        toast({ title: 'Upload successful', description: `${file.name} has been attached.` });
        setUploadProgress(prev => ({...prev, [file.name]: 100}));
      } catch (error) {
        toast({ variant: 'destructive', title: 'Upload failed', description: (error as Error).message });
         delete uploadProgress[file.name];
      } finally {
        setTimeout(() => {
            setUploadProgress(prev => {
                const newProgress = {...prev};
                delete newProgress[file.name];
                return newProgress;
            });
        }, 1000);
      }
    }
  }, [user, pageId, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  return (
    <div className="mt-8">
        <h3 className="font-semibold text-lg mb-2 flex items-center gap-2"><Paperclip/> Attachments</h3>
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive ? 'border-primary bg-primary/10' : 'border-border hover:border-primary'
        }`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
            <UploadCloud className="h-10 w-10" />
            {isDragActive ? (
            <p>Drop the files here ...</p>
            ) : (
            <p>Drag 'n' drop some files here, or click to select files</p>
            )}
        </div>
      </div>
      
      {Object.keys(uploadProgress).length > 0 && (
          <div className="mt-4 space-y-2">
              {Object.entries(uploadProgress).map(([name, progress]) => (
                  <div key={name}>
                      <p className="text-sm font-medium">{name}</p>
                      <Progress value={progress} className="w-full h-2"/>
                  </div>
              ))}
          </div>
      )}

      {attachments.length > 0 && (
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {attachments.map(att => (
                  <a href={att.url} target="_blank" rel="noopener noreferrer" key={att.id}>
                      <div className="border rounded-lg p-2 flex flex-col items-center justify-center gap-2 hover:shadow-md transition-shadow h-32">
                          {att.thumbnailUrl ? (
                              <Image src={att.thumbnailUrl} alt={att.filename} width={64} height={64} className="object-cover rounded-md h-16 w-16"/>
                          ) : (
                              <FileIcon className="h-12 w-12 text-muted-foreground"/>
                          )}
                          <p className="text-xs text-center truncate w-full">{att.filename}</p>
                      </div>
                  </a>
              ))}
          </div>
      )}

    </div>
  );
}
