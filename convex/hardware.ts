import { v } from 'convex/values';
import { query, mutation } from './_generated/server';
import { isEntryComplete } from './entries';

// Get all hardware
export const getHardware = query({
    args: {
        limit: v.optional(v.number())
    },
    handler: async (ctx, args) => {
        const hardware = await ctx.db
            .query('hardware')
            .withIndex('by_created')
            .order('desc')
            .take(args.limit ?? 50);
        return hardware.map((hw) => ({ ...hw, category: 'hardware' as const }));
    }
});

// Search hardware by name
export const searchHardware = query({
    args: {
        searchQuery: v.string()
    },
    handler: async (ctx, args) => {
        if (!args.searchQuery.trim()) {
            return [];
        }

        const hardware = await ctx.db
            .query('hardware')
            .withSearchIndex('search_hardware', (q) =>
                q.search('name', args.searchQuery)
            )
            .take(20);

        return hardware.map((hw) => ({ ...hw, category: 'hardware' as const }));
    }
});

// Get a single hardware item by ID
export const getHardwareItem = query({
    args: { id: v.id('hardware') },
    handler: async (ctx, args) => {
        const hardware = await ctx.db.get(args.id);
        return hardware ? { ...hardware, category: 'hardware' as const } : null;
    }
});

// Create a new hardware entry
// Note: Tags and accessibility features are now managed through separate junction tables
// Use tags.addTagToEntry and features.addFeatureToEntry after creating the hardware
export const createHardware = mutation({
    args: {
        name: v.string(),
        description: v.string(),
        overallRating: v.number(),
        visualAccessibility: v.optional(v.number()),
        auditoryAccessibility: v.optional(v.number()),
        motorAccessibility: v.optional(v.number()),
        cognitiveAccessibility: v.optional(v.number()),
        website: v.optional(v.string()),
        photos: v.optional(v.array(v.id('_storage'))),
        // Hardware-specific fields
        manufacturer: v.optional(v.string()),
        model: v.optional(v.string()),
        productType: v.optional(v.string()),
        compatibility: v.optional(v.array(v.string())),
        // Legacy fields for backward compatibility
        accessibilityFeatures: v.optional(v.array(v.any())),
        tags: v.optional(v.array(v.string()))
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error('You must be logged in to create an entry');
        }

        const { photos, accessibilityFeatures, tags, ...rest } = args;
        const now = Date.now();
        const newHardware = {
            ...rest,
            photos: photos ?? [],
            createdBy: identity.subject,
            createdAt: now,
            updatedAt: now
        };

        return await ctx.db.insert('hardware', {
            ...newHardware,
            complete: isEntryComplete(newHardware, 'hardware')
        });
    }
});

// Update hardware
// Note: Tags and accessibility features are now managed through separate junction tables
// Use tags.setTagsForEntry and features.setFeaturesForEntry to update them
export const updateHardware = mutation({
    args: {
        id: v.id('hardware'),
        name: v.optional(v.string()),
        description: v.optional(v.string()),
        overallRating: v.optional(v.number()),
        visualAccessibility: v.optional(v.number()),
        auditoryAccessibility: v.optional(v.number()),
        motorAccessibility: v.optional(v.number()),
        cognitiveAccessibility: v.optional(v.number()),
        website: v.optional(v.string()),
        photos: v.optional(v.array(v.id('_storage'))),
        manufacturer: v.optional(v.string()),
        model: v.optional(v.string()),
        productType: v.optional(v.string()),
        compatibility: v.optional(v.array(v.string()))
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error('You must be logged in to update an entry');
        }

        const { id, ...updates } = args;
        const existing = await ctx.db.get(id);
        if (!existing) {
            throw new Error('Hardware not found');
        }

        if (existing.createdBy && existing.createdBy !== identity.subject) {
            throw new Error('You can only edit entries you created');
        }

        const updatedEntry = { ...existing, ...updates };

        return await ctx.db.patch(id, {
            ...updates,
            complete: isEntryComplete(updatedEntry, 'hardware'),
            updatedAt: Date.now()
        });
    }
});

// Delete hardware
export const deleteHardware = mutation({
    args: { id: v.id('hardware') },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error('You must be logged in to delete an entry');
        }

        const hardware = await ctx.db.get(args.id);
        if (!hardware) {
            throw new Error('Hardware not found');
        }

        if (hardware.createdBy && hardware.createdBy !== identity.subject) {
            throw new Error('You can only delete entries you created');
        }

        await ctx.db.delete(args.id);
    }
});
