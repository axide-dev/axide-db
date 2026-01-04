'use client';

import * as React from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent
} from '~/components/ui/card';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { Comments } from '~/components/Comments';

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

function RatingStars({
    rating,
    size = 'default'
}: {
    rating: number;
    size?: 'default' | 'lg';
}) {
    const starClass = size === 'lg' ? 'text-2xl' : 'text-base';
    return (
        <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
                <span
                    key={star}
                    className={`${starClass} ${star <= rating ? 'text-yellow-400' : 'text-gray-600'}`}
                >
                    ★
                </span>
            ))}
            <span className="text-muted-foreground ml-2 text-sm">
                {rating.toFixed(1)} / 5
            </span>
        </div>
    );
}

function AccessibilityRatingBar({
    label,
    icon,
    value
}: {
    label: string;
    icon: string;
    value?: number;
}) {
    if (value === undefined) return null;

    return (
        <div className="flex items-center gap-3">
            <span className="text-xl">{icon}</span>
            <div className="flex-1">
                <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{label}</span>
                    <span className="text-muted-foreground text-sm">
                        {value}/5
                    </span>
                </div>
                <div className="bg-muted mt-1 h-2 overflow-hidden rounded-full">
                    <div
                        className="bg-primary h-full rounded-full transition-all"
                        style={{ width: `${(value / 5) * 100}%` }}
                    />
                </div>
            </div>
        </div>
    );
}

interface EntryDetailProps {
    entryId: Id<'accessibilityEntries'>;
    onBack: () => void;
}

export function EntryDetail({ entryId, onBack }: EntryDetailProps) {
    const entry = useQuery(api.entries.getEntry, { id: entryId });

    if (entry === undefined) {
        return (
            <div className="flex items-center justify-center py-12">
                <p className="text-muted-foreground">Loading...</p>
            </div>
        );
    }

    if (entry === null) {
        return (
            <div className="flex flex-col items-center gap-4 py-12">
                <p className="text-muted-foreground">Entry not found</p>
                <Button onClick={onBack} variant="outline">
                    ← Go Back
                </Button>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            {/* Back Button */}
            <Button onClick={onBack} variant="ghost" className="w-fit">
                ← Back to Search
            </Button>

            {/* Main Entry Card */}
            <Card>
                <CardHeader>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex flex-col gap-2">
                            <Badge className={categoryColors[entry.category]}>
                                {categoryLabels[entry.category]}
                            </Badge>
                            <CardTitle className="text-2xl sm:text-3xl">
                                {entry.name}
                            </CardTitle>
                        </div>
                        <RatingStars rating={entry.overallRating} size="lg" />
                    </div>
                </CardHeader>
                <CardContent className="flex flex-col gap-6">
                    {/* Description */}
                    <div>
                        <h3 className="mb-2 font-medium">Description</h3>
                        <CardDescription className="whitespace-pre-wrap text-base">
                            {entry.description}
                        </CardDescription>
                    </div>

                    {/* Accessibility Ratings */}
                    <div>
                        <h3 className="mb-3 font-medium">
                            Accessibility Ratings
                        </h3>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <AccessibilityRatingBar
                                label="Visual Accessibility"
                                icon="👁️"
                                value={entry.visualAccessibility}
                            />
                            <AccessibilityRatingBar
                                label="Auditory Accessibility"
                                icon="👂"
                                value={entry.auditoryAccessibility}
                            />
                            <AccessibilityRatingBar
                                label="Motor Accessibility"
                                icon="🖐️"
                                value={entry.motorAccessibility}
                            />
                            <AccessibilityRatingBar
                                label="Cognitive Accessibility"
                                icon="🧠"
                                value={entry.cognitiveAccessibility}
                            />
                        </div>
                    </div>

                    {/* Accessibility Features */}
                    {entry.accessibilityFeatures.length > 0 && (
                        <div>
                            <h3 className="mb-3 font-medium">
                                Accessibility Features
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {entry.accessibilityFeatures.map(
                                    (feature, index) => (
                                        <Badge
                                            key={index}
                                            variant="secondary"
                                            className="text-sm"
                                        >
                                            {feature.feature} ({feature.rating}
                                            ★)
                                        </Badge>
                                    )
                                )}
                            </div>
                        </div>
                    )}

                    {/* Tags */}
                    {entry.tags.length > 0 && (
                        <div>
                            <h3 className="mb-3 font-medium">Tags</h3>
                            <div className="flex flex-wrap gap-2">
                                {entry.tags.map((tag) => (
                                    <Badge key={tag} variant="outline">
                                        {tag}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Platforms (for games/software) */}
                    {entry.platforms && entry.platforms.length > 0 && (
                        <div>
                            <h3 className="mb-3 font-medium">Platforms</h3>
                            <div className="flex flex-wrap gap-2">
                                {entry.platforms.map((platform) => (
                                    <Badge key={platform} variant="outline">
                                        {platform}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Location (for places) */}
                    {entry.location && (
                        <div>
                            <h3 className="mb-3 font-medium">📍 Location</h3>
                            <p className="text-muted-foreground">
                                {[
                                    entry.location.address,
                                    entry.location.city,
                                    entry.location.country
                                ]
                                    .filter(Boolean)
                                    .join(', ')}
                            </p>
                        </div>
                    )}

                    {/* Website */}
                    {entry.website && (
                        <div>
                            <h3 className="mb-2 font-medium">Website</h3>
                            <a
                                href={entry.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline"
                            >
                                {entry.website}
                            </a>
                        </div>
                    )}

                    {/* Metadata */}
                    <div className="text-muted-foreground border-border border-t pt-4 text-xs">
                        Added on{' '}
                        {new Date(entry.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        })}
                        {entry.updatedAt !== entry.createdAt && (
                            <>
                                {' '}
                                • Updated on{' '}
                                {new Date(entry.updatedAt).toLocaleDateString(
                                    'en-US',
                                    {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    }
                                )}
                            </>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Comments Section */}
            <Comments entryId={entry._id} entryName={entry.name} />
        </div>
    );
}
