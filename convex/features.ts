import { v } from 'convex/values';
import { query, mutation } from './_generated/server';
import type { Id, Doc } from './_generated/dataModel';

// Accessibility type validator
const accessibilityTypeValidator = v.union(
    v.literal('visual'),
    v.literal('auditory'),
    v.literal('motor'),
    v.literal('cognitive'),
    v.literal('general')
);

export type AccessibilityType =
    | 'visual'
    | 'auditory'
    | 'motor'
    | 'cognitive'
    | 'general';

// Helper function to create a slug from a name
function createSlug(name: string): string {
    return name
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

// ============================================
// ACCESSIBILITY FEATURE QUERIES
// ============================================

// Get all features, optionally filtered by accessibility type
export const getFeatures = query({
    args: {
        accessibilityType: v.optional(accessibilityTypeValidator),
        limit: v.optional(v.number())
    },
    handler: async (ctx, args) => {
        const limit = args.limit ?? 100;

        if (args.accessibilityType) {
            return await ctx.db
                .query('accessibilityFeatures')
                .withIndex('by_accessibility_type', (q) =>
                    q.eq('accessibilityType', args.accessibilityType!)
                )
                .take(limit);
        }

        return await ctx.db.query('accessibilityFeatures').take(limit);
    }
});

// Get a single feature by ID
export const getFeature = query({
    args: { id: v.id('accessibilityFeatures') },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.id);
    }
});

// Get a feature by slug
export const getFeatureBySlug = query({
    args: { slug: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query('accessibilityFeatures')
            .withIndex('by_slug', (q) => q.eq('slug', args.slug))
            .first();
    }
});

// Search features by name
export const searchFeatures = query({
    args: {
        searchQuery: v.string(),
        accessibilityType: v.optional(accessibilityTypeValidator)
    },
    handler: async (ctx, args) => {
        if (!args.searchQuery.trim()) {
            return [];
        }

        let query = ctx.db
            .query('accessibilityFeatures')
            .withSearchIndex('search_features', (q) => {
                let search = q.search('name', args.searchQuery);
                if (args.accessibilityType) {
                    search = search.eq(
                        'accessibilityType',
                        args.accessibilityType
                    );
                }
                return search;
            });

        return await query.take(20);
    }
});

// Get popular features (most used)
export const getPopularFeatures = query({
    args: {
        accessibilityType: v.optional(accessibilityTypeValidator),
        limit: v.optional(v.number())
    },
    handler: async (ctx, args) => {
        const limit = args.limit ?? 20;

        const features = await ctx.db
            .query('accessibilityFeatures')
            .withIndex('by_usage_count')
            .order('desc')
            .take(100);

        // Filter by accessibility type if specified
        const filtered = args.accessibilityType
            ? features.filter(
                  (f) => f.accessibilityType === args.accessibilityType
              )
            : features;

        return filtered.slice(0, limit);
    }
});

// ============================================
// ACCESSIBILITY FEATURE MUTATIONS
// ============================================

// Create a new feature
export const createFeature = mutation({
    args: {
        name: v.string(),
        description: v.optional(v.string()),
        accessibilityType: accessibilityTypeValidator
    },
    handler: async (ctx, args) => {
        const slug = createSlug(args.name);

        // Check if feature with this slug already exists
        const existing = await ctx.db
            .query('accessibilityFeatures')
            .withIndex('by_slug', (q) => q.eq('slug', slug))
            .first();

        if (existing) {
            // Return existing feature instead of creating duplicate
            return existing._id;
        }

        return await ctx.db.insert('accessibilityFeatures', {
            name: args.name.trim(),
            slug,
            description: args.description,
            accessibilityType: args.accessibilityType,
            createdAt: Date.now(),
            usageCount: 0
        });
    }
});

