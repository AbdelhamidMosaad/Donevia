
'use client';

import { useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { WelcomeScreen } from '@/components/welcome-screen';
import { BrainCircuit } from 'lucide-react';

export default function DocsRedirectPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      const findFirstDoc = async () => {
        const docsRef = collection(db, 'users', user.uid, 'docs');
        const q = query(docsRef, orderBy('createdAt', 'desc'), limit(1));
        const docSnap = await getDocs(q);
        if (!docSnap.empty) {
          const firstDocId = docSnap.docs[0].id;
          router.replace(`/docs/${firstDocId}`);
        } else {
          // If no docs, stay on this page which will show a welcome message.
        }
      };
      findFirstDoc();
    }
  }, [user, loading, router]);
  
  if (loading || !user) {
    return <WelcomeScreen />;
  }

  return (
     <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground p-8">
        <BrainCircuit className="h-16 w-16 mb-4" />
        <h2 className="text-xl font-semibold">Welcome to Docs</h2>
        <p>Create a new document from the sidebar to get started.</p>
    </div>
  );
}
