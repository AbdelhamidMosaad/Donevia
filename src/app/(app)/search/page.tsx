
'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, or } from 'firebase/firestore';
import type { Task, Doc, Client, StickyNote } from '@/lib/types';
import { Loader2, Search as SearchIcon } from 'lucide-react';
import Link from 'next/link';
import { capitalCase } from 'change-case-all';


type SearchResult = 
    | { type: 'task', data: Task & { matchField: string } }
    | { type: 'doc', data: Doc & { matchField: string } }
    | { type: 'client', data: Client & { matchField: string } }
    | { type: 'note', data: StickyNote & { matchField: string } };

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
            const qLower = queryTerm.toLowerCase();
            const qCapital = capitalCase(queryTerm);
            
            try {
                // To do a case-insensitive search, we query for both lowercase and capitalized versions.
                // Firestore doesn't support true case-insensitive queries natively.
                const searchTerms = Array.from(new Set([qLower, qCapital]));

                // Tasks: Search title and description
                const tasksRef = collection(db, 'users', user.uid, 'tasks');
                for (const term of searchTerms) {
                    const tasksTitleQuery = query(tasksRef, where('title', '>=', term), where('title', '<=', term + '\uf8ff'));
                    const tasksDescQuery = query(tasksRef, where('description', '>=', term), where('description', '<=', term + '\uf8ff'));
                    const [tasksTitleSnap, tasksDescSnap] = await Promise.all([getDocs(tasksTitleQuery), getDocs(tasksDescQuery)]);

                    tasksTitleSnap.forEach(doc => {
                        if (!allResults.some(r => r.data.id === doc.id)) {
                            allResults.push({ type: 'task', data: { id: doc.id, ...doc.data(), matchField: 'title' } as Task & { matchField: string }});
                        }
                    });
                     tasksDescSnap.forEach(doc => {
                        if (!allResults.some(r => r.data.id === doc.id)) {
                           allResults.push({ type: 'task', data: { id: doc.id, ...doc.data(), matchField: 'description' } as Task & { matchField: string }});
                        }
                    });
                }
                
                // Docs: Search title
                const docsRef = collection(db, 'users', user.uid, 'docs');
                 for (const term of searchTerms) {
                    const docsQuery = query(docsRef, where('title', '>=', term), where('title', '<=', term + '\uf8ff'));
                    const docsSnap = await getDocs(docsQuery);
                    docsSnap.forEach(doc => {
                        if (!allResults.some(r => r.data.id === doc.id)) {
                            allResults.push({ type: 'doc', data: { id: doc.id, ...doc.data(), matchField: 'title' } as Doc & { matchField: string }});
                        }
                    });
                }

                // Clients: Search name, company, email
                 const clientsRef = collection(db, 'users', user.uid, 'clients');
                 for (const term of searchTerms) {
                    const clientsQuery = query(clientsRef, or(
                        where('name', '>=', term),
                        where('name', '<=', term + '\uf8ff'),
                        where('company', '>=', term),
                        where('company', '<=', term + '\uf8ff'),
                        where('email', '>=', term),
                        where('email', '<=', term + '\uf8ff')
                    ));
                     const clientsSnap = await getDocs(clientsQuery);
                     clientsSnap.forEach(doc => {
                         if (!allResults.some(r => r.data.id === doc.id)) {
                            allResults.push({ type: 'client', data: { id: doc.id, ...doc.data(), matchField: 'details' } as Client & { matchField: string }});
                         }
                    });
                 }

                // Sticky Notes: Search title and text
                 const notesRef = collection(db, 'users', user.uid, 'stickyNotes');
                 for (const term of searchTerms) {
                    const notesQuery = query(notesRef, or(
                       where('title', '>=', term),
                       where('title', '<=', term + '\uf8ff'),
                       where('text', '>=', term),
                       where('text', '<=', term + '\uf8ff')
                    ));
                    const notesSnap = await getDocs(notesQuery);
                    notesSnap.forEach(doc => {
                        if (!allResults.some(r => r.data.id === doc.id)) {
                           allResults.push({ type: 'note', data: { id: doc.id, ...doc.data(), matchField: 'content' } as StickyNote & { matchField: string }});
                        }
                    });
                 }


                setResults(allResults);

            } catch (error) {
                console.error("Search failed:", error);
                 toast({ variant: "destructive", title: "Search Error", description: "Could not perform search. Please try again."})
            } finally {
                setIsLoading(false);
            }
        };

        performSearch();
    }, [queryTerm, user, authLoading, router]);

    const getResultLink = (result: SearchResult) => {
        switch (result.type) {
            case 'task': return `/dashboard/lists/${result.data.listId}`;
            case 'doc': return `/docs/${result.data.id}`;
            case 'client': return `/crm/clients/${result.data.id}`;
            case 'note': return `/notes`;
            default: return '#';
        }
    };
    
    const getResultDescription = (result: SearchResult) => {
        const data = result.data as any;
        switch (result.type) {
            case 'task': return data.description || `A task with priority: ${data.priority}`;
            case 'doc': return `A document updated on ${data.updatedAt?.toDate().toLocaleDateString()}`;
            case 'client': return data.email || data.phone || `Client since ${data.createdAt?.toDate().toLocaleDateString()}`;
            case 'note': return data.text || `A sticky note with priority: ${data.priority}`;
            default: return '';
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
                                <p className="text-sm text-muted-foreground mt-1 truncate">{getResultDescription(result)}</p>
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
