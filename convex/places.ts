import { v } from 'convex/values';
import { query, mutation } from './_generated/server';
import { isEntryComplete } from './entries';

// Get all places
export const getPlaces = query({
    args: {
        limit: v.optional(v.number())
    },
    handler: async (ctx, args) => {
        const places = await ctx.db
            .query('places')
            .withIndex('by_created')
            .order('desc')
            .take(args.limit ?? 50);
        return places.map((place) => ({
            ...place,
            category: 'place' as const
        }));
    }
});

// Search places by name
export const searchPlaces = query({
    args: {
        searchQuery: v.string()
    },
    handler: async (ctx, args) => {
        if (!args.searchQuery.trim()) {
            return [];
        }

        const places = await ctx.db
            .query('places')
            .withSearchIndex('search_places', (q) =>
                q.search('name', args.searchQuery)
            )
            .take(20);

        return places.map((place) => ({
            ...place,
            category: 'place' as const
        }));
    }
});

// Get a single place by ID
export const getPlace = query({
    args: { id: v.id('places') },
    handler: async (ctx, args) => {
        const place = await ctx.db.get(args.id);
        return place ? { ...place, category: 'place' as const } : null;
    }
});

// Create a new place
export const createPlace = mutation({
    args: {
        name: v.string(),
        description: v.string(),
        accessibilityFeatures: v.array(
            v.object({
                feature: v.string(),
                description: v.optional(v.string()),
                rating: v.number()
            })
        ),
        overallRating: v.number(),
        visualAccessibility: v.optional(v.number()),
        auditoryAccessibility: v.optional(v.number()),
        motorAccessibility: v.optional(v.number()),
        cognitiveAccessibility: v.optional(v.number()),
        tags: v.array(v.string()),
        website: v.optional(v.string()),
        // Place-specific fields
        location: v.object({
            address: v.optional(v.string()),
            city: v.optional(v.string()),
            country: v.optional(v.string()),
            latitude: v.optional(v.number()),
            longitude: v.optional(v.number())
        }),
        placeType: v.optional(v.string()),
        wheelchairAccessible: v.optional(v.boolean()),
        hasAccessibleParking: v.optional(v.boolean()),
        hasAccessibleRestroom: v.optional(v.boolean())
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error('You must be logged in to create an entry');
        }

        const now = Date.now();
        const newPlace = {
            ...args,
            photos: [],
            createdBy: identity.subject,
            createdAt: now,
            updatedAt: now
        };

        return await ctx.db.insert('places', {
            ...newPlace,
            complete: isEntryComplete(newPlace, 'place')
        });
    }
});

// Update a place
export const updatePlace = mutation({
    args: {
        id: v.id('places'),
        name: v.optional(v.string()),
        description: v.optional(v.string()),
        accessibilityFeatures: v.optional(
            v.array(
                v.object({
                    feature: v.string(),
                    description: v.optional(v.string()),
                    rating: v.number()
                })
            )
        ),
        overallRating: v.optional(v.number()),
        visualAccessibility: v.optional(v.number()),
        auditoryAccessibility: v.optional(v.number()),
        motorAccessibility: v.optional(v.number()),
        cognitiveAccessibility: v.optional(v.number()),
        tags: v.optional(v.array(v.string())),
        website: v.optional(v.string()),
        location: v.optional(
            v.object({
                address: v.optional(v.string()),
                city: v.optional(v.string()),
                country: v.optional(v.string()),
                latitude: v.optional(v.number()),
                longitude: v.optional(v.number())
            })
        ),
        placeType: v.optional(v.string()),
        wheelchairAccessible: v.optional(v.boolean()),
        hasAccessibleParking: v.optional(v.boolean()),
        hasAccessibleRestroom: v.optional(v.boolean())
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error('You must be logged in to update an entry');
        }

        const { id, ...updates } = args;
        const existing = await ctx.db.get(id);
        if (!existing) {
            throw new Error('Place not found');
        }

        if (existing.createdBy && existing.createdBy !== identity.subject) {
            throw new Error('You can only edit entries you created');
        }

        const updatedEntry = { ...existing, ...updates };

        return await ctx.db.patch(id, {
            ...updates,
            complete: isEntryComplete(updatedEntry, 'place'),
            updatedAt: Date.now()
        });
    }
});

// Delete a place
export const deletePlace = mutation({
    args: { id: v.id('places') },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error('You must be logged in to delete an entry');
        }

        const place = await ctx.db.get(args.id);
        if (!place) {
            throw new Error('Place not found');
        }

        if (place.createdBy && place.createdBy !== identity.subject) {
            throw new Error('You can only delete entries you created');
        }

        await ctx.db.delete(args.id);
    }
});
