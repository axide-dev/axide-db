'use client';

import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';

export function TotalEntriesCounter() {
    const totalEntries = useQuery(api.entries.getTotalEntries);

    if (totalEntries === undefined) {
        return null;
    }

    return (
        <div className="text-muted-foreground text-sm">
            <span className="font-semibold text-foreground">
                {totalEntries}
            </span>{' '}
            {totalEntries === 1 ? 'entry' : 'entries'} in database
        </div>
    );
}
