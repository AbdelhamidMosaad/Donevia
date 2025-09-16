'use client';

import type { Bookmark } from '@/lib/types';
import { BookmarkCard } from './bookmark-card';
import { cn } from '@/lib/utils';

interface BookmarkCardViewProps {
    bookmarks: Bookmark[];
    onEdit: (bookmark: Bookmark, focusColor?: boolean) => void;
    onDelete: (bookmarkId: string) => void;
    cardSize?: 'small' | 'large';
}

export function BookmarkCardView({ bookmarks, onEdit, onDelete, cardSize = 'large' }: BookmarkCardViewProps) {
    return (
        <div className={cn(
            "grid gap-6",
            cardSize === 'large' ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6"
        )}>
          {bookmarks.map(bookmark => (
            <BookmarkCard
              key={bookmark.id}
              bookmark={bookmark}
              onEdit={(focusColor) => onEdit(bookmark, focusColor)}
              onDelete={() => onDelete(bookmark.id)}
              size={cardSize}
            />
          ))}
        </div>
    );
}

    
