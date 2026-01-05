'use client';

import * as React from 'react';
import Link from 'next/link';
import { useQuery } from 'convex/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '../../convex/_generated/api';
import type { Doc } from '../../convex/_generated/dataModel';
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

type Category = 'game' | 'hardware' | 'place' | 'software' | 'service';

const categoryLabels: Record<Category, string> = {
    game: '🎮 Games',
    hardware: '🖥️ Hardware',
    place: '📍 Places',
    software: '💿 Software',
    service: '🛎️ Services'
};

const categoryColors: Record<Category, string> = {
    game: 'bg-[#A78BFA]/15 text-[#A78BFA] border-[#A78BFA]/30',
    hardware: 'bg-[#2DE2E6]/15 text-[#2DE2E6] border-[#2DE2E6]/30',
    place: 'bg-[#5EF0B6]/15 text-[#5EF0B6] border-[#5EF0B6]/30',
    software: 'bg-[#FFB3A7]/15 text-[#FFB3A7] border-[#FFB3A7]/30',
    service: 'bg-[#E61E8C]/15 text-[#E61E8C] border-[#E61E8C]/30'
};

function RatingStars({ rating }: { rating: number }) {
    return (
        <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
                <span
                    key={star}
                    className={
                        star <= rating ? 'text-[#2DE2E6]' : 'text-[#242433]'
                    }
                >
                    ★
                </span>
            ))}
            <span className="ml-1 text-sm text-[#B9BBC7]">
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
                    className={`text-xs border-[#242433] ${badge.value === undefined ? 'opacity-40' : 'text-[#F5F6FA]'}`}
                >
                    {badge.label}{' '}
                    {badge.value !== undefined ? `${badge.value}/5` : '?'}
                </Badge>
            ))}
            <Badge
                variant="outline"
                className={`text-xs ${isEntryComplete ? 'bg-[#5EF0B6]/10 text-[#5EF0B6] border-[#5EF0B6]/30' : 'bg-[#FFB3A7]/10 text-[#FFB3A7] border-[#FFB3A7]/30'}`}
            >
                {isEntryComplete ? 'Complete' : 'Incomplete'}
            </Badge>
        </div>
    );
}

function EntryCard({ entry }: { entry: any }) {
    return (
        <Link href={`/entry/${entry._id}`}>
            <Card className="group h-full cursor-pointer border-[#242433] bg-[#12121A] transition-all duration-300 hover:border-[#2DE2E6]/40 hover:shadow-[0_0_30px_rgba(45,226,230,0.1)]">
                <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                        <CardTitle className="line-clamp-1 text-lg text-[#F5F6FA] group-hover:text-[#2DE2E6] transition-colors">
                            {entry.name}
                        </CardTitle>
                        <Badge
                            className={`border ${categoryColors[entry.category as Category]}`}
                        >
                            {categoryLabels[entry.category as Category]}
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

                    {entry.platforms && entry.platforms.length > 0 && (
                        <div className="text-xs text-[#B9BBC7]/60">
                            Platforms: {entry.platforms.join(', ')}
                        </div>
                    )}
                </CardContent>
            </Card>
        </Link>
    );
}

interface EntriesListProps {
    initialEntries: any[];
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
                    <SelectTrigger className="w-full border-[#242433] bg-[#12121A] text-[#F5F6FA] sm:w-48">
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
                <div className="flex items-center justify-center py-16">
                    <div className="flex flex-col items-center gap-4">
                        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#2DE2E6] border-t-transparent" />
                        <span className="text-[#B9BBC7]">Loading...</span>
                    </div>
                </div>
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
