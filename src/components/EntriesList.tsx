'use client';

import * as React from 'react';
import Link from 'next/link';
import { useQuery } from 'convex/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '../../convex/_generated/api';
import type { Doc } from '../../convex/_generated/dataModel';
import type { AnyEntry } from '../../convex/entries';
import { Input } from '~/components/ui/input';
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent
} from '~/components/ui/card';
import { Badge } from '~/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '~/components/ui/select';
import { SkeletonEntriesGrid } from '~/components/ui/skeleton';

type Category = 'game' | 'hardware' | 'place' | 'software' | 'service';

const categoryLabels: Record<Category, string> = {
    game: '🎮 Games',
    hardware: '🖥️ Hardware',
    place: '📍 Places',
    software: '💿 Software',
    service: '🛎️ Services'
};

// Higher contrast colors for WCAG AA compliance (4.5:1 minimum)
const categoryColors: Record<Category, string> = {
    game: 'bg-[#C4B5FD]/20 text-[#C4B5FD] border-[#C4B5FD]/40',
    hardware: 'bg-[#5EEAD4]/20 text-[#5EEAD4] border-[#5EEAD4]/40',
    place: 'bg-[#86EFAC]/20 text-[#86EFAC] border-[#86EFAC]/40',
    software: 'bg-[#FED7AA]/20 text-[#FED7AA] border-[#FED7AA]/40',
    service: 'bg-[#F9A8D4]/20 text-[#F9A8D4] border-[#F9A8D4]/40'
};

function RatingStars({ rating }: { rating: number }) {
    return (
        <div
            className="flex items-center gap-0.5"
            role="img"
            aria-label={`Rating: ${rating.toFixed(1)} out of 5 stars`}
        >
            {[1, 2, 3, 4, 5].map((star) => (
                <span
                    key={star}
                    aria-hidden="true"
                    className={
                        star <= rating ? 'text-[#5EEAD4]' : 'text-[#3D3D4D]'
                    }
                >
                    ★
                </span>
            ))}
            <span className="ml-1 text-sm text-[#D1D5DB]" aria-hidden="true">
                {rating.toFixed(1)}
            </span>
        </div>
    );
}

function AccessibilityBadges({
    visual,
    auditory,
    motor,
    cognitive,
    isEntryComplete
}: {
    visual?: number;
    auditory?: number;
    motor?: number;
    cognitive?: number;
    isEntryComplete: boolean;
}) {
    const badges = [
        { label: '👁️', fullLabel: 'Visual', value: visual },
        { label: '👂', fullLabel: 'Auditory', value: auditory },
        { label: '🖐️', fullLabel: 'Motor', value: motor },
        { label: '🧠', fullLabel: 'Cognitive', value: cognitive }
    ];

    return (
        <div className="flex flex-wrap items-center gap-2">
            {badges.map((badge) => (
                <Badge
                    key={badge.fullLabel}
                    variant="outline"
                    className={`text-xs border-[#3D3D4D] ${badge.value === undefined ? 'opacity-60 text-[#9CA3AF]' : 'text-[#F5F6FA] bg-[#242433]/50'}`}
                    aria-label={`${badge.fullLabel} accessibility: ${badge.value !== undefined ? `${badge.value} out of 5` : 'not rated'}`}
                >
                    <span aria-hidden="true">{badge.label}</span>{' '}
                    {badge.value !== undefined ? `${badge.value}/5` : '?'}
                </Badge>
            ))}
            <Badge
                variant="outline"
                className={`text-xs ${isEntryComplete ? 'bg-[#86EFAC]/20 text-[#86EFAC] border-[#86EFAC]/50' : 'bg-[#FED7AA]/20 text-[#FED7AA] border-[#FED7AA]/50'}`}
            >
                {isEntryComplete ? 'Complete' : 'Incomplete'}
            </Badge>
        </div>
    );
}

