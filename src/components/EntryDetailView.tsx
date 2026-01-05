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

// Higher contrast colors for WCAG AA compliance (4.5:1 minimum)
const categoryColors: Record<Category, string> = {
    game: 'bg-[#C4B5FD]/20 text-[#C4B5FD] border border-[#C4B5FD]/40',
    hardware: 'bg-[#5EEAD4]/20 text-[#5EEAD4] border border-[#5EEAD4]/40',
    place: 'bg-[#86EFAC]/20 text-[#86EFAC] border border-[#86EFAC]/40',
    software: 'bg-[#FED7AA]/20 text-[#FED7AA] border border-[#FED7AA]/40',
    service: 'bg-[#F9A8D4]/20 text-[#F9A8D4] border border-[#F9A8D4]/40'
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
        <div
            className="flex items-center gap-0.5"
            role="img"
            aria-label={`Rating: ${rating.toFixed(1)} out of 5 stars`}
        >
            {[1, 2, 3, 4, 5].map((star) => (
                <span
                    key={star}
                    aria-hidden="true"
                    className={`${starClass} ${star <= rating ? 'text-[#5EEAD4]' : 'text-[#3D3D4D]'}`}
                >
                    ★
                </span>
            ))}
            <span className="ml-2 text-sm text-[#D1D5DB]" aria-hidden="true">
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
                    <span className="text-sm font-medium text-[#F5F6FA]">
                        {label}
                    </span>
                    <span
                        className={`text-sm ${isUnknown ? 'text-[#B9BBC7]/60 italic' : 'text-[#B9BBC7]'}`}
                    >
                        {isUnknown ? 'Unknown' : `${value}/5`}
                    </span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-[#242433]">
                    {isUnknown ? (
                        <div className="flex h-full w-full items-center justify-center rounded-full bg-[#242433]">
                            <span className="text-[8px] text-[#B9BBC7]/50">
                                ?
                            </span>
                        </div>
                    ) : (
                        <div
                            className="h-full rounded-full bg-gradient-to-r from-[#2DE2E6] to-[#5EF0B6] transition-all"
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
                <h3 className="mb-3 font-medium text-[#F5F6FA]">Photos</h3>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
                    {photos.map((storageId, index) => {
                        const url = photoUrls[storageId];
                        if (!url) return null;

                        return (
                            <button
                                key={storageId}
                                type="button"
                                onClick={() => setSelectedPhoto(index)}
                                className="relative aspect-square overflow-hidden rounded-lg border border-[#242433] transition-all hover:ring-2 hover:ring-[#2DE2E6]/50"
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
                    className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B0B10]/95 p-4 backdrop-blur-sm"
                    onClick={() => setSelectedPhoto(null)}
                >
                    <button
                        type="button"
                        onClick={() => setSelectedPhoto(null)}
                        className="absolute right-4 top-4 text-[#F5F6FA] hover:text-[#2DE2E6] transition-colors"
                    >
                        <span className="text-2xl">✕</span>
                    </button>
                    <img
                        src={photoUrls[photos[selectedPhoto]] ?? ''}
                        alt={`Photo ${selectedPhoto + 1}`}
                        className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg"
                        onClick={(e) => e.stopPropagation()}
                    />
                    {selectedPhoto > 0 && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                setSelectedPhoto(selectedPhoto - 1);
                            }}
                            className="absolute left-4 text-[#F5F6FA] hover:text-[#2DE2E6] transition-colors"
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
                            className="absolute right-4 text-[#F5F6FA] hover:text-[#2DE2E6] transition-colors"
                        >
                            <span className="text-4xl">→</span>
                        </button>
                    )}
                    <div className="absolute bottom-4 text-[#B9BBC7]">
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
                <Button
                    variant="ghost"
                    className="w-fit text-[#B9BBC7] hover:text-[#2DE2E6] hover:bg-[#2DE2E6]/5"
                >
                    ← Back to Search
                </Button>
            </Link>

            {/* Main Entry Card */}
            <Card className="border-[#242433] bg-[#12121A]">
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
                                            ? 'bg-[#5EF0B6]/15 text-[#5EF0B6] border border-[#5EF0B6]/30'
                                            : 'bg-[#FFB3A7]/15 text-[#FFB3A7] border border-[#FFB3A7]/30'
                                    }
                                >
                                    {isComplete ? 'Complete' : 'Incomplete'}
                                </Badge>
                            </div>
                            <CardTitle className="text-2xl text-[#F5F6FA] sm:text-3xl">
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
                        <h3 className="mb-2 font-medium text-[#F5F6FA]">
                            Description
                        </h3>
                        <CardDescription className="whitespace-pre-wrap text-base text-[#B9BBC7]">
                            {entry.description}
                        </CardDescription>
                    </div>

                    {/* Accessibility Ratings */}
                    <div>
                        <h3 className="mb-3 font-medium text-[#F5F6FA]">
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
                            <h3 className="mb-3 font-medium text-[#F5F6FA]">
                                Accessibility Features
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {entry.accessibilityFeatures.map(
                                    (feature, index) => (
                                        <Badge
                                            key={index}
                                            variant="secondary"
                                            className="text-sm bg-[#2DE2E6]/10 text-[#2DE2E6] border border-[#2DE2E6]/30"
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
                            <h3 className="mb-3 font-medium text-[#F5F6FA]">
                                Tags
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {entry.tags.map((tag) => (
                                    <Badge
                                        key={tag}
                                        variant="outline"
                                        className="border-[#242433] text-[#B9BBC7]"
                                    >
                                        {tag}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Platforms (for games/software) */}
                    {entry.platforms && entry.platforms.length > 0 && (
                        <div>
                            <h3 className="mb-3 font-medium text-[#F5F6FA]">
                                Platforms
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {entry.platforms.map((platform) => (
                                    <Badge
                                        key={platform}
                                        variant="outline"
                                        className="border-[#242433] text-[#B9BBC7]"
                                    >
                                        {platform}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Location (for places) */}
                    {entry.location && (
                        <div>
                            <h3 className="mb-3 font-medium text-[#F5F6FA]">
                                📍 Location
                            </h3>
                            <p className="text-[#B9BBC7]">
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
                            <h3 className="mb-2 font-medium text-[#F5F6FA]">
                                Website
                            </h3>
                            <a
                                href={entry.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[#2DE2E6] hover:underline"
                            >
                                {entry.website}
                            </a>
                        </div>
                    )}

                    {/* Metadata */}
                    <div className="border-t border-[#242433] pt-4 text-xs text-[#B9BBC7]/60">
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
