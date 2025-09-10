
'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, or } from 'firebase/firestore';
import type { Task, Doc, Client, StickyNote } from '@/lib/types';
import { Loader2, Search as SearchIcon } from 'lucide-react';
import Link from 'next/link';

type SearchResult = 
    | { type: 'task', data: Task }
    | { type: 'doc', data: Doc }
    | { type: 'client', data: Client }
    | { type: 'note', data: StickyNote };

function SearchResultsComponent() {
    const { user, loading: authLoading } = useAuth();
    const searchParams = useSearchParams();
    const router = useRouter();
    const queryTerm = searchParams.get('q');

    const [results, setResults] = useState<SearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!queryTerm) return;
        if (authLoading) return;
        if (!user) {
            router.push('/');
            return;
        }

        const performSearch = async () => {
            setIsLoading(true);
            setResults([]);
            const allResults: SearchResult[] = [];
            const q = queryTerm.toLowerCase();

            try {
                // Search Tasks
                const tasksRef = collection(db, 'users', user.uid, 'tasks');
                const tasksQuery = query(tasksRef, or(
                    where('title', '>=', q),
                    where('title', '<=', q + '\uf8ff')
                ));
                const tasksSnap = await getDocs(tasksQuery);
                tasksSnap.forEach(doc => {
                    if (doc.data().title.toLowerCase().includes(q)) {
                       allResults.push({ type: 'task', data: { id: doc.id, ...doc.data() } as Task });
                    }
                });

                // Search Docs
                const docsRef = collection(db, 'users', user.uid, 'docs');
                const docsQuery = query(docsRef, or(
                    where('title', '>=', q),
                    where('title', '<=', q + '\uf8ff')
                ));
                const docsSnap = await getDocs(docsQuery);
                docsSnap.forEach(doc => {
                     if (doc.data().title.toLowerCase().includes(q)) {
                        allResults.push({ type: 'doc', data: { id: doc.id, ...doc.data() } as Doc });
                     }
                });

                // Search Clients
                const clientsRef = collection(db, 'users', user.uid, 'clients');
                const clientsQuery = query(clientsRef, or(
                    where('name', '>=', q),
                    where('name', '<=', q + '\uf8ff')
                ));
                const clientsSnap = await getDocs(clientsQuery);
                clientsSnap.forEach(doc => {
                    if (doc.data().name.toLowerCase().includes(q)) {
                        allResults.push({ type: 'client', data: { id: doc.id, ...doc.data() } as Client });
                    }
                });
                
                // Search Sticky Notes (simple case-sensitive for title)
                 const notesRef = collection(db, 'users', user.uid, 'stickyNotes');
                 const notesQuery = query(notesRef, or(
                    where('title', '>=', q),
                    where('title', '<=', q + '\uf8ff')
                 ));
                 const notesSnap = await getDocs(notesQuery);
                 notesSnap.forEach(doc => {
                     if (doc.data().title.toLowerCase().includes(q)) {
                        allResults.push({ type: 'note', data: { id: doc.id, ...doc.data() } as StickyNote });
                     }
                 });

                setResults(allResults);

            } catch (error) {
                console.error("Search failed:", error);
            } finally {
                setIsLoading(false);
            }
        };

        performSearch();
    }, [queryTerm, user, authLoading, router]);

    const getResultLink = (result: SearchResult) => {
        switch (result.type) {
            case 'task': return `/dashboard/list/${result.data.listId}`;
            case 'doc': return `/docs/${result.data.id}`;
            case 'client': return `/crm/clients/${result.data.id}`;
            case 'note': return `/notes`;
            default: return '#';
        }
    };

    if (!queryTerm) {
        return <div className="text-center text-muted-foreground">Please enter a search term in the header.</div>;
    }

    return (
        <div className="flex flex-col h-full gap-6">
             <div>
                <h1 className="text-3xl font-bold font-headline">Search Results</h1>
                <p className="text-muted-foreground">Showing results for: <span className="font-semibold text-foreground">"{queryTerm}"</span></p>
            </div>

            {isLoading ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                    <Loader2 className="h-12 w-12 text-primary animate-spin" />
                    <p className="mt-4 text-muted-foreground">Searching...</p>
                </div>
            ) : results.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center p-8 border rounded-lg bg-muted/50">
                    <SearchIcon className="h-16 w-16 text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold font-headline">No Results Found</h3>
                    <p className="text-muted-foreground">Your search for "{queryTerm}" did not return any results.</p>
                </div>
            ) : (
                <ul className="space-y-4">
                    {results.map((result, index) => (
                        <li key={`${result.type}-${result.data.id}-${index}`}>
                            <Link href={getResultLink(result)} className="block p-4 border rounded-lg hover:bg-muted transition-colors">
                                <div className="flex items-center justify-between">
                                    <p className="font-semibold text-primary">{result.data.title}</p>
                                    <span className="text-xs font-mono uppercase text-muted-foreground bg-secondary px-2 py-1 rounded-full">{result.type}</span>
                                </div>
                                {(result.data as any).description && <p className="text-sm text-muted-foreground mt-1 truncate">{(result.data as any).description}</p>}
                            </Link>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

export default function SearchPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <SearchResultsComponent />
        </Suspense>
    );
}
