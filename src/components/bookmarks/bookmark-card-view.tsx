
'use client';

import type { Bookmark } from '@/lib/types';
import { BookmarkCard } from './bookmark-card';

interface BookmarkCardViewProps {
    bookmarks: Bookmark[];
    onEdit: (bookmark: Bookmark, focusColor?: boolean) => void;
    onDelete: (bookmarkId: string) => void;
}

export function BookmarkCardView({ bookmarks, onEdit, onDelete }: BookmarkCardViewProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {bookmarks.map(bookmark => (
            <BookmarkCard
              key={bookmark.id}
              bookmark={bookmark}
              onEdit={(focusColor) => onEdit(bookmark, focusColor)}
              onDelete={() => onDelete(bookmark.id)}
            />
          ))}
        </div>
    );
}

    