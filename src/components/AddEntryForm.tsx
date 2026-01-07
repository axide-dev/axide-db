'use client';

import * as React from 'react';
import Image from 'next/image';
import { useMutation, useQuery } from 'convex/react';
import { useUser, SignInButton } from '@clerk/nextjs';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { Input } from '~/components/ui/input';
import { Textarea } from '~/components/ui/textarea';
import { Button } from '~/components/ui/button';
import { Label } from '~/components/ui/label';
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
    CardFooter
} from '~/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '~/components/ui/select';
import { Badge } from '~/components/ui/badge';

type AccessibilityType =
    | 'visual'
    | 'auditory'
    | 'motor'
    | 'cognitive'
    | 'general';

const accessibilityTypeLabels: Record<
    AccessibilityType,
    { label: string; icon: string; color: string }
> = {
    visual: {
        label: 'Visual',
        icon: '👁️',
        color: 'bg-[#C4B5FD]/20 text-[#C4B5FD] border-[#C4B5FD]/40'
    },
    auditory: {
        label: 'Auditory',
        icon: '👂',
        color: 'bg-[#5EEAD4]/20 text-[#5EEAD4] border-[#5EEAD4]/40'
    },
    motor: {
        label: 'Motor',
        icon: '🖐️',
        color: 'bg-[#86EFAC]/20 text-[#86EFAC] border-[#86EFAC]/40'
    },
    cognitive: {
        label: 'Cognitive',
        icon: '🧠',
        color: 'bg-[#FED7AA]/20 text-[#FED7AA] border-[#FED7AA]/40'
    },
    general: {
        label: 'General',
        icon: '♿',
        color: 'bg-[#F9A8D4]/20 text-[#F9A8D4] border-[#F9A8D4]/40'
    }
};

type Category = 'game' | 'hardware' | 'place' | 'software' | 'service';

function RatingInput({
    value,
    onChange,
    label
}: {
    value: number;
    onChange: (value: number) => void;
    label: string;
}) {
    return (
        <div className="flex flex-col gap-2">
            <Label>{label}</Label>
            <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        type="button"
                        onClick={() => onChange(star)}
                        className={`text-2xl transition-colors ${
                            star <= value
                                ? 'text-yellow-400'
                                : 'text-gray-600 hover:text-yellow-300'
                        }`}
                    >
                        ★
                    </button>
                ))}
            </div>
        </div>
    );
}

