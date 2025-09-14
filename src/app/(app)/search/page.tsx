
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import type { Task, Doc, Client, StickyNote } from '@/lib/types';
import { Loader2, Search as SearchIcon } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

type SearchResult = 
    | { type: 'task', data: Task, match: { field: string, text: string } }
    | { type: 'doc', data: Doc, match: { field: string, text: string } }
    | { type: 'client', data: Client, match: { field: string, text: string } }
    | { type: 'note', data: StickyNote, match: { field: string, text: string } };

function SearchResultsComponent() {
    const { user, loading: authLoading } = useAuth();
    const searchParams = useSearchParams();
    const router = useRouter();
    const { toast } = useToast();
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
            
            try {
                const term = queryTerm.toLowerCase();
                if (term.length < 2) {
                    toast({ variant: 'destructive', title: "Search query must be at least 2 characters." });
                    setIsLoading(false);
                    return;
                }
                
                const allResults: SearchResult[] = [];
                const resultIds = new Set<string>(); // To prevent duplicates in the list

                // 1. Fetch all data
                const tasksSnap = await getDocs(collection(db, 'users', user.uid, 'tasks'));
                const docsSnap = await getDocs(collection(db, 'users', user.uid, 'docs'));
                const clientsSnap = await getDocs(collection(db, 'users', user.uid, 'clients'));
                const notesSnap = await getDocs(collection(db, 'users', user.uid, 'stickyNotes'));

                // Helper to extract text from Tiptap content
                const getTextFromDocContent = (content: any): string => {
                    let text = '';
                    if (content?.content && Array.isArray(content.content)) {
                        for (const node of content.content) {
                            text += getTextFromDocContent(node);
                        }
                    } else if (node.text) {
                        text += node.text + ' ';
                    }
                    return text;
                };


                // 2. Search through data on the client side
                
                // Search Tasks
                tasksSnap.forEach(doc => {
                    const data = { id: doc.id, ...doc.data() } as Task;
                    if (resultIds.has(data.id)) return;
                    if (data.title.toLowerCase().includes(term)) {
                        allResults.push({ type: 'task', data, match: { field: 'title', text: data.title }});
                        resultIds.add(data.id);
                    } else if (data.description?.toLowerCase().includes(term)) {
                        allResults.push({ type: 'task', data, match: { field: 'description', text: data.description }});
                        resultIds.add(data.id);
                    }
                });

                // Search Docs
                docsSnap.forEach(doc => {
                    const data = { id: doc.id, ...doc.data() } as Doc;
                    if (resultIds.has(data.id)) return;
                    
                    const contentText = getTextFromDocContent(data.content);

                    if (data.title.toLowerCase().includes(term)) {
                        allResults.push({ type: 'doc', data, match: { field: 'title', text: data.title }});
                        resultIds.add(data.id);
                    } else if (contentText.toLowerCase().includes(term)) {
                         allResults.push({ type: 'doc', data, match: { field: 'content', text: contentText.substring(0, 100) + '...' }});
                        resultIds.add(data.id);
                    }
                });

                // Search Clients
                clientsSnap.forEach(doc => {
                    const data = { id: doc.id, ...doc.data() } as Client;
                    if (resultIds.has(data.id)) return;
                    if (data.name?.toLowerCase().includes(term)) {
                        allResults.push({ type: 'client', data, match: { field: 'name', text: data.name }});
                        resultIds.add(data.id);
                    } else if (data.company?.toLowerCase().includes(term)) {
                        allResults.push({ type: 'client', data, match: { field: 'company', text: data.company }});
                        resultIds.add(data.id);
                    } else if (data.email?.toLowerCase().includes(term)) {
                         allResults.push({ type: 'client', data, match: { field: 'email', text: data.email }});
                        resultIds.add(data.id);
                    }
                });
                
                // Search Sticky Notes
                notesSnap.forEach(doc => {
                    const data = { id: doc.id, ...doc.data() } as StickyNote;
                    if (resultIds.has(data.id)) return;
                     if (data.title.toLowerCase().includes(term)) {
                        allResults.push({ type: 'note', data, match: { field: 'title', text: data.title }});
                        resultIds.add(data.id);
                    } else if (data.text?.toLowerCase().includes(term)) {
                        allResults.push({ type: 'note', data, match: { field: 'text', text: data.text.substring(0, 100) + '...' }});
                        resultIds.add(data.id);
                    }
                });

                setResults(allResults);

            } catch (error) {
                console.error("Search failed:", error);
                 toast({ variant: "destructive", title: "Search Error", description: "Could not perform search. Please try again."})
            } finally {
                setIsLoading(false);
            }
        };

        performSearch();
    }, [queryTerm, user, authLoading, router, toast]);

    const getResultLink = (result: SearchResult) => {
        switch (result.type) {
            case 'task': return `/dashboard/list/${result.data.listId}`;
            case 'doc': return `/docs/${result.data.id}`;
            case 'client': return `/crm/clients/${result.data.id}`;
            case 'note': return `/notes`;
            default: return '#';
        }
    };
    
    const getResultDescription = (result: SearchResult) => {
        return `Match in ${result.match.field}: "${result.match.text}"`;
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
                                    <p className="font-semibold text-primary">{result.data.title || (result.data as Client).name || (result.data as Client).company}</p>
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