// Update a feature
export const updateFeature = mutation({
    args: {
        id: v.id('accessibilityFeatures'),
        name: v.optional(v.string()),
        description: v.optional(v.string()),
        accessibilityType: v.optional(accessibilityTypeValidator)
    },
    handler: async (ctx, args) => {
        const { id, ...updates } = args;
        const feature = await ctx.db.get(id);

        if (!feature) {
            throw new Error('Feature not found');
        }

        const patch: Partial<Doc<'accessibilityFeatures'>> = {};

        if (updates.name !== undefined) {
            patch.name = updates.name.trim();
            patch.slug = createSlug(updates.name);
        }
        if (updates.description !== undefined) {
            patch.description = updates.description;
        }
        if (updates.accessibilityType !== undefined) {
            patch.accessibilityType = updates.accessibilityType;
        }

        await ctx.db.patch(id, patch);
        return id;
    }
});

// Delete a feature (will also remove all entry associations)
export const deleteFeature = mutation({
    args: { id: v.id('accessibilityFeatures') },
    handler: async (ctx, args) => {
        // First, remove all entry-feature associations
        const associations = await ctx.db
            .query('entryFeatures')
            .withIndex('by_feature', (q) => q.eq('featureId', args.id))
            .collect();

        for (const assoc of associations) {
            await ctx.db.delete(assoc._id);
        }

        // Delete the feature
        await ctx.db.delete(args.id);
    }
});

// Create or get existing feature (upsert by name + accessibility type)
export const getOrCreateFeature = mutation({
    args: {
        name: v.string(),
        description: v.optional(v.string()),
        accessibilityType: accessibilityTypeValidator
    },
    handler: async (ctx, args) => {
        const slug = createSlug(args.name);

        // Check if feature exists
        const existing = await ctx.db
            .query('accessibilityFeatures')
            .withIndex('by_slug', (q) => q.eq('slug', slug))
            .first();

        if (existing) {
            return existing;
        }

        // Create new feature
        const id = await ctx.db.insert('accessibilityFeatures', {
            name: args.name.trim(),
            slug,
            description: args.description,
            accessibilityType: args.accessibilityType,
            createdAt: Date.now(),
            usageCount: 0
        });

        return await ctx.db.get(id);
    }
});

// ============================================
// ENTRY-FEATURE ASSOCIATION FUNCTIONS
// ============================================

// Entry type validator
const entryTypeValidator = v.union(
    v.literal('game'),
    v.literal('hardware'),
    v.literal('place'),
    v.literal('software'),
    v.literal('service')
);

// Helper function to get entry ID for a specific type
function getEntryIdForType(
    assoc: Doc<'entryFeatures'>,
    entryType: 'game' | 'hardware' | 'place' | 'software' | 'service'
): string | undefined {
    switch (entryType) {
        case 'game':
            return assoc.gameId;
        case 'hardware':
            return assoc.hardwareId;
        case 'place':
            return assoc.placeId;
        case 'software':
            return assoc.softwareId;
        case 'service':
            return assoc.serviceId;
    }
}

