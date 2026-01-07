import { v } from 'convex/values';
import { query, mutation } from './_generated/server';
import { isEntryComplete } from './entries';

// Get all software
export const getSoftware = query({
    args: {
        limit: v.optional(v.number())
    },
    handler: async (ctx, args) => {
        const software = await ctx.db
            .query('software')
            .withIndex('by_created')
            .order('desc')
            .take(args.limit ?? 50);
        return software.map((sw) => ({ ...sw, category: 'software' as const }));
    }
});

// Search software by name
export const searchSoftware = query({
    args: {
        searchQuery: v.string()
    },
    handler: async (ctx, args) => {
        if (!args.searchQuery.trim()) {
            return [];
        }

        const software = await ctx.db
            .query('software')
            .withSearchIndex('search_software', (q) =>
                q.search('name', args.searchQuery)
            )
            .take(20);

        return software.map((sw) => ({ ...sw, category: 'software' as const }));
    }
});

// Get a single software by ID
export const getSoftwareItem = query({
    args: { id: v.id('software') },
    handler: async (ctx, args) => {
        const software = await ctx.db.get(args.id);
        return software ? { ...software, category: 'software' as const } : null;
    }
});

// Create a new software entry
// Note: Tags and accessibility features are now managed through separate junction tables
// Use tags.addTagToEntry and features.addFeatureToEntry after creating the software
export const createSoftware = mutation({
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
        // Software-specific fields
        platforms: v.array(v.string()),
        developer: v.optional(v.string()),
        version: v.optional(v.string()),
        softwareType: v.optional(v.string()),
        hasScreenReaderSupport: v.optional(v.boolean()),
        hasKeyboardNavigation: v.optional(v.boolean()),
        hasHighContrastMode: v.optional(v.boolean())
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error('You must be logged in to create an entry');
        }

        const { photos, ...rest } = args;
        const now = Date.now();
        const newSoftware = {
            ...rest,
            photos: photos ?? [],
            createdBy: identity.subject,
            createdAt: now,
            updatedAt: now
        };

        return await ctx.db.insert('software', {
            ...newSoftware,
            complete: isEntryComplete(newSoftware, 'software')
        });
    }
});

// Update software
// Note: Tags and accessibility features are now managed through separate junction tables
// Use tags.setTagsForEntry and features.setFeaturesForEntry to update them
export const updateSoftware = mutation({
    args: {
        id: v.id('software'),
        name: v.optional(v.string()),
        description: v.optional(v.string()),
        overallRating: v.optional(v.number()),
        visualAccessibility: v.optional(v.number()),
        auditoryAccessibility: v.optional(v.number()),
        motorAccessibility: v.optional(v.number()),
        cognitiveAccessibility: v.optional(v.number()),
        website: v.optional(v.string()),
        photos: v.optional(v.array(v.id('_storage'))),
        platforms: v.optional(v.array(v.string())),
        developer: v.optional(v.string()),
        version: v.optional(v.string()),
        softwareType: v.optional(v.string()),
        hasScreenReaderSupport: v.optional(v.boolean()),
        hasKeyboardNavigation: v.optional(v.boolean()),
        hasHighContrastMode: v.optional(v.boolean())
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error('You must be logged in to update an entry');
        }

        const { id, ...updates } = args;
        const existing = await ctx.db.get(id);
        if (!existing) {
            throw new Error('Software not found');
        }

        if (existing.createdBy && existing.createdBy !== identity.subject) {
            throw new Error('You can only edit entries you created');
        }

        const updatedEntry = { ...existing, ...updates };

        return await ctx.db.patch(id, {
            ...updates,
            complete: isEntryComplete(updatedEntry, 'software'),
            updatedAt: Date.now()
        });
    }
});

// Delete software
export const deleteSoftware = mutation({
    args: { id: v.id('software') },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error('You must be logged in to delete an entry');
        }

        const software = await ctx.db.get(args.id);
        if (!software) {
            throw new Error('Software not found');
        }

        if (software.createdBy && software.createdBy !== identity.subject) {
            throw new Error('You can only delete entries you created');
        }

        await ctx.db.delete(args.id);
    }
});
