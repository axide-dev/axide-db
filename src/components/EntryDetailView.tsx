'use client';

import * as React from 'react';
import Link from 'next/link';
import type { Doc, Id } from '../../convex/_generated/dataModel';
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
import { useQuery } from 'convex/react';
import { api } from '~/lib/convex';

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
    value,
    showUnknown = true
}: {
    label: string;
    icon: string;
    value?: number;
    showUnknown?: boolean;
}) {
    const isUnknown = value === undefined;

    if (isUnknown && !showUnknown) return null;

    return (
        <div className="flex items-center gap-3">
            <span className="text-xl">{icon}</span>
            <div className="flex-1">
                <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{label}</span>
                    <span
                        className={`text-sm ${isUnknown ? 'text-muted-foreground italic' : 'text-muted-foreground'}`}
                    >
                        {isUnknown ? 'Unknown' : `${value}/5`}
                    </span>
                </div>
                <div className="bg-muted mt-1 h-2 overflow-hidden rounded-full">
                    {isUnknown ? (
                        <div className="bg-muted-foreground/30 flex h-full w-full items-center justify-center rounded-full">
                            <span className="text-muted-foreground text-[8px]">
                                ?
                            </span>
                        </div>
                    ) : (
                        <div
                            className="bg-primary h-full rounded-full transition-all"
                            style={{ width: `${(value / 5) * 100}%` }}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}

// Type for any entry with category
interface AnyEntry {
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
    website?: string;
    createdAt: number;
    updatedAt: number;
    photos?: Array<Id<'_storage'>>;
    // Category-specific fields
    platforms?: string[];
    location?: {
        address?: string;
        city?: string;
        country?: string;
        latitude?: number;
        longitude?: number;
    };
}

interface EntryDetailViewProps {
    entry: AnyEntry;
}

function PhotoGallery({ photos }: { photos: Array<Id<'_storage'>> }) {
    const [selectedPhoto, setSelectedPhoto] = React.useState<number | null>(
        null
    );

    const photoUrls = useQuery(
        api.storage.getFileUrls,
        photos.length > 0 ? { storageIds: photos } : 'skip'
    );

    if (!photoUrls || photos.length === 0) {
        return null;
    }

    return (
        <>
            <div>
                <h3 className="mb-3 font-medium">Photos</h3>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
                    {photos.map((storageId, index) => {
                        const url = photoUrls[storageId];
                        if (!url) return null;

                        return (
                            <button
                                key={storageId}
                                type="button"
                                onClick={() => setSelectedPhoto(index)}
                                className="relative aspect-square overflow-hidden rounded-lg border transition-all hover:ring-2 hover:ring-primary"
                            >
                                <img
                                    src={url}
                                    alt={`Photo ${index + 1}`}
                                    className="h-full w-full object-cover"
                                />
                            </button>
                        );
                    })}
                </div>
            </div>

            {selectedPhoto !== null && photos[selectedPhoto] && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
                    onClick={() => setSelectedPhoto(null)}
                >
                    <button
                        type="button"
                        onClick={() => setSelectedPhoto(null)}
                        className="absolute right-4 top-4 text-white hover:text-gray-300"
                    >
                        <span className="text-2xl">✕</span>
                    </button>
                    <img
                        src={photoUrls[photos[selectedPhoto]] ?? ''}
                        alt={`Photo ${selectedPhoto + 1}`}
                        className="max-h-[90vh] max-w-[90vw] object-contain"
                        onClick={(e) => e.stopPropagation()}
                    />
                    {selectedPhoto > 0 && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                setSelectedPhoto(selectedPhoto - 1);
                            }}
                            className="absolute left-4 text-white hover:text-gray-300"
                        >
                            <span className="text-4xl">←</span>
                        </button>
                    )}
                    {selectedPhoto < photos.length - 1 && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                setSelectedPhoto(selectedPhoto + 1);
                            }}
                            className="absolute right-4 text-white hover:text-gray-300"
                        >
                            <span className="text-4xl">→</span>
                        </button>
                    )}
                    <div className="absolute bottom-4 text-white">
                        {selectedPhoto + 1} / {photos.length}
                    </div>
                </div>
            )}
        </>
    );
}

export function EntryDetailView({ entry }: EntryDetailViewProps) {
    const isComplete =
        entry.name.trim() !== '' &&
        entry.description.trim() !== '' &&
        entry.visualAccessibility !== undefined &&
        entry.auditoryAccessibility !== undefined &&
        entry.motorAccessibility !== undefined &&
        entry.cognitiveAccessibility !== undefined;

    return (
        <div className="flex flex-col gap-6">
            {/* Back Button */}
            <Link href="/">
                <Button variant="ghost" className="w-fit">
                    ← Back to Search
                </Button>
            </Link>

            {/* Main Entry Card */}
            <Card>
                <CardHeader>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                                <Badge
                                    className={categoryColors[entry.category]}
                                >
                                    {categoryLabels[entry.category]}
                                </Badge>
                                <Badge
                                    className={
                                        isComplete
                                            ? 'bg-green-500/20 text-green-400'
                                            : 'bg-yellow-500/20 text-yellow-400'
                                    }
                                >
                                    {isComplete ? 'Complete' : 'Incomplete'}
                                </Badge>
                            </div>
                            <CardTitle className="text-2xl sm:text-3xl">
                                {entry.name}
                            </CardTitle>
                        </div>
                        <RatingStars rating={entry.overallRating} size="lg" />
                    </div>
                </CardHeader>
                <CardContent className="flex flex-col gap-6">
                    {/* Photos */}
                    {entry.photos && entry.photos.length > 0 && (
                        <PhotoGallery photos={entry.photos} />
                    )}

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
            <Comments
                entryId={entry._id}
                entryName={entry.name}
                entryType={entry.category}
            />
        </div>
    );
}
