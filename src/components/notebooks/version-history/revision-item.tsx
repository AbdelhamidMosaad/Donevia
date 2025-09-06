
'use client';

import type { Revision } from '@/lib/types';
import { cn } from '@/lib/utils';
import moment from 'moment';

interface RevisionItemProps {
  revision: Revision;
  isSelected: boolean;
  onSelect: () => void;
}

export function RevisionItem({ revision, isSelected, onSelect }: RevisionItemProps) {
  return (
    <div
      onClick={onSelect}
      className={cn(
        'block p-3 rounded-md border cursor-pointer transition-colors',
        isSelected ? 'bg-primary/10 border-primary' : 'hover:bg-muted/50'
      )}
    >
      <p className="font-semibold text-sm">{revision.title}</p>
      <p className="text-xs text-muted-foreground">
        Saved {moment(revision.createdAt.toDate()).fromNow()}
      </p>
      <p className="text-xs text-muted-foreground mt-1">
        by {revision.authorId ? 'User' : 'System'} {revision.reason && `(${revision.reason})`}
      </p>
    </div>
  );
}
