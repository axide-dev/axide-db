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
    const createGame = useMutation(api.games.createGame);
    const createHardware = useMutation(api.hardware.createHardware);
    const createPlace = useMutation(api.places.createPlace);
    const createSoftware = useMutation(api.software.createSoftware);
    const createService = useMutation(api.services.createService);
    const generateUploadUrl = useMutation(api.storage.generateUploadUrl);
    const registerFile = useMutation(api.storage.registerFile);

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

    // Hardware-specific fields
    const [manufacturer, setManufacturer] = React.useState('');
    const [model, setModel] = React.useState('');
    const [productType, setProductType] = React.useState('');

    // Place-specific fields
    const [address, setAddress] = React.useState('');
    const [city, setCity] = React.useState('');
    const [country, setCountry] = React.useState('');
    const [placeType, setPlaceType] = React.useState('');

    // Feature management
    const [features, setFeatures] = React.useState<
        Array<{ feature: string; description?: string; rating: number }>
    >([]);
    const [newFeature, setNewFeature] = React.useState('');
    const [newFeatureRating, setNewFeatureRating] = React.useState(3);

    // File upload state
    const [uploadedPhotos, setUploadedPhotos] = React.useState<
        Array<{ storageId: string; name: string; preview: string }>
    >([]);
    const [isUploading, setIsUploading] = React.useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

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

    // File upload handlers
    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setIsUploading(true);
        try {
            for (const file of Array.from(files)) {
                const uploadUrl = await generateUploadUrl();

                const response = await fetch(uploadUrl, {
                    method: 'POST',
                    body: file
                });

                if (!response.ok) {
                    const text = await response.text();
                    throw new Error(
                        `Upload failed: ${response.status} - ${text}`
                    );
                }

                let storageId = response.headers.get('X-Convex-Storage-Id');

                if (!storageId) {
                    try {
                        const json = await response.json();
                        storageId = json?.storageId || json?.id;
                    } catch {}
                }

                if (!storageId) {
                    throw new Error('No storage ID returned from upload');
                }

                await registerFile({
                    storageId: storageId as any,
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

        const commonArgs = {
            name: name.trim(),
            description: description.trim(),
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
            photos: uploadedPhotos.map((p) => p.storageId) as any
        };

        setIsSubmitting(true);
        try {
            switch (category) {
                case 'game':
                    await createGame({
                        ...commonArgs,
                        platforms: platformsInput
                            .split(',')
                            .map((p) => p.trim())
                            .filter(Boolean)
                    });
                    break;
                case 'hardware':
                    await createHardware({
                        ...commonArgs,
                        manufacturer: manufacturer || undefined,
                        model: model || undefined,
                        productType: productType || undefined
                    });
                    break;
                case 'place':
                    await createPlace({
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
                    await createSoftware({
                        ...commonArgs,
                        platforms: platformsInput
                            .split(',')
                            .map((p) => p.trim())
                            .filter(Boolean)
                    });
                    break;
                case 'service':
                    await createService({
                        ...commonArgs
                    });
                    break;
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
            setTagsInput('');
            setWebsite('');
            setPlatformsInput('');
            setManufacturer('');
            setModel('');
            setProductType('');
            setAddress('');
            setCity('');
            setCountry('');
            setPlaceType('');
            setFeatures([]);
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

                        <div className="flex flex-col gap-2">
                            <Label>Photos</Label>
                            <div className="flex flex-wrap gap-2">
                                {uploadedPhotos.map((photo) => (
                                    <div
                                        key={photo.storageId}
                                        className="relative group w-20 h-20"
                                    >
                                        <img
                                            src={photo.preview}
                                            alt={photo.name}
                                            className="w-full h-full object-cover rounded-md"
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
