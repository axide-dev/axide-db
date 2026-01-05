'use client';

import * as React from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { Input } from '~/components/ui/input';
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent
} from '~/components/ui/card';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '~/components/ui/select';
import { EntryDetail } from '~/components/EntryDetail';

type Category = 'game' | 'hardware' | 'place' | 'software' | 'service';

const categoryLabels: Record<Category, string> = {
    game: '🎮 Games',
    hardware: '🖥️ Hardware',
    place: '📍 Places',
    software: '💿 Software',
    service: '🛎️ Services'
};

const categoryColors: Record<Category, string> = {
    game: 'bg-purple-500/20 text-purple-400',
    hardware: 'bg-blue-500/20 text-blue-400',
    place: 'bg-green-500/20 text-green-400',
    software: 'bg-orange-500/20 text-orange-400',
    service: 'bg-pink-500/20 text-pink-400'
};

function RatingStars({ rating }: { rating: number }) {
    return (
        <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
                <span
                    key={star}
                    className={
                        star <= rating ? 'text-yellow-400' : 'text-gray-600'
                    }
                >
                    ★
                </span>
            ))}
            <span className="text-muted-foreground ml-1 text-sm">
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
                    className={`text-xs ${badge.value === undefined ? 'opacity-50' : ''}`}
                >
                    {badge.label}{' '}
                    {badge.value !== undefined ? `${badge.value}/5` : '?'}
                </Badge>
            ))}
            <Badge
                variant="outline"
                className={`text-xs ${isEntryComplete ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'}`}
            >
                {isEntryComplete ? 'Complete' : 'Incomplete'}
            </Badge>
        </div>
    );
}

interface AccessibilityEntry {
    _id:
        | Id<'games'>
        | Id<'hardware'>
        | Id<'places'>
        | Id<'software'>
        | Id<'services'>;
    _creationTime: number;
    name: string;
    description: string;
    category: Category;
    overallRating: number;
    visualAccessibility?: number;
    auditoryAccessibility?: number;
    motorAccessibility?: number;
    cognitiveAccessibility?: number;
    tags: string[];
    accessibilityFeatures: Array<{
        feature: string;
        description?: string;
        rating: number;
    }>;
    platforms?: string[];
}

export function AccessibilitySearch({
    selectedEntryId,
    selectedEntryType,
    onSelectEntry
}: {
    selectedEntryId:
        | Id<'games'>
        | Id<'hardware'>
        | Id<'places'>
        | Id<'software'>
        | Id<'services'>
        | null;
    selectedEntryType: Category | null;
    onSelectEntry: (
        id:
            | Id<'games'>
            | Id<'hardware'>
            | Id<'places'>
            | Id<'software'>
            | Id<'services'>
            | null,
        type: Category | null
    ) => void;
}) {
    const [searchQuery, setSearchQuery] = React.useState('');
    const [selectedCategory, setSelectedCategory] = React.useState<
        Category | 'all'
    >('all');
    const [debouncedQuery, setDebouncedQuery] = React.useState('');

    // Debounce search query
    React.useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(searchQuery);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

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

    const entries = debouncedQuery.trim() ? searchResults : allEntries;
    const isLoading = entries === undefined;

    // If an entry is selected, show the detail view
    if (selectedEntryId && selectedEntryType) {
        return (
            <EntryDetail
                entryId={selectedEntryId}
                entryType={selectedEntryType}
                onBack={() => onSelectEntry(null, null)}
            />
        );
    }

    return (
        <div className="flex w-full flex-col gap-6">
            {/* Search and Filter Bar */}
            <div className="flex flex-col gap-4 sm:flex-row">
                <div className="relative flex-1">
                    <Input
                        type="search"
                        placeholder="Search accessibility entries..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full"
                    />
                </div>
                <Select
                    value={selectedCategory}
                    onValueChange={(value) =>
                        setSelectedCategory(value as Category | 'all')
                    }
                >
                    <SelectTrigger className="w-full sm:w-48">
                        <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
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
                <div className="text-muted-foreground py-8 text-center">
                    Loading...
                </div>
            ) : entries && entries.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {(entries as AccessibilityEntry[]).map((entry) => (
                        <Card
                            key={entry._id}
                            className="hover:ring-primary/50 cursor-pointer transition-all hover:ring-2"
                            onClick={() =>
                                onSelectEntry(entry._id, entry.category)
                            }
                        >
                            <CardHeader>
                                <div className="flex items-start justify-between gap-2">
                                    <CardTitle className="line-clamp-1 text-lg">
                                        {entry.name}
                                    </CardTitle>
                                    <Badge
                                        className={
                                            categoryColors[entry.category]
                                        }
                                    >
                                        {categoryLabels[entry.category]}
                                    </Badge>
                                </div>
                                <RatingStars rating={entry.overallRating} />
                            </CardHeader>
                            <CardContent className="flex flex-col gap-3">
                                <CardDescription className="line-clamp-2">
                                    {entry.description}
                                </CardDescription>

                                <AccessibilityBadges
                                    visual={entry.visualAccessibility}
                                    auditory={entry.auditoryAccessibility}
                                    motor={entry.motorAccessibility}
                                    cognitive={entry.cognitiveAccessibility}
                                    isEntryComplete={
                                        // Check all fields for completeness
                                        entry.name.trim() !== '' &&
                                        entry.description.trim() !== '' &&
                                        entry.visualAccessibility !==
                                            undefined &&
                                        entry.auditoryAccessibility !==
                                            undefined &&
                                        entry.motorAccessibility !==
                                            undefined &&
                                        entry.cognitiveAccessibility !==
                                            undefined
                                    }
                                />

                                {entry.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-1">
                                        {entry.tags.slice(0, 3).map((tag) => (
                                            <Badge
                                                key={tag}
                                                variant="secondary"
                                                className="text-xs"
                                            >
                                                {tag}
                                            </Badge>
                                        ))}
                                        {entry.tags.length > 3 && (
                                            <Badge
                                                variant="secondary"
                                                className="text-xs"
                                            >
                                                +{entry.tags.length - 3}
                                            </Badge>
                                        )}
                                    </div>
                                )}

                                {entry.platforms &&
                                    entry.platforms.length > 0 && (
                                        <div className="text-muted-foreground text-xs">
                                            Platforms:{' '}
                                            {entry.platforms.join(', ')}
                                        </div>
                                    )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="text-muted-foreground py-8 text-center">
                    {debouncedQuery.trim()
                        ? `No results found for "${debouncedQuery}"`
                        : 'No entries yet. Be the first to add one!'}
                </div>
            )}
        </div>
    );
}
