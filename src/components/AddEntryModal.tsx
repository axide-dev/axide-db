'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from 'convex/react';
import { useUser, SignInButton } from '@clerk/nextjs';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { Input } from '~/components/ui/input';
import { Textarea } from '~/components/ui/textarea';
import { Button } from '~/components/ui/button';
import { Label } from '~/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from '~/components/ui/dialog';
import { Badge } from '~/components/ui/badge';
import { Card, CardContent } from '~/components/ui/card';

type Category = 'game' | 'hardware' | 'place' | 'software' | 'service';

const CATEGORIES: { value: Category; label: string; icon: string }[] = [
    { value: 'game', label: 'Game', icon: '🎮' },
    { value: 'hardware', label: 'Hardware', icon: '🖥️' },
    { value: 'place', label: 'Place', icon: '📍' },
    { value: 'software', label: 'Software', icon: '💿' },
    { value: 'service', label: 'Service', icon: '🛎️' }
];

const TOTAL_STEPS = 5;

function StepIndicator({
    currentStep,
    totalSteps
}: {
    currentStep: number;
    totalSteps: number;
}) {
    return (
        <div className="flex items-center justify-center gap-2">
            {Array.from({ length: totalSteps }, (_, i) => (
                <div
                    key={i}
                    className={`h-2 w-2 rounded-full transition-colors ${
                        i + 1 === currentStep
                            ? 'bg-red-500'
                            : i + 1 < currentStep
                              ? 'bg-red-500/60'
                              : 'bg-muted-foreground/30'
                    }`}
                />
            ))}
        </div>
    );
}

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

// Rating input with "I don't know" option for optional accessibility ratings
// Returns: undefined = "I don't know", 1-5 = actual rating
function OptionalRatingInput({
    value,
    onChange,
    label
}: {
    value: number | undefined;
    onChange: (value: number | undefined) => void;
    label: string;
}) {
    const isUnknown = value === undefined;

    return (
        <div className="flex flex-col gap-2">
            <Label>{label}</Label>
            <div className="flex items-center gap-2">
                <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            type="button"
                            onClick={() => onChange(star)}
                            className={`text-2xl transition-colors ${
                                !isUnknown && star <= (value ?? 0)
                                    ? 'text-yellow-400'
                                    : 'text-gray-600 hover:text-yellow-300'
                            }`}
                        >
                            ★
                        </button>
                    ))}
                </div>
                <button
                    type="button"
                    onClick={() => onChange(undefined)}
                    className={`ml-2 rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                        isUnknown
                            ? 'bg-muted-foreground/20 text-foreground'
                            : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                    }`}
                >
                    I don't know
                </button>
            </div>
        </div>
    );
}

function SimilarEntryCard({
    entry,
    onSelect
}: {
    entry: {
        _id: string;
        name: string;
        category: Category;
        overallRating: number;
    };
    onSelect: () => void;
}) {
    const categoryInfo = CATEGORIES.find((c) => c.value === entry.category);
    return (
        <button
            type="button"
            onClick={onSelect}
            className="bg-muted/50 hover:bg-muted flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors"
        >
            <span className="text-xl">{categoryInfo?.icon}</span>
            <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{entry.name}</p>
                <p className="text-muted-foreground text-sm">
                    {categoryInfo?.label} • {'★'.repeat(entry.overallRating)}
                </p>
            </div>
        </button>
    );
}

