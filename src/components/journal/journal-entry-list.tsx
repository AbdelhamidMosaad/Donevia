
'use client';

import { useState, useMemo } from 'react';
import type { JournalEntry } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { JournalIcon } from '../icons/tools/journal-icon';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '../ui/card';
import { MoreHorizontal, Edit, Trash2, Smile, Meh, Frown, Tag } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useRouter } from 'next/navigation';
import moment from 'moment';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

interface JournalEntryListProps {
  entries: JournalEntry[];
  onDelete: (entryId: string) => void;
}

const moodIcons = {
    Happy: <Smile className="h-4 w-4 text-green-500" />,
    Neutral: <Meh className="h-4 w-4 text-yellow-500" />,
    Sad: <Frown className="h-4 w-4 text-blue-500" />,
};

export function JournalEntryList({ entries, onDelete }: JournalEntryListProps) {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [tagFilter, setTagFilter] = useState('');
    const [moodFilter, setMoodFilter] = useState<'all' | 'Happy' | 'Neutral' | 'Sad'>('all');

    const allTags = useMemo(() => {
        const tags = new Set<string>();
        entries.forEach(entry => entry.tags?.forEach(tag => tags.add(tag)));
        return Array.from(tags);
    }, [entries]);

    const filteredEntries = useMemo(() => {
        return entries.filter(entry => {
            const searchMatch = searchQuery === '' || entry.title.toLowerCase().includes(searchQuery.toLowerCase());
            const tagMatch = tagFilter === '' || entry.tags?.includes(tagFilter);
            const moodMatch = moodFilter === 'all' || entry.mood === moodFilter;
            return searchMatch && tagMatch && moodMatch;
        });
    }, [entries, searchQuery, tagFilter, moodFilter]);

    if (entries.length === 0) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border rounded-lg bg-card/60 backdrop-blur-sm">
                <JournalIcon className="h-24 w-24 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold font-headline">No Journal Entries Yet</h3>
                <p className="text-muted-foreground">Click "New Entry" to start your first journal entry.</p>
            </div>
        );
    }
    
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input 
                    placeholder="Search entries by title..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                 <Select value={tagFilter} onValueChange={setTagFilter}>
                    <SelectTrigger><SelectValue placeholder="Filter by tag..." /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="">All Tags</SelectItem>
                        {allTags.map(tag => <SelectItem key={tag} value={tag}>{tag}</SelectItem>)}
                    </SelectContent>
                </Select>
                 <Select value={moodFilter} onValueChange={(v: any) => setMoodFilter(v)}>
                    <SelectTrigger><SelectValue placeholder="Filter by mood..." /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Moods</SelectItem>
                        <SelectItem value="Happy">Happy</SelectItem>
                        <SelectItem value="Neutral">Neutral</SelectItem>
                        <SelectItem value="Sad">Sad</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-6">
                {filteredEntries.map(entry => (
                    <Card 
                        key={entry.id} 
                        className="hover:shadow-md transition-shadow cursor-pointer group"
                        onClick={() => router.push(`/journal/${entry.id}`)}
                    >
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="font-headline text-lg group-hover:underline">{entry.title}</CardTitle>
                                    <CardDescription>
                                        {moment(entry.createdAt.toDate()).format('MMMM D, YYYY h:mm A')}
                                    </CardDescription>
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={e => e.stopPropagation()}><MoreHorizontal /></Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent onClick={e => e.stopPropagation()}>
                                        <DropdownMenuItem onSelect={() => router.push(`/journal/${entry.id}`)}><Edit/> Edit</DropdownMenuItem>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <DropdownMenuItem onSelect={e => e.preventDefault()} className="text-destructive"><Trash2/> Delete</DropdownMenuItem>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Delete this entry?</AlertDialogTitle>
                                                    <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => onDelete(entry.id)}>Delete</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </CardHeader>
                        <CardContent>
                             <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                {entry.mood && (
                                    <div className="flex items-center gap-1">
                                        {moodIcons[entry.mood as keyof typeof moodIcons]}
                                        <span>{entry.mood}</span>
                                    </div>
                                )}
                                {entry.tags && entry.tags.length > 0 && (
                                    <div className="flex items-center gap-1 flex-wrap">
                                        <Tag className="h-4 w-4" />
                                        {entry.tags.map(tag => (
                                            <span key={tag} className="bg-secondary px-2 py-0.5 rounded-full text-xs">{tag}</span>
                                        ))}
                                    </div>
                                )}
                             </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
             {filteredEntries.length === 0 && (
                <div className="text-center text-muted-foreground py-16">
                    <p>No entries match your current filters.</p>
                </div>
            )}
        </div>
    );
}
