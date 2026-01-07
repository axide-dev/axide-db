import { Suspense } from 'react';
import Link from 'next/link';
import { fetchQuery, api } from '~/lib/convex';
import { EntriesList } from '~/components/EntriesList';
import { AddEntryModal } from '~/components/AddEntryModal';
import { TotalEntriesCounter } from '~/components/TotalEntriesCounter';
import { SkeletonCounter, SkeletonEntriesGrid } from '~/components/ui/skeleton';

export default async function Page() {
    // Fetch initial entries on the server for SSR
    const initialEntries = await fetchQuery(api.entries.getEntries, {
        limit: 50
    });

    return (
        <div className="flex min-h-screen flex-col items-center px-4 py-12 sm:px-8">
            {/* Hero Section */}
            <header className="relative mb-16 flex flex-col items-center gap-8 text-center">
                {/* Decorative diagonal line */}
                <div className="absolute -left-20 top-1/2 h-px w-40 -rotate-[20deg] bg-gradient-to-r from-transparent via-[#2DE2E6]/30 to-transparent" />
                <div className="absolute -right-20 top-1/3 h-px w-40 -rotate-[20deg] bg-gradient-to-r from-transparent via-[#2DE2E6]/30 to-transparent" />

                {/* Title */}
                <div className="space-y-4">
                    <Link href="/" className="group inline-block">
                        <h1 className="font-heading text-5xl font-bold tracking-tight text-[#F5F6FA] transition-all duration-300 sm:text-6xl lg:text-7xl">
                            <span className="text-[#2DE2E6] text-glow-cyan">
                                Axide
                            </span>{' '}
                            <span className="text-[#B9BBC7]">DB</span>
                        </h1>
                    </Link>
                    <p className="mx-auto max-w-2xl text-lg text-[#B9BBC7] leading-relaxed">
                        A comprehensive database for accessibility information
                        about games, hardware, places, software, and services.
                        <span className="text-[#2DE2E6]">
                            {' '}
                            Search, discover, and share
                        </span>{' '}
                        accessibility features to help everyone.
                    </p>
                </div>

                {/* Counter - Suspense boundary for streaming */}
                <Suspense fallback={<SkeletonCounter />}>
                    <TotalEntriesCounter />
                </Suspense>
            </header>

            {/* Action Button */}
            <div className="mb-12">
                <AddEntryModal />
            </div>

            {/* Content - Suspense boundary for streaming entries */}
            <div className="w-full max-w-7xl">
                <Suspense fallback={<SkeletonEntriesGrid count={6} />}>
                    <EntriesList initialEntries={initialEntries} />
                </Suspense>
            </div>

            {/* Footer */}
            <footer className="mt-24 py-8 text-center">
                <div className="mb-4 h-px w-32 mx-auto bg-gradient-to-r from-transparent via-[#242433] to-transparent" />
                <p className="text-[#B9BBC7] text-sm">
                    <span className="text-[#2DE2E6]">♿</span> Making the world
                    more accessible, one entry at a time.
                </p>
            </footer>
        </div>
    );
}