// Add a feature to an entry with rating
export const addFeatureToEntry = mutation({
    args: {
        entryType: entryTypeValidator,
        entryId: v.string(),
        featureId: v.id('accessibilityFeatures'),
        rating: v.number(), // 1-5
        notes: v.optional(v.string())
    },
    handler: async (ctx, args) => {
        const { entryType, entryId, featureId, rating, notes } = args;

        // Validate rating
        if (rating < 1 || rating > 5) {
            throw new Error('Rating must be between 1 and 5');
        }

        // Check if association already exists
        const allAssocs = await ctx.db
            .query('entryFeatures')
            .withIndex('by_feature', (q) => q.eq('featureId', featureId))
            .collect();

        const existing = allAssocs.find((a) => {
            switch (entryType) {
                case 'game':
                    return a.gameId === entryId;
                case 'hardware':
                    return a.hardwareId === entryId;
                case 'place':
                    return a.placeId === entryId;
                case 'software':
                    return a.softwareId === entryId;
                case 'service':
                    return a.serviceId === entryId;
            }
        });

        if (existing) {
            // Update the existing rating/notes
            await ctx.db.patch(existing._id, { rating, notes });
            return existing._id;
        }

        // Create association
        const assocId = await ctx.db.insert('entryFeatures', {
            entryType,
            gameId: entryType === 'game' ? (entryId as Id<'games'>) : undefined,
            hardwareId:
                entryType === 'hardware'
                    ? (entryId as Id<'hardware'>)
                    : undefined,
            placeId:
                entryType === 'place' ? (entryId as Id<'places'>) : undefined,
            softwareId:
                entryType === 'software'
                    ? (entryId as Id<'software'>)
                    : undefined,
            serviceId:
                entryType === 'service'
                    ? (entryId as Id<'services'>)
                    : undefined,
            featureId,
            rating,
            notes,
            createdAt: Date.now()
        });

        // Increment usage count
        const feature = await ctx.db.get(featureId);
        if (feature) {
            await ctx.db.patch(featureId, {
                usageCount: feature.usageCount + 1
            });
        }

        return assocId;
    }
});

// Remove a feature from an entry
export const removeFeatureFromEntry = mutation({
    args: {
        entryType: entryTypeValidator,
        entryId: v.string(),
        featureId: v.id('accessibilityFeatures')
    },
    handler: async (ctx, args) => {
        const { entryType, entryId, featureId } = args;

        // Find existing association
        const allAssocs = await ctx.db
            .query('entryFeatures')
            .withIndex('by_feature', (q) => q.eq('featureId', featureId))
            .collect();

        const existing = allAssocs.find((a) => {
            switch (entryType) {
                case 'game':
                    return a.gameId === entryId;
                case 'hardware':
                    return a.hardwareId === entryId;
                case 'place':
                    return a.placeId === entryId;
                case 'software':
                    return a.softwareId === entryId;
                case 'service':
                    return a.serviceId === entryId;
            }
        });

        if (existing) {
            await ctx.db.delete(existing._id);

            // Decrement usage count
            const feature = await ctx.db.get(featureId);
            if (feature && feature.usageCount > 0) {
                await ctx.db.patch(featureId, {
                    usageCount: feature.usageCount - 1
                });
            }
        }
    }
});

// Get all features for an entry (with their ratings)
export const getFeaturesForEntry = query({
    args: {
        entryType: entryTypeValidator,
        entryId: v.string()
    },
    handler: async (ctx, args) => {
        const { entryType, entryId } = args;

        // Get all entryFeatures and filter by the entry ID
        const allAssocs = await ctx.db.query('entryFeatures').collect();
        const associations = allAssocs.filter(
            (a) =>
                a.entryType === entryType &&
                getEntryIdForType(a, entryType) === entryId
        );

        // Fetch the actual feature documents and combine with ratings
        const features = await Promise.all(
            associations.map(async (assoc) => {
                const feature = await ctx.db.get(assoc.featureId);
                if (!feature) return null;
                return {
                    ...feature,
                    rating: assoc.rating,
                    notes: assoc.notes
                };
            })
        );

        // Filter out null values and return
        return features.filter((f): f is NonNullable<typeof f> => f !== null);
    }
});

// Get all entries with a specific feature
export const getEntriesWithFeature = query({
    args: {
        featureId: v.id('accessibilityFeatures'),
        entryType: v.optional(entryTypeValidator),
        minRating: v.optional(v.number())
    },
    handler: async (ctx, args) => {
        const associations = await ctx.db
            .query('entryFeatures')
            .withIndex('by_feature', (q) => q.eq('featureId', args.featureId))
            .collect();

        // Filter by entry type and minimum rating if specified
        let filtered = associations;

        if (args.entryType) {
            filtered = filtered.filter((a) => a.entryType === args.entryType);
        }

        if (args.minRating !== undefined) {
            filtered = filtered.filter((a) => a.rating >= args.minRating!);
        }

        return filtered;
    }
});