function EntryCard({ entry }: { entry: AnyEntry }) {
    return (
        <Link href={`/entry/${entry._id}`}>
            <Card className="group h-full cursor-pointer border-[#242433] bg-[#12121A] transition-all duration-300 hover:border-[#2DE2E6]/40 hover:shadow-[0_0_30px_rgba(45,226,230,0.1)]">
                <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                        <CardTitle className="line-clamp-1 text-lg text-[#F5F6FA] group-hover:text-[#2DE2E6] transition-colors">
                            {entry.name}
                        </CardTitle>
                        <Badge
                            className={`border ${categoryColors[entry.category]}`}
                        >
                            {categoryLabels[entry.category]}
                        </Badge>
                    </div>
                    <RatingStars rating={entry.overallRating} />
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                    <CardDescription className="line-clamp-2 text-[#B9BBC7]">
                        {entry.description}
                    </CardDescription>

                    <AccessibilityBadges
                        visual={entry.visualAccessibility}
                        auditory={entry.auditoryAccessibility}
                        motor={entry.motorAccessibility}
                        cognitive={entry.cognitiveAccessibility}
                        isEntryComplete={
                            entry.name.trim() !== '' &&
                            entry.description.trim() !== '' &&
                            entry.visualAccessibility !== undefined &&
                            entry.auditoryAccessibility !== undefined &&
                            entry.motorAccessibility !== undefined &&
                            entry.cognitiveAccessibility !== undefined
                        }
                    />

                    {entry.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                            {entry.tags.slice(0, 3).map((tag: string) => (
                                <Badge
                                    key={tag}
                                    variant="secondary"
                                    className="text-xs bg-[#242433] text-[#B9BBC7] border-transparent"
                                >
                                    {tag}
                                </Badge>
                            ))}
                            {entry.tags.length > 3 && (
                                <Badge
                                    variant="secondary"
                                    className="text-xs bg-[#242433] text-[#B9BBC7]"
                                >
                                    +{entry.tags.length - 3}
                                </Badge>
                            )}
                        </div>
                    )}

                    {'platforms' in entry &&
                        entry.platforms &&
                        (entry.platforms as string[]).length > 0 && (
                            <div className="text-xs text-[#B9BBC7]/60">
                                Platforms:{' '}
                                {(entry.platforms as string[]).join(', ')}
                            </div>
                        )}
                </CardContent>
            </Card>
        </Link>
    );
}

interface EntriesListProps {
    initialEntries: AnyEntry[];
}

export function EntriesList({ initialEntries }: EntriesListProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [searchQuery, setSearchQuery] = React.useState(
        searchParams.get('q') ?? ''
    );
    const [selectedCategory, setSelectedCategory] = React.useState<
        Category | 'all'
    >((searchParams.get('category') as Category | 'all') ?? 'all');
    const [debouncedQuery, setDebouncedQuery] = React.useState(searchQuery);

    // Debounce search query
    React.useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(searchQuery);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Update URL when filters change
    React.useEffect(() => {
        const params = new URLSearchParams();
        if (debouncedQuery) params.set('q', debouncedQuery);
        if (selectedCategory !== 'all')
            params.set('category', selectedCategory);

        const queryString = params.toString();
        router.replace(queryString ? `/?${queryString}` : '/', {
            scroll: false
        });
    }, [debouncedQuery, selectedCategory, router]);

    // Use search when there's a query, otherwise get all entries
    const searchResults = useQuery(
        api.entries.searchEntries,
        debouncedQuery.trim()
            ? {
                  searchQuery: debouncedQuery,
                  category:
                      selectedCategory !== 'all' ? selectedCategory : undefined
              }
            : 'skip'
    );

    const allEntries = useQuery(api.entries.getEntries, {
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        limit: 50
    });

    // Use real-time data when available, fall back to initial data
    const entries = debouncedQuery.trim()
        ? searchResults
        : (allEntries ?? initialEntries);
    const isLoading = entries === undefined;

    return (
        <div className="flex w-full flex-col gap-8">
            {/* Search and Filter Bar */}
            <div className="flex flex-col gap-4 sm:flex-row">
                <div className="relative flex-1">
                    <Input
                        type="search"
                        placeholder="Search accessibility entries..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full border-[#242433] bg-[#12121A] text-[#F5F6FA] placeholder:text-[#B9BBC7]/50 focus:border-[#2DE2E6]/50 focus:ring-[#2DE2E6]/20"
                    />
                </div>
                <Select
                    value={selectedCategory}
                    onValueChange={(value) =>
                        setSelectedCategory(value as Category | 'all')
                    }
                >
                    <SelectTrigger
                        className="w-full border-[#242433] bg-[#12121A] text-[#F5F6FA] sm:w-48"
                        aria-label="Filter by category"
                    >
                        <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent className="border-[#242433] bg-[#12121A]">
                        <SelectItem value="all">All Categories</SelectItem>
                        <SelectItem value="game">🎮 Games</SelectItem>
                        <SelectItem value="hardware">🖥️ Hardware</SelectItem>
                        <SelectItem value="place">📍 Places</SelectItem>
                        <SelectItem value="software">💿 Software</SelectItem>
                        <SelectItem value="service">🛎️ Services</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Results */}
            {isLoading ? (
                <SkeletonEntriesGrid count={6} />
            ) : entries && entries.length > 0 ? (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {entries.map((entry) => (
                        <EntryCard key={entry._id} entry={entry} />
                    ))}
                </div>
            ) : (
                <div className="py-16 text-center">
                    <div className="mx-auto max-w-md rounded-2xl border border-[#242433] bg-[#12121A] p-8">
                        <p className="text-lg text-[#B9BBC7]">
                            {debouncedQuery.trim()
                                ? `No results found for "${debouncedQuery}"`
                                : 'No entries yet. Be the first to add one!'}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
