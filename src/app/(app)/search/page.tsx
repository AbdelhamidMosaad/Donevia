
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, collectionGroup } from 'firebase/firestore';
import type { Task, Doc, Client, StickyNote, PlannerEvent, DocFolder, FlashcardFolder, StudyChapter, StudyTopic, FlashcardDeck, FlashcardToolCard, WorkActivity, ClientRequest, Trade, TradingStrategy, WatchlistItem, MeetingNote, MindMap, Whiteboard } from '@/lib/types';
import { Loader2, Search as SearchIcon } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

type SearchResult = 
    | { type: 'task', data: Task, match: { field: string, text: string } }
    | { type: 'doc', data: Doc, match: { field: string, text: string } }
    | { type: 'client', data: Client, match: { field: string, text: string } }
    | { type: 'clientRequest', data: ClientRequest, match: { field: string, text: string } }
    | { type: 'note', data: StickyNote, match: { field: string, text: string } }
    | { type: 'event', data: PlannerEvent, match: { field: string, text: string } }
    | { type: 'docFolder', data: DocFolder, match: { field: string, text: string } }
    | { type: 'flashcardFolder', data: FlashcardFolder, match: { field: string, text: string } }
    | { type: 'flashcardDeck', data: FlashcardDeck, match: { field: string, text: string } }
    | { type: 'flashcard', data: FlashcardToolCard, match: { field: string, text: string } }
    | { type: 'studyChapter', data: StudyChapter, match: { field: string, text: string } }
    | { type: 'studyTopic', data: StudyTopic, match: { field: string, text: string } }
    | { type: 'workActivity', data: WorkActivity, match: { field: string, text: string } }
    | { type: 'trade', data: Trade, match: { field: string, text: string } }
    | { type: 'tradingStrategy', data: TradingStrategy, match: { field: string, text: string } }
    | { type: 'watchlist', data: WatchlistItem, match: { field: string, text: string } }
    | { type: 'meetingNote', data: MeetingNote, match: { field: string, text: string } }
    | { type: 'mindmap', data: MindMap, match: { field: string, text: string } }
    | { type: 'whiteboard', data: Whiteboard, match: { field: string, text: string } };

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
                const [
                    tasksSnap, docsSnap, clientsSnap, notesSnap, eventsSnap,
                    docFoldersSnap, flashcardFoldersSnap, studyChaptersSnap, studyTopicsSnap,
                    flashcardDecksSnap, workActivitiesSnap, clientRequestsSnap,
                    tradesSnap, tradingStrategiesSnap, watchlistItemsSnap,
                    meetingNotesSnap, mindMapsSnap, whiteboardsSnap
                ] = await Promise.all([
                    getDocs(collection(db, 'users', user.uid, 'tasks')),
                    getDocs(collection(db, 'users', user.uid, 'docs')),
                    getDocs(collection(db, 'users', user.uid, 'clients')),
                    getDocs(collection(db, 'users', user.uid, 'stickyNotes')),
                    getDocs(collection(db, 'users', user.uid, 'plannerEvents')),
                    getDocs(collection(db, 'users', user.uid, 'docFolders')),
                    getDocs(collection(db, 'users', user.uid, 'flashcardFolders')),
                    getDocs(collection(db, 'users', user.uid, 'studyChapters')),
                    getDocs(collection(db, 'users', user.uid, 'studyTopics')),
                    getDocs(collection(db, 'users', user.uid, 'flashcardDecks')),
                    getDocs(collection(db, 'users', user.uid, 'workActivities')),
                    getDocs(collection(db, 'users', user.uid, 'clientRequests')),
                    getDocs(collection(db, 'users', user.uid, 'trades')),
                    getDocs(collection(db, 'users', user.uid, 'tradingStrategies')),
                    getDocs(collection(db, 'users', user.uid, 'watchlistItems')),
                    getDocs(collection(db, 'users', user.uid, 'meetingNotes')),
                    getDocs(collection(db, 'users', user.uid, 'mindMaps')),
                    getDocs(collection(db, 'users', user.uid, 'whiteboards')),
                ]);
                
                // Fetch all flashcards from all decks
                const flashcardsGroupQuery = query(collectionGroup(db, 'cards'));
                const flashcardsSnap = await getDocs(flashcardsGroupQuery);


                // Helper to extract text from Tiptap content
                const getTextFromDocContent = (content: any): string => {
                    let text = '';
                    if (!content) return text;
                    if (content.content && Array.isArray(content.content)) {
                        for (const childNode of content.content) {
                            text += getTextFromDocContent(childNode);
                        }
                    } else if (content.text) {
                        text += content.text + ' ';
                    }
                    return text;
                };

                // 2. Search through data on the client side
                
                tasksSnap.forEach(doc => {
                    const data = { id: doc.id, ...doc.data() } as Task;
                    if (resultIds.has(data.id)) return;
                    if (data.title.toLowerCase().includes(term)) { allResults.push({ type: 'task', data, match: { field: 'title', text: data.title }}); resultIds.add(data.id); } 
                    else if (data.description?.toLowerCase().includes(term)) { allResults.push({ type: 'task', data, match: { field: 'description', text: data.description }}); resultIds.add(data.id); }
                });

                docsSnap.forEach(doc => {
                    const data = { id: doc.id, ...doc.data() } as Doc;
                    if (resultIds.has(data.id)) return;
                    const contentText = getTextFromDocContent(data.content);
                    if (data.title.toLowerCase().includes(term)) { allResults.push({ type: 'doc', data, match: { field: 'title', text: data.title }}); resultIds.add(data.id); } 
                    else if (contentText.toLowerCase().includes(term)) { allResults.push({ type: 'doc', data, match: { field: 'content', text: contentText.substring(0, 100) + '...' }}); resultIds.add(data.id); }
                });

                clientsSnap.forEach(doc => {
                    const data = { id: doc.id, ...doc.data() } as Client;
                    if (resultIds.has(data.id)) return;
                    if (data.name?.toLowerCase().includes(term)) { allResults.push({ type: 'client', data, match: { field: 'name', text: data.name }}); resultIds.add(data.id); } 
                    else if (data.company?.toLowerCase().includes(term)) { allResults.push({ type: 'client', data, match: { field: 'company', text: data.company }}); resultIds.add(data.id); } 
                    else if (data.email?.toLowerCase().includes(term)) { allResults.push({ type: 'client', data, match: { field: 'email', text: data.email }}); resultIds.add(data.id); }
                });
                
                clientRequestsSnap.forEach(doc => {
                    const data = { id: doc.id, ...doc.data() } as ClientRequest;
                     if (resultIds.has(data.id)) return;
                    if(data.title.toLowerCase().includes(term)) { allResults.push({ type: 'clientRequest', data, match: { field: 'title', text: data.title }}); resultIds.add(data.id); }
                });
                
                notesSnap.forEach(doc => {
                    const data = { id: doc.id, ...doc.data() } as StickyNote;
                    if (resultIds.has(data.id)) return;
                     if (data.title.toLowerCase().includes(term)) { allResults.push({ type: 'note', data, match: { field: 'title', text: data.title }}); resultIds.add(data.id); } 
                     else if (data.text?.toLowerCase().includes(term)) { allResults.push({ type: 'note', data, match: { field: 'text', text: data.text.substring(0, 100) + '...' }}); resultIds.add(data.id); }
                });
                
                eventsSnap.forEach(doc => {
                    const data = { id: doc.id, ...doc.data() } as PlannerEvent;
                    if (resultIds.has(data.id)) return;
                     if (data.title.toLowerCase().includes(term)) { allResults.push({ type: 'event', data, match: { field: 'title', text: data.title }}); resultIds.add(data.id); } 
                     else if (data.description?.toLowerCase().includes(term)) { allResults.push({ type: 'event', data, match: { field: 'description', text: data.description.substring(0, 100) + '...' }}); resultIds.add(data.id); }
                });
                
                docFoldersSnap.forEach(doc => { const data = { id: doc.id, ...doc.data() } as DocFolder; if (resultIds.has(`docfolder-${data.id}`)) return; if (data.name.toLowerCase().includes(term)) { allResults.push({ type: 'docFolder', data, match: { field: 'name', text: data.name }}); resultIds.add(`docfolder-${data.id}`); } });
                flashcardFoldersSnap.forEach(doc => { const data = { id: doc.id, ...doc.data() } as FlashcardFolder; if (resultIds.has(`flashcardfolder-${data.id}`)) return; if (data.name.toLowerCase().includes(term)) { allResults.push({ type: 'flashcardFolder', data, match: { field: 'name', text: data.name }}); resultIds.add(`flashcardfolder-${data.id}`); } });
                flashcardDecksSnap.forEach(doc => { const data = { id: doc.id, ...doc.data() } as FlashcardDeck; if (resultIds.has(`deck-${data.id}`)) return; if (data.name.toLowerCase().includes(term)) { allResults.push({ type: 'flashcardDeck', data, match: { field: 'name', text: data.name }}); resultIds.add(`deck-${data.id}`); } });
                flashcardsSnap.forEach(doc => { const data = { id: doc.id, ...doc.data() } as FlashcardToolCard; if (data.ownerId !== user.uid) return; if (resultIds.has(`flashcard-${data.id}`)) return; if (data.front.toLowerCase().includes(term) || data.back.toLowerCase().includes(term)) { allResults.push({ type: 'flashcard', data, match: { field: 'content', text: `${data.front.substring(0,50)}...` }}); resultIds.add(`flashcard-${data.id}`); } });
                studyChaptersSnap.forEach(doc => { const data = { id: doc.id, ...doc.data() } as StudyChapter; if (resultIds.has(`chapter-${data.id}`)) return; if (data.title.toLowerCase().includes(term)) { allResults.push({ type: 'studyChapter', data, match: { field: 'title', text: data.title }}); resultIds.add(`chapter-${data.id}`); } });
                studyTopicsSnap.forEach(doc => { const data = { id: doc.id, ...doc.data() } as StudyTopic; if (resultIds.has(`topic-${data.id}`)) return; if (data.title.toLowerCase().includes(term)) { allResults.push({ type: 'studyTopic', data, match: { field: 'title', text: data.title }}); resultIds.add(`topic-${data.id}`); } else if (data.notes?.toLowerCase().includes(term)) { allResults.push({ type: 'studyTopic', data, match: { field: 'notes', text: data.notes.substring(0, 100) + '...' }}); resultIds.add(`topic-${data.id}`); } });
                workActivitiesSnap.forEach(doc => { const data = { id: doc.id, ...doc.data() } as WorkActivity; if (resultIds.has(`work-${data.id}`)) return; if (data.description.toLowerCase().includes(term) || data.notes?.toLowerCase().includes(term)) { allResults.push({ type: 'workActivity', data, match: { field: 'description', text: data.description }}); resultIds.add(`work-${data.id}`); } });
                tradesSnap.forEach(doc => { const data = { id: doc.id, ...doc.data() } as Trade; if (resultIds.has(`trade-${data.id}`)) return; if (data.symbol.toLowerCase().includes(term)) { allResults.push({ type: 'trade', data, match: { field: 'symbol', text: data.symbol }}); resultIds.add(`trade-${data.id}`); } });
                tradingStrategiesSnap.forEach(doc => { const data = { id: doc.id, ...doc.data() } as TradingStrategy; if (resultIds.has(`strategy-${data.id}`)) return; if (data.name.toLowerCase().includes(term) || data.description.toLowerCase().includes(term)) { allResults.push({ type: 'tradingStrategy', data, match: { field: 'name', text: data.name }}); resultIds.add(`strategy-${data.id}`); } });
                watchlistItemsSnap.forEach(doc => { const data = { id: doc.id, ...doc.data() } as WatchlistItem; if (resultIds.has(`watchlist-${data.id}`)) return; if (data.symbol.toLowerCase().includes(term) || data.notes?.toLowerCase().includes(term)) { allResults.push({ type: 'watchlist', data, match: { field: 'symbol', text: data.symbol }}); resultIds.add(`watchlist-${data.id}`); } });
                meetingNotesSnap.forEach(doc => { const data = { id: doc.id, ...doc.data() } as MeetingNote; if (resultIds.has(`meeting-${data.id}`)) return; const contentText = getTextFromDocContent(data.notes); if (data.title.toLowerCase().includes(term) || contentText.toLowerCase().includes(term)) { allResults.push({ type: 'meetingNote', data, match: { field: 'title', text: data.title }}); resultIds.add(`meeting-${data.id}`); } });
                mindMapsSnap.forEach(doc => { const data = { id: doc.id, ...doc.data() } as MindMap; if (resultIds.has(`mindmap-${data.id}`)) return; if (data.name.toLowerCase().includes(term)) { allResults.push({ type: 'mindmap', data, match: { field: 'name', text: data.name }}); resultIds.add(`mindmap-${data.id}`); } });
                whiteboardsSnap.forEach(doc => { const data = { id: doc.id, ...doc.data() } as Whiteboard; if (resultIds.has(`whiteboard-${data.id}`)) return; if (data.name.toLowerCase().includes(term)) { allResults.push({ type: 'whiteboard', data, match: { field: 'name', text: data.name }}); resultIds.add(`whiteboard-${data.id}`); } });


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
            case 'clientRequest': return `/crm`;
            case 'note': return `/notes`;
            case 'event': return `/planner`;
            case 'docFolder': return `/docs/folder/${result.data.id}`;
            case 'flashcardFolder': return `/flashcards/folder/${result.data.id}`;
            case 'flashcardDeck': return `/flashcards/${result.data.id}`;
            case 'flashcard': return `/flashcards/${result.data.deckId}`;
            case 'studyChapter': return `/study-tracker/${result.data.goalId}`;
            case 'studyTopic': return `/study-tracker/${result.data.goalId}`;
            case 'workActivity': return `/work-tracker`;
            case 'trade': return `/trading-tracker`;
            case 'tradingStrategy': return `/trading-tracker`;
            case 'watchlist': return `/trading-tracker`;
            case 'meetingNote': return `/meeting-notes/${result.data.id}`;
            case 'mindmap': return `/mind-map/${result.data.id}`;
            case 'whiteboard': return `/whiteboard/${result.data.id}`;
            default: return '#';
        }
    };
    
    const getResultTitle = (result: SearchResult) => {
        if ('name' in result.data && result.data.name) return result.data.name;
        if ('title' in result.data && result.data.title) return result.data.title;
        if ('symbol' in result.data && result.data.symbol) return result.data.symbol;
        if (result.type === 'flashcard') return `Card: ${result.data.front.substring(0,20)}...`;
        if (result.type === 'workActivity') return `Activity: ${result.data.description.substring(0,20)}...`;
        return 'Untitled';
    }

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
                                    <p className="font-semibold text-primary">{getResultTitle(result)}</p>
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
