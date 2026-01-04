import { v } from 'convex/values';
import { query, mutation } from './_generated/server';

// Get all entries with optional filtering
export const getEntries = query({
    args: {
        category: v.optional(
            v.union(
                v.literal('game'),
                v.literal('hardware'),
                v.literal('place'),
                v.literal('software'),
                v.literal('service')
            )
        ),
        limit: v.optional(v.number())
    },
    handler: async (ctx, args) => {
        if (args.category) {
            const entries = await ctx.db
                .query('accessibilityEntries')
                .withIndex('by_category', (q) =>
                    q.eq('category', args.category!)
                )
                .order('desc')
                .take(args.limit ?? 50);
            return entries;
        }

        const entries = await ctx.db
            .query('accessibilityEntries')
            .order('desc')
            .take(args.limit ?? 50);

        return entries;
    }
});

// Search entries by name
export const searchEntries = query({
    args: {
        searchQuery: v.string(),
        category: v.optional(
            v.union(
                v.literal('game'),
                v.literal('hardware'),
                v.literal('place'),
                v.literal('software'),
                v.literal('service')
            )
        )
    },
    handler: async (ctx, args) => {
        if (!args.searchQuery.trim()) {
            return [];
        }

        let search = ctx.db
            .query('accessibilityEntries')
            .withSearchIndex('search_entries', (q) => {
                let searchQ = q.search('name', args.searchQuery);
                if (args.category) {
                    searchQ = searchQ.eq('category', args.category);
                }
                return searchQ;
            });

        return await search.take(20);
    }
});

// Get a single entry by ID
export const getEntry = query({
    args: { id: v.id('accessibilityEntries') },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.id);
    }
});

// Create a new entry
export const createEntry = mutation({
    args: {
        name: v.string(),
        description: v.string(),
        category: v.union(
            v.literal('game'),
            v.literal('hardware'),
            v.literal('place'),
            v.literal('software'),
            v.literal('service')
        ),
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
        location: v.optional(
            v.object({
                address: v.optional(v.string()),
                city: v.optional(v.string()),
                country: v.optional(v.string()),
                latitude: v.optional(v.number()),
                longitude: v.optional(v.number())
            })
        ),
        platforms: v.optional(v.array(v.string()))
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error('You must be logged in to create an entry');
        }

        const now = Date.now();
        return await ctx.db.insert('accessibilityEntries', {
            ...args,
            photos: [],
            createdBy: identity.subject,
            createdAt: now,
            updatedAt: now
        });
    }
});

// Update an entry
export const updateEntry = mutation({
    args: {
        id: v.id('accessibilityEntries'),
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
        website: v.optional(v.string())
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error('You must be logged in to update an entry');
        }

        const { id, ...updates } = args;
        const existing = await ctx.db.get(id);
        if (!existing) {
            throw new Error('Entry not found');
        }

        // Only the creator can update the entry
        if (existing.createdBy && existing.createdBy !== identity.subject) {
            throw new Error('You can only edit entries you created');
        }

        return await ctx.db.patch(id, {
            ...updates,
            updatedAt: Date.now()
        });
    }
});

// Delete an entry (requires authentication - only owner can delete)
export const deleteEntry = mutation({
    args: { id: v.id('accessibilityEntries') },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error('You must be logged in to delete an entry');
        }

        const entry = await ctx.db.get(args.id);
        if (!entry) {
            throw new Error('Entry not found');
        }

        // Only the creator can delete the entry
        if (entry.createdBy && entry.createdBy !== identity.subject) {
            throw new Error('You can only delete entries you created');
        }

        await ctx.db.delete(args.id);
    }
});
