import { notFound } from 'next/navigation';
import { fetchQuery, api } from '~/lib/convex';
import type { Id } from '../../../../convex/_generated/dataModel';
import { EntryDetailView } from '~/components/EntryDetailView';

interface EntryPageProps {
    params: Promise<{ id: string }>;
}

export default async function EntryPage({ params }: EntryPageProps) {
    const { id } = await params;

    const entry = await fetchQuery(api.entries.getEntry, {
        id: id
    });

    if (!entry) {
        notFound();
    }

    return (
        <main className="flex min-h-screen flex-col items-center px-4 py-8">
            <div className="w-full max-w-4xl">
                <EntryDetailView entry={entry} />
            </div>
        </main>
    );
}