// Set all features for an entry (replaces existing features)
export const setFeaturesForEntry = mutation({
    args: {
        entryType: entryTypeValidator,
        entryId: v.string(),
        features: v.array(
            v.object({
                featureId: v.id('accessibilityFeatures'),
                rating: v.number(),
                notes: v.optional(v.string())
            })
        )
    },
    handler: async (ctx, args) => {
        const { entryType, entryId, features } = args;

        // Get existing associations for this entry
        const allAssocs = await ctx.db.query('entryFeatures').collect();
        const existing = allAssocs.filter(
            (a) =>
                a.entryType === entryType &&
                getEntryIdForType(a, entryType) === entryId
        );

        const existingFeatureIds = new Set(existing.map((e) => e.featureId));
        const newFeatureIds = new Set(features.map((f) => f.featureId));

        // Remove old associations not in new list
        for (const assoc of existing) {
            if (!newFeatureIds.has(assoc.featureId)) {
                await ctx.db.delete(assoc._id);
                const feature = await ctx.db.get(assoc.featureId);
                if (feature && feature.usageCount > 0) {
                    await ctx.db.patch(assoc.featureId, {
                        usageCount: feature.usageCount - 1
                    });
                }
            }
        }

        // Add or update features
        for (const { featureId, rating, notes } of features) {
            // Validate rating
            if (rating < 1 || rating > 5) {
                throw new Error('Rating must be between 1 and 5');
            }

            if (existingFeatureIds.has(featureId)) {
                // Update existing
                const assoc = existing.find((e) => e.featureId === featureId);
                if (assoc) {
                    await ctx.db.patch(assoc._id, { rating, notes });
                }
            } else {
                // Create new
                await ctx.db.insert('entryFeatures', {
                    entryType,
                    gameId:
                        entryType === 'game'
                            ? (entryId as Id<'games'>)
                            : undefined,
                    hardwareId:
                        entryType === 'hardware'
                            ? (entryId as Id<'hardware'>)
                            : undefined,
                    placeId:
                        entryType === 'place'
                            ? (entryId as Id<'places'>)
                            : undefined,
                    softwareId:
                        entryType === 'software'
                            ? (entryId as Id<'software'>)
                            : undefined,
                    serviceId:
                        entryType === 'service'
                            ? (entryId as Id<'services'>)
                            : undefined,
                    featureId,
                    rating,
                    notes,
                    createdAt: Date.now()
                });

                const feature = await ctx.db.get(featureId);
                if (feature) {
                    await ctx.db.patch(featureId, {
                        usageCount: feature.usageCount + 1
                    });
                }
            }
        }
    }
});

// Update the rating for a specific feature on an entry
export const updateEntryFeatureRating = mutation({
    args: {
        entryType: entryTypeValidator,
        entryId: v.string(),
        featureId: v.id('accessibilityFeatures'),
        rating: v.number(),
        notes: v.optional(v.string())
    },
    handler: async (ctx, args) => {
        const { entryType, entryId, featureId, rating, notes } = args;

        if (rating < 1 || rating > 5) {
            throw new Error('Rating must be between 1 and 5');
        }

        // Find existing association
        const allAssocs = await ctx.db
            .query('entryFeatures')
            .withIndex('by_feature', (q) => q.eq('featureId', featureId))
            .collect();

        const existing = allAssocs.find((a) => {
            switch (entryType) {
                case 'game':
                    return a.gameId === entryId;
                case 'hardware':
                    return a.hardwareId === entryId;
                case 'place':
                    return a.placeId === entryId;
                case 'software':
                    return a.softwareId === entryId;
                case 'service':
                    return a.serviceId === entryId;
            }
        });

        if (!existing) {
            throw new Error('Feature not associated with this entry');
        }

        await ctx.db.patch(existing._id, { rating, notes });
        return existing._id;
    }
});
