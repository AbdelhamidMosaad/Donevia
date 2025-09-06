
'use client';

import { useState, useEffect } from 'react';
import { Input } from '../ui/input';
import { Popover, PopoverContent, PopoverTrigger, PopoverAnchor } from '../ui/popover';
import { useDebouncedCallback } from 'use-debounce';
import { fetchWithAuth } from '@/lib/client-helpers';
import type { Page, Notebook, Section } from '@/lib/types';
import { Loader2, Search, Book, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';

interface SearchResult {
    page: Page;
    section: Section;
    notebook: Notebook;
}

interface GroupedResults {
    [notebookId: string]: {
        notebook: Notebook;
        sections: {
            [sectionId: string]: {
                section: Section;
                pages: Page[];
            }
        }
    }
}

interface NotebookSearchBarProps {
    onSelectPage: (page: Page) => void;
}

export function NotebookSearchBar({ onSelectPage }: NotebookSearchBarProps) {
    const { user } = useAuth();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isPopoverOpen, setIsPopoverOpen] = useState(false);
    
    const debouncedSearch = useDebouncedCallback(async (searchQuery: string) => {
        if (!user || searchQuery.trim().length < 2) {
            setResults([]);
            setIsLoading(false);
            return;
        }
        
        try {
            const response = await fetchWithAuth(`/api/search?q=${encodeURIComponent(searchQuery)}`);
            const data = await response.json();
            setResults(data.results || []);
        } catch (error) {
            console.error('Search failed:', error);
            setResults([]);
        } finally {
            setIsLoading(false);
        }
    }, 300);

    useEffect(() => {
        if (query.trim()) {
            setIsLoading(true);
            debouncedSearch(query);
            setIsPopoverOpen(true);
        } else {
            setResults([]);
            setIsLoading(false);
            debouncedSearch.cancel();
            setIsPopoverOpen(false);
        }
    }, [query, debouncedSearch]);

    const handleSelect = (page: Page) => {
        onSelectPage(page);
        setQuery('');
        setResults([]);
        setIsPopoverOpen(false);
    };

    const groupedResults = results.reduce((acc, result) => {
        const { page, section, notebook } = result;
        if (!acc[notebook.id]) {
            acc[notebook.id] = { notebook, sections: {} };
        }
        if (!acc[notebook.id].sections[section.id]) {
            acc[notebook.id].sections[section.id] = { section, pages: [] };
        }
        acc[notebook.id].sections[section.id].pages.push(page);
        return acc;
    }, {} as GroupedResults);


    return (
        <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
            <div className="relative">
                <PopoverAnchor asChild>
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Search in notebooks..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onFocus={() => setIsPopoverOpen(true)}
                            className="pl-8"
                        />
                        {isLoading && <Loader2 className="absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground animate-spin" />}
                    </div>
                </PopoverAnchor>
            </div>
            {results.length > 0 && (
                <PopoverContent className="w-[--radix-popover-trigger-width] p-1" align="start">
                    <div className="max-h-80 overflow-y-auto">
                        {Object.values(groupedResults).map(({ notebook, sections }) => (
                            <div key={notebook.id} className="mb-2">
                                <div className="flex items-center gap-2 px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                                    <Book className="h-3 w-3" />
                                    {notebook.title}
                                </div>
                                {Object.values(sections).map(({ section, pages }) => (
                                    <div key={section.id} className="pl-4">
                                         <div className="px-2 py-1 text-xs text-muted-foreground">{section.title}</div>
                                        {pages.map(page => (
                                            <button
                                                key={page.id}
                                                onClick={() => handleSelect(page)}
                                                className={cn(
                                                    'w-full text-left flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent'
                                                )}
                                            >
                                                <FileText className="h-4 w-4 shrink-0" />
                                                <span className="truncate">{page.title}</span>
                                            </button>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </PopoverContent>
            )}
        </Popover>
    );
}
