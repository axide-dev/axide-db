import { Suspense } from 'react';
import Link from 'next/link';
import { fetchQuery, api } from '~/lib/convex';
import { EntriesList } from '~/components/EntriesList';
import { AddEntryModal } from '~/components/AddEntryModal';
import { TotalEntriesCounter } from '~/components/TotalEntriesCounter';

export default async function Page() {
    // Fetch initial entries on the server for SSR
    const initialEntries = await fetchQuery(api.entries.getEntries, {
        limit: 50
    });

    return (
        <main className="flex min-h-screen flex-col items-center px-4 py-8">
            {/* Header with Red Link */}
            <header className="mb-8 flex flex-col items-center gap-4 text-center">
                <Link
                    href="/"
                    className="text-4xl font-bold text-red-500 transition-colors hover:text-red-400 sm:text-5xl"
                >
                    Axide Accessibility Database
                </Link>
                <p className="text-muted-foreground max-w-2xl text-lg">
                    A comprehensive database for accessibility information about
                    games, hardware, places, software, and services. Search,
                    discover, and share accessibility features to help everyone.
                </p>
                <TotalEntriesCounter />
            </header>

            {/* Action Button */}
            <div className="mb-8">
                <AddEntryModal />
            </div>

            {/* Content */}
            <div className="w-full max-w-6xl">
                <Suspense
                    fallback={
                        <div className="text-muted-foreground py-8 text-center">
                            Loading...
                        </div>
                    }
                >
                    <EntriesList initialEntries={initialEntries} />
                </Suspense>
            </div>

            {/* Footer */}
            <footer className="mt-16 py-8 text-center">
                <p className="text-muted-foreground text-sm">
                    <span className="text-red-500">♿</span> Making the world
                    more accessible, one entry at a time.
                </p>
            </footer>
        </main>
    );
}
