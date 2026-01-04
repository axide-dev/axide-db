'use client';

import * as React from 'react';
import { useMutation } from 'convex/react';
import { useUser, SignInButton } from '@clerk/nextjs';
import { api } from '../../convex/_generated/api';
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

export function AddEntryForm({ onSuccess }: { onSuccess?: () => void }) {
    const { isSignedIn } = useUser();
    const createEntry = useMutation(api.entries.createEntry);

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
    const [tagsInput, setTagsInput] = React.useState('');
    const [website, setWebsite] = React.useState('');
    const [platformsInput, setPlatformsInput] = React.useState('');
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    // Feature management
    const [features, setFeatures] = React.useState<
        Array<{ feature: string; description?: string; rating: number }>
    >([]);
    const [newFeature, setNewFeature] = React.useState('');
    const [newFeatureRating, setNewFeatureRating] = React.useState(3);

    const addFeature = () => {
        if (newFeature.trim()) {
            setFeatures([
                ...features,
                { feature: newFeature.trim(), rating: newFeatureRating }
            ]);
            setNewFeature('');
            setNewFeatureRating(3);
        }
    };

    const removeFeature = (index: number) => {
        setFeatures(features.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !description.trim()) return;

        setIsSubmitting(true);
        try {
            await createEntry({
                name: name.trim(),
                description: description.trim(),
                category,
                accessibilityFeatures: features,
                overallRating,
                visualAccessibility,
                auditoryAccessibility,
                motorAccessibility,
                cognitiveAccessibility,
                tags: tagsInput
                    .split(',')
                    .map((t) => t.trim())
                    .filter(Boolean),
                website: website.trim() || undefined,
                platforms:
                    category === 'game' || category === 'software'
                        ? platformsInput
                              .split(',')
                              .map((p) => p.trim())
                              .filter(Boolean)
                        : undefined
            });

            // Reset form
            setName('');
            setDescription('');
            setCategory('game');
            setOverallRating(3);
            setVisualAccessibility(undefined);
            setAuditoryAccessibility(undefined);
            setMotorAccessibility(undefined);
            setCognitiveAccessibility(undefined);
            setTagsInput('');
            setWebsite('');
            setPlatformsInput('');
            setFeatures([]);

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
                                <SelectTrigger>
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

                    {/* Features */}
                    <div className="flex flex-col gap-3">
                        <h3 className="font-medium">Accessibility Features</h3>
                        <div className="flex items-end gap-2">
                            <div className="flex-1">
                                <Label htmlFor="newFeature">Feature Name</Label>
                                <Input
                                    id="newFeature"
                                    placeholder="e.g., Subtitles, Color Blind Mode"
                                    value={newFeature}
                                    onChange={(e) =>
                                        setNewFeature(e.target.value)
                                    }
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            addFeature();
                                        }
                                    }}
                                />
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={addFeature}
                            >
                                Add
                            </Button>
                        </div>
                        {features.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {features.map((f, i) => (
                                    <Badge
                                        key={i}
                                        variant="secondary"
                                        className="cursor-pointer pr-1.5"
                                        onClick={() => removeFeature(i)}
                                    >
                                        {f.feature} ({f.rating}★) ✕
                                    </Badge>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Additional Info */}
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="tags">Tags (comma-separated)</Label>
                            <Input
                                id="tags"
                                placeholder="e.g., blind-friendly, screen-reader, subtitles"
                                value={tagsInput}
                                onChange={(e) => setTagsInput(e.target.value)}
                            />
                        </div>

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
