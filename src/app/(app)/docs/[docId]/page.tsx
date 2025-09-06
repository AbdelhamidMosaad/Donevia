
'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useParams, useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Doc } from '@/lib/types';
import { DocEditor } from '@/components/docs/doc-editor';
import { WelcomeScreen } from '@/components/welcome-screen';


export default function DocPage() {
  const { user, loading } = useAuth();
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const docId = params.docId as string;

  const [docData, setDocData] = useState<Doc | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) {
        router.push('/');
        return;
    }
    if (!docId) return;

    const docRef = doc(db, 'users', user.uid, 'docs', docId);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setDocData({ id: docSnap.id, ...docSnap.data() } as Doc);
      } else {
        toast({ variant: 'destructive', title: 'Document not found' });
        router.push('/docs');
      }
    });

    return () => unsubscribe();
  }, [user, docId, loading, router, toast]);


  if (loading || !docData) {
    return <WelcomeScreen />;
  }

  return (
    <div className="h-full flex flex-col">
        <DocEditor key={docData.id} doc={docData} />
    </div>
  );
}