// Feature Selector Component
function FeatureSelector({
    selectedFeatures,
    onFeaturesChange
}: {
    selectedFeatures: Array<{
        featureId?: Id<'accessibilityFeatures'>;
        name: string;
        accessibilityType: AccessibilityType;
        rating: number;
    }>;
    onFeaturesChange: (
        features: Array<{
            featureId?: Id<'accessibilityFeatures'>;
            name: string;
            accessibilityType: AccessibilityType;
            rating: number;
        }>
    ) => void;
}) {
    const [searchQuery, setSearchQuery] = React.useState('');
    const [selectedType, setSelectedType] = React.useState<
        AccessibilityType | 'all'
    >('all');
    const [newFeatureName, setNewFeatureName] = React.useState('');
    const [newFeatureType, setNewFeatureType] =
        React.useState<AccessibilityType>('general');
    const [newFeatureRating, setNewFeatureRating] = React.useState(3);
    const [showAddNew, setShowAddNew] = React.useState(false);

    // Fetch popular features
    const popularFeatures = useQuery(api.features.getPopularFeatures, {
        accessibilityType: selectedType !== 'all' ? selectedType : undefined,
        limit: 20
    });

    // Search features
    const searchResults = useQuery(
        api.features.searchFeatures,
        searchQuery.trim().length > 0
            ? {
                  searchQuery,
                  accessibilityType:
                      selectedType !== 'all' ? selectedType : undefined
              }
            : 'skip'
    );

    const displayFeatures = searchQuery.trim()
        ? searchResults
        : popularFeatures;

    const addExistingFeature = (feature: {
        _id: Id<'accessibilityFeatures'>;
        name: string;
        accessibilityType: AccessibilityType;
    }) => {
        // Check if already added
        if (
            selectedFeatures.some(
                (f) =>
                    f.featureId === feature._id ||
                    f.name.toLowerCase() === feature.name.toLowerCase()
            )
        ) {
            return;
        }
        onFeaturesChange([
            ...selectedFeatures,
            {
                featureId: feature._id,
                name: feature.name,
                accessibilityType: feature.accessibilityType,
                rating: 3
            }
        ]);
    };

    const addNewFeature = () => {
        if (!newFeatureName.trim()) return;
        // Check if already added
        if (
            selectedFeatures.some(
                (f) =>
                    f.name.toLowerCase() === newFeatureName.trim().toLowerCase()
            )
        ) {
            return;
        }
        onFeaturesChange([
            ...selectedFeatures,
            {
                name: newFeatureName.trim(),
                accessibilityType: newFeatureType,
                rating: newFeatureRating
            }
        ]);
        setNewFeatureName('');
        setNewFeatureRating(3);
        setShowAddNew(false);
    };

    const removeFeature = (index: number) => {
        onFeaturesChange(selectedFeatures.filter((_, i) => i !== index));
    };

    const updateFeatureRating = (index: number, rating: number) => {
        const updated = [...selectedFeatures];
        const feature = updated[index];
        if (!feature) return;
        updated[index] = { ...feature, rating };
        onFeaturesChange(updated);
    };

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <h3 className="font-medium text-[#F5F6FA]">
                    Accessibility Features
                </h3>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddNew(!showAddNew)}
                    className="border-[#242433] text-[#F5F6FA] hover:border-[#2DE2E6]/50 hover:bg-[#2DE2E6]/5"
                >
                    {showAddNew ? 'Cancel' : '+ New Feature'}
                </Button>
            </div>

            {/* Add new feature form */}
            {showAddNew && (
                <div className="rounded-lg border border-[#242433] bg-[#12121A] p-4 flex flex-col gap-3">
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="newFeatureName">Feature Name</Label>
                        <Input
                            id="newFeatureName"
                            placeholder="e.g., High Contrast Mode, Closed Captions"
                            value={newFeatureName}
                            onChange={(e) => setNewFeatureName(e.target.value)}
                            className="border-[#242433] bg-[#0B0B10] text-[#F5F6FA]"
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <Label>Accessibility Type</Label>
                        <Select
                            value={newFeatureType}
                            onValueChange={(v) =>
                                setNewFeatureType(v as AccessibilityType)
                            }
                        >
                            <SelectTrigger className="border-[#242433] bg-[#0B0B10] text-[#F5F6FA]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {Object.entries(accessibilityTypeLabels).map(
                                    ([type, { label, icon }]) => (
                                        <SelectItem key={type} value={type}>
                                            {icon} {label}
                                        </SelectItem>
                                    )
                                )}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex flex-col gap-2">
                        <Label>Rating (1-5)</Label>
                        <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setNewFeatureRating(star)}
                                    className={`text-xl transition-colors ${
                                        star <= newFeatureRating
                                            ? 'text-[#2DE2E6]'
                                            : 'text-[#3D3D4D] hover:text-[#2DE2E6]/60'
                                    }`}
                                >
                                    ★
                                </button>
                            ))}
                        </div>
                    </div>
                    <Button
                        type="button"
                        onClick={addNewFeature}
                        disabled={!newFeatureName.trim()}
                        className="bg-[#2DE2E6] text-[#0B0B10] hover:bg-[#2DE2E6]/90"
                    >
                        Add Feature
                    </Button>
                </div>
            )}

            {/* Search and filter */}
            <div className="flex gap-2">
                <Input
                    placeholder="Search existing features..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 border-[#242433] bg-[#0B0B10] text-[#F5F6FA]"
                />
                <Select
                    value={selectedType}
                    onValueChange={(v) =>
                        setSelectedType(v as AccessibilityType | 'all')
                    }
                >
                    <SelectTrigger className="w-[140px] border-[#242433] bg-[#0B0B10] text-[#F5F6FA]">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        {Object.entries(accessibilityTypeLabels).map(
                            ([type, { label, icon }]) => (
                                <SelectItem key={type} value={type}>
                                    {icon} {label}
                                </SelectItem>
                            )
                        )}
                    </SelectContent>
                </Select>
            </div>

            {/* Feature suggestions */}
            {displayFeatures && displayFeatures.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {displayFeatures.map((feature) => {
                        const isSelected = selectedFeatures.some(
                            (f) =>
                                f.featureId === feature._id ||
                                f.name.toLowerCase() ===
                                    feature.name.toLowerCase()
                        );
                        const typeInfo =
                            accessibilityTypeLabels[
                                feature.accessibilityType as AccessibilityType
                            ];
                        return (
                            <button
                                key={feature._id}
                                type="button"
                                onClick={() =>
                                    addExistingFeature(
                                        feature as {
                                            _id: Id<'accessibilityFeatures'>;
                                            name: string;
                                            accessibilityType: AccessibilityType;
                                        }
                                    )
                                }
                                disabled={isSelected}
                                className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                                    isSelected
                                        ? 'opacity-50 cursor-not-allowed border-[#3D3D4D] bg-[#242433]/50 text-[#9CA3AF]'
                                        : `${typeInfo.color} hover:shadow-[0_0_10px_rgba(45,226,230,0.2)] cursor-pointer`
                                }`}
                            >
                                {typeInfo.icon} {feature.name}
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Selected features */}
            {selectedFeatures.length > 0 && (
                <div className="flex flex-col gap-2">
                    <Label className="text-[#B9BBC7]">
                        Selected Features ({selectedFeatures.length})
                    </Label>
                    <div className="flex flex-col gap-2">
                        {selectedFeatures.map((feature, index) => {
                            const typeInfo =
                                accessibilityTypeLabels[
                                    feature.accessibilityType
                                ];
                            return (
                                <div
                                    key={`${feature.name}-${index}`}
                                    className={`flex items-center justify-between p-3 rounded-lg border ${typeInfo.color}`}
                                >
                                    <div className="flex items-center gap-2">
                                        <span>{typeInfo.icon}</span>
                                        <span className="font-medium">
                                            {feature.name}
                                        </span>
                                        <Badge
                                            variant="outline"
                                            className="text-xs border-current/30"
                                        >
                                            {typeInfo.label}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="flex gap-0.5">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <button
                                                    key={star}
                                                    type="button"
                                                    onClick={() =>
                                                        updateFeatureRating(
                                                            index,
                                                            star
                                                        )
                                                    }
                                                    className={`text-lg transition-colors ${
                                                        star <= feature.rating
                                                            ? 'text-[#2DE2E6]'
                                                            : 'text-[#3D3D4D] hover:text-[#2DE2E6]/60'
                                                    }`}
                                                >
                                                    ★
                                                </button>
                                            ))}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removeFeature(index)}
                                            className="text-[#F9A8D4] hover:text-[#E61E8C] transition-colors ml-2"
                                            aria-label={`Remove ${feature.name}`}
                                        >
                                            ✕
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

// Tag Selector Component
function TagSelector({
    selectedTags,
    onTagsChange
}: {
    selectedTags: Array<{
        tagId?: Id<'tags'>;
        name: string;
        accessibilityType: AccessibilityType;
    }>;
    onTagsChange: (
        tags: Array<{
            tagId?: Id<'tags'>;
            name: string;
            accessibilityType: AccessibilityType;
        }>
    ) => void;
}) {
    const [searchQuery, setSearchQuery] = React.useState('');
    const [selectedType, setSelectedType] = React.useState<
        AccessibilityType | 'all'
    >('all');
    const [newTagName, setNewTagName] = React.useState('');
    const [newTagType, setNewTagType] =
        React.useState<AccessibilityType>('general');

    // Fetch popular tags
    const popularTags = useQuery(api.tags.getPopularTags, {
        accessibilityType: selectedType !== 'all' ? selectedType : undefined,
        limit: 20
    });

    // Search tags
    const searchResults = useQuery(
        api.tags.searchTags,
        searchQuery.trim().length > 0
            ? {
                  searchQuery,
                  accessibilityType:
                      selectedType !== 'all' ? selectedType : undefined
              }
            : 'skip'
    );

    const displayTags = searchQuery.trim() ? searchResults : popularTags;

    const addExistingTag = (tag: {
        _id: Id<'tags'>;
        name: string;
        accessibilityType: AccessibilityType;
    }) => {
        if (
            selectedTags.some(
                (t) =>
                    t.tagId === tag._id ||
                    t.name.toLowerCase() === tag.name.toLowerCase()
            )
        ) {
            return;
        }
        onTagsChange([
            ...selectedTags,
            {
                tagId: tag._id,
                name: tag.name,
                accessibilityType: tag.accessibilityType
            }
        ]);
    };

    const addNewTag = () => {
        if (!newTagName.trim()) return;
        if (
            selectedTags.some(
                (t) => t.name.toLowerCase() === newTagName.trim().toLowerCase()
            )
        ) {
            return;
        }
        onTagsChange([
            ...selectedTags,
            {
                name: newTagName.trim(),
                accessibilityType: newTagType
            }
        ]);
        setNewTagName('');
    };

    const removeTag = (index: number) => {
        onTagsChange(selectedTags.filter((_, i) => i !== index));
    };

    return (
        <div className="flex flex-col gap-4">
            <h3 className="font-medium text-[#F5F6FA]">Accessibility Tags</h3>

            {/* Add new tag inline */}
            <div className="flex gap-2">
                <Input
                    placeholder="Add a new tag..."
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            addNewTag();
                        }
                    }}
                    className="flex-1 border-[#242433] bg-[#0B0B10] text-[#F5F6FA]"
                />
                <Select
                    value={newTagType}
                    onValueChange={(v) => setNewTagType(v as AccessibilityType)}
                >
                    <SelectTrigger className="w-[140px] border-[#242433] bg-[#0B0B10] text-[#F5F6FA]">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {Object.entries(accessibilityTypeLabels).map(
                            ([type, { label, icon }]) => (
                                <SelectItem key={type} value={type}>
                                    {icon} {label}
                                </SelectItem>
                            )
                        )}
                    </SelectContent>
                </Select>
                <Button
                    type="button"
                    onClick={addNewTag}
                    disabled={!newTagName.trim()}
                    variant="outline"
                    className="border-[#242433] text-[#F5F6FA] hover:border-[#2DE2E6]/50 hover:bg-[#2DE2E6]/5"
                >
                    Add
                </Button>
            </div>

            {/* Search and filter */}
            <div className="flex gap-2">
                <Input
                    placeholder="Search existing tags..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 border-[#242433] bg-[#0B0B10] text-[#F5F6FA]"
                />
                <Select
                    value={selectedType}
                    onValueChange={(v) =>
                        setSelectedType(v as AccessibilityType | 'all')
                    }
                >
                    <SelectTrigger className="w-[140px] border-[#242433] bg-[#0B0B10] text-[#F5F6FA]">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        {Object.entries(accessibilityTypeLabels).map(
                            ([type, { label, icon }]) => (
                                <SelectItem key={type} value={type}>
                                    {icon} {label}
                                </SelectItem>
                            )
                        )}
                    </SelectContent>
                </Select>
            </div>

            {/* Tag suggestions */}
            {displayTags && displayTags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {displayTags.map((tag) => {
                        const isSelected = selectedTags.some(
                            (t) =>
                                t.tagId === tag._id ||
                                t.name.toLowerCase() === tag.name.toLowerCase()
                        );
                        const typeInfo =
                            accessibilityTypeLabels[
                                tag.accessibilityType as AccessibilityType
                            ];
                        return (
                            <button
                                key={tag._id}
                                type="button"
                                onClick={() =>
                                    addExistingTag(
                                        tag as {
                                            _id: Id<'tags'>;
                                            name: string;
                                            accessibilityType: AccessibilityType;
                                        }
                                    )
                                }
                                disabled={isSelected}
                                className={`px-3 py-1 rounded-full text-sm border transition-all ${
                                    isSelected
                                        ? 'opacity-50 cursor-not-allowed border-[#3D3D4D] bg-[#242433]/50 text-[#9CA3AF]'
                                        : `${typeInfo.color} hover:shadow-[0_0_10px_rgba(45,226,230,0.2)] cursor-pointer`
                                }`}
                            >
                                {tag.name}
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Selected tags */}
            {selectedTags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {selectedTags.map((tag, index) => {
                        const typeInfo =
                            accessibilityTypeLabels[tag.accessibilityType];
                        return (
                            <Badge
                                key={`${tag.name}-${index}`}
                                className={`${typeInfo.color} pr-1.5 cursor-pointer hover:shadow-[0_0_10px_rgba(45,226,230,0.2)]`}
                                onClick={() => removeTag(index)}
                            >
                                {typeInfo.icon} {tag.name}
                                <span className="ml-1.5 text-current/70 hover:text-current">
                                    ✕
                                </span>
                            </Badge>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export function AddEntryForm({ onSuccess }: { onSuccess?: () => void }) {
    const { isSignedIn } = useUser();
    const createGame = useMutation(api.games.createGame);
    const createHardware = useMutation(api.hardware.createHardware);
    const createPlace = useMutation(api.places.createPlace);
    const createSoftware = useMutation(api.software.createSoftware);
    const createService = useMutation(api.services.createService);
    const generateUploadUrl = useMutation(api.storage.generateUploadUrl);
    const registerFile = useMutation(api.storage.registerFile);
    const getOrCreateFeature = useMutation(api.features.getOrCreateFeature);
    const setFeaturesForEntry = useMutation(api.features.setFeaturesForEntry);
    const getOrCreateTag = useMutation(api.tags.getOrCreateTag);
    const setTagsForEntry = useMutation(api.tags.setTagsForEntry);

    const [name, setName] = React.useState('');
    const [description, setDescription] = React.useState('');
    const [category, setCategory] = React.useState<Category>('game');
    const [overallRating, setOverallRating] = React.useState(3);
    const [visualAccessibility, setVisualAccessibility] = React.useState<
        number | undefined
    >();
    const [auditoryAccessibility, setAuditoryAccessibility] = React.useState<
        number | undefined
    >();
    const [motorAccessibility, setMotorAccessibility] = React.useState<
        number | undefined
    >();
    const [cognitiveAccessibility, setCognitiveAccessibility] = React.useState<
        number | undefined
    >();
    const [website, setWebsite] = React.useState('');
    const [platformsInput, setPlatformsInput] = React.useState('');
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    // Hardware-specific fields
    const [manufacturer, setManufacturer] = React.useState('');
    const [model, setModel] = React.useState('');
    const [productType, setProductType] = React.useState('');

    // Place-specific fields
    const [address, setAddress] = React.useState('');
    const [city, setCity] = React.useState('');
    const [country, setCountry] = React.useState('');
    const [placeType, setPlaceType] = React.useState('');

    // Feature management - now using the proper type with accessibility info
    const [selectedFeatures, setSelectedFeatures] = React.useState<
        Array<{
            featureId?: Id<'accessibilityFeatures'>;
            name: string;
            accessibilityType: AccessibilityType;
            rating: number;
        }>
    >([]);

    // Tag management - now using the proper type with accessibility info
    const [selectedTags, setSelectedTags] = React.useState<
        Array<{
            tagId?: Id<'tags'>;
            name: string;
            accessibilityType: AccessibilityType;
        }>
    >([]);

    // File upload state
    const [uploadedPhotos, setUploadedPhotos] = React.useState<
        Array<{ storageId: Id<'_storage'>; name: string; preview: string }>
    >([]);
    const [isUploading, setIsUploading] = React.useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    // File upload handlers
    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setIsUploading(true);
        try {
            for (const file of Array.from(files)) {
                // Step 1: Get a short-lived upload URL
                const uploadUrl = await generateUploadUrl();

                // Step 2: POST the file to the upload URL and receive a storageId
                const response = await fetch(uploadUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type':
                            file.type && file.type.length > 0
                                ? file.type
                                : 'application/octet-stream'
                    },
                    body: file
                });

                if (!response.ok) {
                    const text = await response.text();
                    throw new Error(
                        `Upload failed: ${response.status} - ${text}`
                    );
                }

                const json = (await response.json()) as { storageId?: string };
                const storageId = json.storageId as Id<'_storage'> | undefined;
                if (!storageId) {
                    throw new Error('No storageId returned from upload');
                }

                // Step 3: Persist the storageId in the database
                await registerFile({
                    storageId,
                    fileName: file.name,
                    fileType: file.type,
                    fileSize: file.size
                });

                const preview = URL.createObjectURL(file);

                setUploadedPhotos((prev) => [
                    ...prev,
                    { storageId, name: file.name, preview }
                ]);
            }
        } catch (error) {
            console.error('Failed to upload file:', error);
            alert('Failed to upload file. Please try again.');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const removePhoto = (storageId: string) => {
        setUploadedPhotos((prev) => {
            const photo = prev.find((p) => p.storageId === storageId);
            if (photo) {
                URL.revokeObjectURL(photo.preview);
            }
            return prev.filter((p) => p.storageId !== storageId);
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !description.trim()) return;

        setIsSubmitting(true);
        try {
            // 1. Resolve all features (get existing or create new)
            const resolvedFeatures = await Promise.all(
                selectedFeatures.map(async (f) => {
                    if (f.featureId)
                        return { featureId: f.featureId, rating: f.rating };
                    const featureDoc = await getOrCreateFeature({
                        name: f.name,
                        accessibilityType: f.accessibilityType
                    });
                    if (!featureDoc)
                        throw new Error(`Failed to resolve feature: ${f.name}`);
                    return { featureId: featureDoc._id, rating: f.rating };
                })
            );

            // 2. Resolve all tags
            const resolvedTagIds = await Promise.all(
                selectedTags.map(async (t) => {
                    if (t.tagId) return t.tagId;
                    const tagDoc = await getOrCreateTag({
                        name: t.name,
                        accessibilityType: t.accessibilityType
                    });
                    if (!tagDoc)
                        throw new Error(`Failed to resolve tag: ${t.name}`);
                    return tagDoc._id;
                })
            );

            const commonArgs = {
                name: name.trim(),
                description: description.trim(),
                overallRating,
                visualAccessibility,
                auditoryAccessibility,
                motorAccessibility,
                cognitiveAccessibility,
                website: website.trim() || undefined,
                photos: uploadedPhotos.map((p) => p.storageId)
            };

            let entryId: string;

            switch (category) {
                case 'game':
                    entryId = await createGame({
                        ...commonArgs,
                        platforms: platformsInput
                            .split(',')
                            .map((p) => p.trim())
                            .filter(Boolean)
                    });
                    break;
                case 'hardware':
                    entryId = await createHardware({
                        ...commonArgs,
                        manufacturer: manufacturer || undefined,
                        model: model || undefined,
                        productType: productType || undefined
                    });
                    break;
                case 'place':
                    entryId = await createPlace({
                        ...commonArgs,
                        location: {
                            address: address || undefined,
                            city: city || undefined,
                            country: country || undefined
                        },
                        placeType: placeType || undefined
                    });
                    break;
                case 'software':
                    entryId = await createSoftware({
                        ...commonArgs,
                        platforms: platformsInput
                            .split(',')
                            .map((p) => p.trim())
                            .filter(Boolean)
                    });
                    break;
                case 'service':
                    entryId = await createService({
                        ...commonArgs
                    });
                    break;
                default:
                    throw new Error(`Invalid category: ${category}`);
            }

            // 3. Link features and tags to the new entry
            if (resolvedFeatures.length > 0) {
                await setFeaturesForEntry({
                    entryType: category,
                    entryId,
                    features: resolvedFeatures
                });
            }

            if (resolvedTagIds.length > 0) {
                await setTagsForEntry({
                    entryType: category,
                    entryId,
                    tagIds: resolvedTagIds
                });
            }

            // Reset form
            setName('');
            setDescription('');
            setCategory('game');
            setOverallRating(3);
            setVisualAccessibility(undefined);
            setAuditoryAccessibility(undefined);
            setMotorAccessibility(undefined);
            setCognitiveAccessibility(undefined);
            setWebsite('');
            setPlatformsInput('');
            setManufacturer('');
            setModel('');
            setProductType('');
            setAddress('');
            setCity('');
            setCountry('');
            setPlaceType('');
            setSelectedFeatures([]);
            setSelectedTags([]);
            setUploadedPhotos([]);

            onSuccess?.();
        } catch (error) {
            console.error('Failed to create entry:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Card className="w-full max-w-2xl">
            <CardHeader>
                <CardTitle>Add Accessibility Entry</CardTitle>
                <CardDescription>
                    Share accessibility information to help others
                </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
                <CardContent className="flex flex-col gap-6">
                    {/* Basic Info */}
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="name">Name *</Label>
                            <Input
                                id="name"
                                placeholder="e.g., The Last of Us Part II"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <Label htmlFor="category">Category *</Label>
                            <Select
                                value={category}
                                onValueChange={(v) =>
                                    setCategory(v as Category)
                                }
                            >
                                <SelectTrigger
                                    id="category"
                                    aria-label="Select category"
                                >
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="game">
                                        🎮 Game
                                    </SelectItem>
                                    <SelectItem value="hardware">
                                        🖥️ Hardware
                                    </SelectItem>
                                    <SelectItem value="place">
                                        📍 Place
                                    </SelectItem>
                                    <SelectItem value="software">
                                        💿 Software
                                    </SelectItem>
                                    <SelectItem value="service">
                                        🛎️ Service
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex flex-col gap-2">
                            <Label htmlFor="description">Description *</Label>
                            <Textarea
                                id="description"
                                placeholder="Describe the accessibility features and experience..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={4}
                                required
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <Label>Photos</Label>
                            <div className="flex flex-wrap gap-2">
                                {uploadedPhotos.map((photo) => (
                                    <div
                                        key={photo.storageId}
                                        className="relative group w-20 h-20"
                                    >
                                        <Image
                                            src={photo.preview}
                                            alt={photo.name}
                                            fill
                                            unoptimized
                                            className="object-cover rounded-md"
                                        />
                                        <button
                                            type="button"
                                            onClick={() =>
                                                removePhoto(photo.storageId)
                                            }
                                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            X
                                        </button>
                                    </div>
                                ))}
                                <label
                                    className={`w-20 h-20 border-2 border-dashed border-gray-300 rounded-md flex flex-col items-center justify-center cursor-pointer hover:border-gray-400 transition-colors ${
                                        isUploading ? 'opacity-50' : ''
                                    }`}
                                >
                                    {isUploading ? (
                                        <span className="text-xs">
                                            Uploading...
                                        </span>
                                    ) : (
                                        <>
                                            <span className="text-2xl">+</span>
                                            <span className="text-xs">Add</span>
                                        </>
                                    )}
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        onChange={handleFileSelect}
                                        className="hidden"
                                        disabled={isUploading}
                                    />
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Ratings */}
                    <div className="flex flex-col gap-4">
                        <h3 className="font-medium">Accessibility Ratings</h3>
                        <RatingInput
                            label="Overall Accessibility Rating *"
                            value={overallRating}
                            onChange={setOverallRating}
                        />

                        <div className="grid gap-4 sm:grid-cols-2">
                            <RatingInput
                                label="👁️ Visual Accessibility"
                                value={visualAccessibility ?? 0}
                                onChange={setVisualAccessibility}
                            />
                            <RatingInput
                                label="👂 Auditory Accessibility"
                                value={auditoryAccessibility ?? 0}
                                onChange={setAuditoryAccessibility}
                            />
                            <RatingInput
                                label="🖐️ Motor Accessibility"
                                value={motorAccessibility ?? 0}
                                onChange={setMotorAccessibility}
                            />
                            <RatingInput
                                label="🧠 Cognitive Accessibility"
                                value={cognitiveAccessibility ?? 0}
                                onChange={setCognitiveAccessibility}
                            />
                        </div>
                    </div>

                    {/* Accessibility Features Section */}
                    <FeatureSelector
                        selectedFeatures={selectedFeatures}
                        onFeaturesChange={setSelectedFeatures}
                    />

                    {/* Accessibility Tags Section */}
                    <TagSelector
                        selectedTags={selectedTags}
                        onTagsChange={setSelectedTags}
                    />

                    {/* Additional Info */}
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="website">Website (optional)</Label>
                            <Input
                                id="website"
                                type="url"
                                placeholder="https://..."
                                value={website}
                                onChange={(e) => setWebsite(e.target.value)}
                            />
                        </div>

                        {(category === 'game' || category === 'software') && (
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="platforms">
                                    Platforms (comma-separated)
                                </Label>
                                <Input
                                    id="platforms"
                                    placeholder="e.g., PC, PlayStation 5, Xbox Series X"
                                    value={platformsInput}
                                    onChange={(e) =>
                                        setPlatformsInput(e.target.value)
                                    }
                                />
                            </div>
                        )}

                        {category === 'hardware' && (
                            <>
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="manufacturer">
                                        Manufacturer
                                    </Label>
                                    <Input
                                        id="manufacturer"
                                        placeholder="e.g., Microsoft"
                                        value={manufacturer}
                                        onChange={(e) =>
                                            setManufacturer(e.target.value)
                                        }
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="model">Model</Label>
                                    <Input
                                        id="model"
                                        placeholder="e.g., Xbox Adaptive Controller"
                                        value={model}
                                        onChange={(e) =>
                                            setModel(e.target.value)
                                        }
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="productType">
                                        Product Type
                                    </Label>
                                    <Input
                                        id="productType"
                                        placeholder="e.g., controller, keyboard, mouse"
                                        value={productType}
                                        onChange={(e) =>
                                            setProductType(e.target.value)
                                        }
                                    />
                                </div>
                            </>
                        )}

                        {category === 'place' && (
                            <>
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="address">Address</Label>
                                    <Input
                                        id="address"
                                        placeholder="Street address"
                                        value={address}
                                        onChange={(e) =>
                                            setAddress(e.target.value)
                                        }
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="city">City</Label>
                                    <Input
                                        id="city"
                                        placeholder="City"
                                        value={city}
                                        onChange={(e) =>
                                            setCity(e.target.value)
                                        }
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="country">Country</Label>
                                    <Input
                                        id="country"
                                        placeholder="Country"
                                        value={country}
                                        onChange={(e) =>
                                            setCountry(e.target.value)
                                        }
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="placeType">
                                        Place Type
                                    </Label>
                                    <Input
                                        id="placeType"
                                        placeholder="e.g., restaurant, museum, park"
                                        value={placeType}
                                        onChange={(e) =>
                                            setPlaceType(e.target.value)
                                        }
                                    />
                                </div>
                            </>
                        )}
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-3">
                    {!isSignedIn && (
                        <div className="bg-muted/50 flex w-full flex-col items-center gap-2 rounded-lg p-4 text-center">
                            <p className="text-muted-foreground text-sm">
                                You must be signed in to add entries
                            </p>
                            <SignInButton mode="modal">
                                <Button variant="outline" size="sm">
                                    Sign In
                                </Button>
                            </SignInButton>
                        </div>
                    )}
                    <Button
                        type="submit"
                        disabled={
                            isSubmitting ||
                            !name.trim() ||
                            !description.trim() ||
                            !isSignedIn
                        }
                        className="w-full"
                    >
                        {isSubmitting ? 'Adding...' : 'Add Entry'}
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
}