export function AddEntryModal({
    onSuccess
}: {
    onSuccess?: () => void;
} = {}) {
    const router = useRouter();
    const { isSignedIn } = useUser();
    const createGame = useMutation(api.games.createGame);
    const createHardware = useMutation(api.hardware.createHardware);
    const createPlace = useMutation(api.places.createPlace);
    const createSoftware = useMutation(api.software.createSoftware);
    const createService = useMutation(api.services.createService);

    const [open, setOpen] = React.useState(false);
    const [step, setStep] = React.useState(1);

    // Form state
    const [category, setCategory] = React.useState<Category | null>(null);
    const [name, setName] = React.useState('');
    const [description, setDescription] = React.useState('');
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

    // Fuzzy search - search as user types name
    const searchResults = useQuery(
        api.entries.searchEntries,
        name.length >= 2
            ? { searchQuery: name, category: category ?? undefined }
            : 'skip'
    );

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

    const resetForm = () => {
        setStep(1);
        setCategory(null);
        setName('');
        setDescription('');
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
        setNewFeature('');
        setNewFeatureRating(3);
    };

    const handleSubmit = async () => {
        if (!name.trim() || !description.trim() || !category) return;

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
            website: website.trim() || undefined
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

            resetForm();
            setOpen(false);
            onSuccess?.();
        } catch (error) {
            console.error('Failed to create entry:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const canProceed = () => {
        switch (step) {
            case 1:
                return category !== null;
            case 2:
                return name.trim().length > 0;
            case 3:
                return description.trim().length > 0;
            case 4:
                return true; // Ratings have defaults
            case 5:
                return true; // Features are optional
            default:
                return false;
        }
    };

    const handleNext = () => {
        if (step < TOTAL_STEPS && canProceed()) {
            setStep(step + 1);
        }
    };

    const handleBack = () => {
        if (step > 1) {
            setStep(step - 1);
        }
    };

    const getStepTitle = () => {
        switch (step) {
            case 1:
                return 'Select Category';
            case 2:
                return 'Entry Name';
            case 3:
                return 'Description';
            case 4:
                return 'Accessibility Ratings';
            case 5:
                return 'Features & Details';
            default:
                return 'Add Entry';
        }
    };

    const getStepDescription = () => {
        switch (step) {
            case 1:
                return 'What type of entry are you adding?';
            case 2:
                return 'Enter the name and check for existing entries';
            case 3:
                return 'Describe the accessibility features and experience';
            case 4:
                return 'Rate the accessibility in different areas';
            case 5:
                return 'Add specific features and additional information';
            default:
                return '';
        }
    };

    return (
        <Dialog
            open={open}
            onOpenChange={(newOpen) => {
                setOpen(newOpen);
                if (!newOpen) {
                    resetForm();
                }
            }}
        >
            <DialogTrigger asChild>
                <Button size="lg">+ Add New Entry</Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
                {!isSignedIn ? (
                    <div className="flex flex-col items-center gap-6 py-8 text-center">
                        <div className="rounded-full bg-red-500/10 p-4">
                            <span className="text-4xl">🔒</span>
                        </div>
                        <div className="space-y-2">
                            <DialogTitle className="text-xl">
                                Sign In Required
                            </DialogTitle>
                            <DialogDescription className="max-w-sm">
                                For security reasons, you must be logged in to
                                add accessibility entries. This helps us
                                maintain data quality and prevent spam.
                            </DialogDescription>
                        </div>
                        <SignInButton mode="modal">
                            <Button size="lg" className="mt-4">
                                Sign In to Continue
                            </Button>
                        </SignInButton>
                    </div>
                ) : (
                    <>
                        <DialogHeader>
                            <DialogTitle>{getStepTitle()}</DialogTitle>
                            <DialogDescription>
                                {getStepDescription()}
                            </DialogDescription>
                            <div className="pt-2">
                                <StepIndicator
                                    currentStep={step}
                                    totalSteps={TOTAL_STEPS}
                                />
                            </div>
                        </DialogHeader>

                        <div className="py-4">
                            {/* Step 1: Category Selection */}
                            {step === 1 && (
                                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                                    {CATEGORIES.map((cat) => (
                                        <button
                                            key={cat.value}
                                            type="button"
                                            onClick={() =>
                                                setCategory(cat.value)
                                            }
                                            className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all ${
                                                category === cat.value
                                                    ? 'border-red-500 bg-red-500/10'
                                                    : 'border-muted hover:border-muted-foreground/50'
                                            }`}
                                        >
                                            <span className="text-3xl">
                                                {cat.icon}
                                            </span>
                                            <span className="font-medium">
                                                {cat.label}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Step 2: Name with Fuzzy Search */}
                            {step === 2 && (
                                <div className="flex flex-col gap-4">
                                    <div className="flex flex-col gap-2">
                                        <Label htmlFor="name">Name *</Label>
                                        <Input
                                            id="name"
                                            placeholder={`e.g., ${category === 'game' ? 'The Last of Us Part II' : category === 'hardware' ? 'Xbox Adaptive Controller' : category === 'place' ? 'Central Park' : category === 'software' ? 'NVDA Screen Reader' : 'Netflix Accessibility'}`}
                                            value={name}
                                            onChange={(e) =>
                                                setName(e.target.value)
                                            }
                                            autoFocus
                                        />
                                    </div>

                                    {/* Similar entries */}
                                    {searchResults &&
                                        searchResults.length > 0 && (
                                            <div className="flex flex-col gap-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-muted-foreground text-sm font-medium">
                                                        Similar entries found:
                                                    </span>
                                                    <Badge
                                                        variant="outline"
                                                        className="text-xs"
                                                    >
                                                        {searchResults.length}{' '}
                                                        found
                                                    </Badge>
                                                </div>
                                                <Card>
                                                    <CardContent className="max-h-48 space-y-2 overflow-y-auto p-2">
                                                        {searchResults
                                                            .slice(0, 5)
                                                            .map((entry) => (
                                                                <SimilarEntryCard
                                                                    key={
                                                                        entry._id
                                                                    }
                                                                    entry={
                                                                        entry
                                                                    }
                                                                    onSelect={() => {
                                                                        setOpen(
                                                                            false
                                                                        );
                                                                        router.push(
                                                                            `/entry/${entry._id}`
                                                                        );
                                                                    }}
                                                                />
                                                            ))}
                                                    </CardContent>
                                                </Card>
                                                <p className="text-muted-foreground text-xs">
                                                    If your entry already
                                                    exists, consider adding a
                                                    review instead.
                                                </p>
                                            </div>
                                        )}

                                    {name.length >= 2 &&
                                        (!searchResults ||
                                            searchResults.length === 0) && (
                                            <p className="text-muted-foreground text-sm">
                                                ✓ No similar entries found.
                                                You're adding something new!
                                            </p>
                                        )}
                                </div>
                            )}

                            {/* Step 3: Description */}
                            {step === 3 && (
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="description">
                                        Description *
                                    </Label>
                                    <Textarea
                                        id="description"
                                        placeholder="Describe the accessibility features and experience. Be specific about what works well and what could be improved..."
                                        value={description}
                                        onChange={(e) =>
                                            setDescription(e.target.value)
                                        }
                                        rows={6}
                                        autoFocus
                                    />
                                    <p className="text-muted-foreground text-xs">
                                        {description.length} characters
                                    </p>
                                </div>
                            )}

                            {/* Step 4: Ratings */}
                            {step === 4 && (
                                <div className="flex flex-col gap-6">
                                    <RatingInput
                                        label="Overall Accessibility Rating *"
                                        value={overallRating}
                                        onChange={setOverallRating}
                                    />

                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <OptionalRatingInput
                                            label="👁️ Visual Accessibility"
                                            value={visualAccessibility}
                                            onChange={setVisualAccessibility}
                                        />
                                        <OptionalRatingInput
                                            label="👂 Auditory Accessibility"
                                            value={auditoryAccessibility}
                                            onChange={setAuditoryAccessibility}
                                        />
                                        <OptionalRatingInput
                                            label="🖐️ Motor Accessibility"
                                            value={motorAccessibility}
                                            onChange={setMotorAccessibility}
                                        />
                                        <OptionalRatingInput
                                            label="🧠 Cognitive Accessibility"
                                            value={cognitiveAccessibility}
                                            onChange={setCognitiveAccessibility}
                                        />
                                    </div>

                                    <p className="text-muted-foreground text-xs">
                                        Click "I don't know" if you're unsure
                                        about a specific accessibility type
                                    </p>
                                </div>
                            )}

                            {/* Step 5: Features & Additional Info */}
                            {step === 5 && (
                                <div className="flex flex-col gap-6">
                                    {/* Features */}
                                    <div className="flex flex-col gap-3">
                                        <Label>Accessibility Features</Label>
                                        <div className="flex items-end gap-2">
                                            <div className="flex-1">
                                                <Input
                                                    placeholder="e.g., Subtitles, Color Blind Mode"
                                                    value={newFeature}
                                                    onChange={(e) =>
                                                        setNewFeature(
                                                            e.target.value
                                                        )
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
                                                        onClick={() =>
                                                            removeFeature(i)
                                                        }
                                                    >
                                                        {f.feature} ({f.rating}
                                                        ★) ✕
                                                    </Badge>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Tags */}
                                    <div className="flex flex-col gap-2">
                                        <Label htmlFor="tags">
                                            Tags (comma-separated)
                                        </Label>
                                        <Input
                                            id="tags"
                                            placeholder="e.g., blind-friendly, screen-reader, subtitles"
                                            value={tagsInput}
                                            onChange={(e) =>
                                                setTagsInput(e.target.value)
                                            }
                                        />
                                    </div>

                                    {/* Website */}
                                    <div className="flex flex-col gap-2">
                                        <Label htmlFor="website">
                                            Website (optional)
                                        </Label>
                                        <Input
                                            id="website"
                                            type="url"
                                            placeholder="https://..."
                                            value={website}
                                            onChange={(e) =>
                                                setWebsite(e.target.value)
                                            }
                                        />
                                    </div>

                                    {/* Platforms (for games/software) */}
                                    {(category === 'game' ||
                                        category === 'software') && (
                                        <div className="flex flex-col gap-2">
                                            <Label htmlFor="platforms">
                                                Platforms (comma-separated)
                                            </Label>
                                            <Input
                                                id="platforms"
                                                placeholder="e.g., PC, PlayStation 5, Xbox Series X"
                                                value={platformsInput}
                                                onChange={(e) =>
                                                    setPlatformsInput(
                                                        e.target.value
                                                    )
                                                }
                                            />
                                        </div>
                                    )}

                                    {/* Hardware-specific fields */}
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
                                                        setManufacturer(
                                                            e.target.value
                                                        )
                                                    }
                                                />
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <Label htmlFor="model">
                                                    Model
                                                </Label>
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
                                                        setProductType(
                                                            e.target.value
                                                        )
                                                    }
                                                />
                                            </div>
                                        </>
                                    )}

                                    {/* Place-specific fields */}
                                    {category === 'place' && (
                                        <>
                                            <div className="flex flex-col gap-2">
                                                <Label htmlFor="address">
                                                    Address
                                                </Label>
                                                <Input
                                                    id="address"
                                                    placeholder="Street address"
                                                    value={address}
                                                    onChange={(e) =>
                                                        setAddress(
                                                            e.target.value
                                                        )
                                                    }
                                                />
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <Label htmlFor="city">
                                                    City
                                                </Label>
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
                                                <Label htmlFor="country">
                                                    Country
                                                </Label>
                                                <Input
                                                    id="country"
                                                    placeholder="Country"
                                                    value={country}
                                                    onChange={(e) =>
                                                        setCountry(
                                                            e.target.value
                                                        )
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
                                                        setPlaceType(
                                                            e.target.value
                                                        )
                                                    }
                                                />
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>

                        <DialogFooter className="flex-col gap-3 sm:flex-row">
                            <div className="flex w-full gap-2 sm:w-auto">
                                {step > 1 && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handleBack}
                                        className="flex-1 sm:flex-none"
                                    >
                                        ← Back
                                    </Button>
                                )}
                                {step < TOTAL_STEPS ? (
                                    <Button
                                        type="button"
                                        onClick={handleNext}
                                        disabled={!canProceed()}
                                        className="flex-1 sm:flex-none"
                                    >
                                        Next →
                                    </Button>
                                ) : (
                                    <Button
                                        type="button"
                                        onClick={handleSubmit}
                                        disabled={
                                            isSubmitting ||
                                            !name.trim() ||
                                            !description.trim() ||
                                            !category
                                        }
                                        className="flex-1 sm:flex-none"
                                    >
                                        {isSubmitting
                                            ? 'Submitting...'
                                            : 'Submit Entry'}
                                    </Button>
                                )}
                            </div>
                        </DialogFooter>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
