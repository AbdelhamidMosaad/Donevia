
import type { ProgressUpdate } from '@/lib/types';
import moment from 'moment';

export function ProgressUpdateCard({ update }: { update: ProgressUpdate }) {
  return (
    <div className="relative pl-8">
      <div className="absolute left-0 top-0 h-full w-px bg-border -translate-x-[1px]"></div>
      <div className="absolute left-0 top-1 h-2 w-2 rounded-full bg-primary -translate-x-1/2"></div>
      <p className="text-sm">{update.text}</p>
      <p className="text-xs text-muted-foreground mt-1">
        {moment(update.createdAt.toDate()).format('MMMM D, YYYY, h:mm a')}
      </p>
    </div>
  );
}
