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
// TAG QUERIES
// ============================================

// Get all tags, optionally filtered by accessibility type
export const getTags = query({
    args: {
        accessibilityType: v.optional(accessibilityTypeValidator),
        limit: v.optional(v.number())
    },
    handler: async (ctx, args) => {
        const limit = args.limit ?? 100;

        if (args.accessibilityType) {
            return await ctx.db
                .query('tags')
                .withIndex('by_accessibility_type', (q) =>
                    q.eq('accessibilityType', args.accessibilityType!)
                )
                .take(limit);
        }

        return await ctx.db.query('tags').take(limit);
    }
});

// Get a single tag by ID
export const getTag = query({
    args: { id: v.id('tags') },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.id);
    }
});

// Get a tag by slug
export const getTagBySlug = query({
    args: { slug: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query('tags')
            .withIndex('by_slug', (q) => q.eq('slug', args.slug))
            .first();
    }
});

// Search tags by name
export const searchTags = query({
    args: {
        searchQuery: v.string(),
        accessibilityType: v.optional(accessibilityTypeValidator)
    },
    handler: async (ctx, args) => {
        if (!args.searchQuery.trim()) {
            return [];
        }

        let query = ctx.db.query('tags').withSearchIndex('search_tags', (q) => {
            let search = q.search('name', args.searchQuery);
            if (args.accessibilityType) {
                search = search.eq('accessibilityType', args.accessibilityType);
            }
            return search;
        });

        return await query.take(20);
    }
});

// Get popular tags (most used)
export const getPopularTags = query({
    args: {
        accessibilityType: v.optional(accessibilityTypeValidator),
        limit: v.optional(v.number())
    },
    handler: async (ctx, args) => {
        const limit = args.limit ?? 20;

        const tags = await ctx.db
            .query('tags')
            .withIndex('by_usage_count')
            .order('desc')
            .take(100);

        // Filter by accessibility type if specified
        const filtered = args.accessibilityType
            ? tags.filter((t) => t.accessibilityType === args.accessibilityType)
            : tags;

        return filtered.slice(0, limit);
    }
});

// ============================================
// TAG MUTATIONS
// ============================================

// Create a new tag
export const createTag = mutation({
    args: {
        name: v.string(),
        description: v.optional(v.string()),
        accessibilityType: accessibilityTypeValidator
    },
    handler: async (ctx, args) => {
        const slug = createSlug(args.name);

        // Check if tag with this slug already exists
        const existing = await ctx.db
            .query('tags')
            .withIndex('by_slug', (q) => q.eq('slug', slug))
            .first();

        if (existing) {
            // Return existing tag instead of creating duplicate
            return existing._id;
        }

        return await ctx.db.insert('tags', {
            name: args.name.trim(),
            slug,
            description: args.description,
            accessibilityType: args.accessibilityType,
            createdAt: Date.now(),
            usageCount: 0
        });
    }
});

// Update a tag
export const updateTag = mutation({
    args: {
        id: v.id('tags'),
        name: v.optional(v.string()),
        description: v.optional(v.string()),
        accessibilityType: v.optional(accessibilityTypeValidator)
    },
    handler: async (ctx, args) => {
        const { id, ...updates } = args;
        const tag = await ctx.db.get(id);

        if (!tag) {
            throw new Error('Tag not found');
        }

        const patch: Partial<Doc<'tags'>> = {};

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

// Delete a tag (will also remove all entry associations)
export const deleteTag = mutation({
    args: { id: v.id('tags') },
    handler: async (ctx, args) => {
        // First, remove all entry-tag associations
        const associations = await ctx.db
            .query('entryTags')
            .withIndex('by_tag', (q) => q.eq('tagId', args.id))
            .collect();

        for (const assoc of associations) {
            await ctx.db.delete(assoc._id);
        }

        // Delete the tag
        await ctx.db.delete(args.id);
    }
});

// Create or get existing tag (upsert by name + accessibility type)
export const getOrCreateTag = mutation({
    args: {
        name: v.string(),
        description: v.optional(v.string()),
        accessibilityType: accessibilityTypeValidator
    },
    handler: async (ctx, args) => {
        const slug = createSlug(args.name);

        // Check if tag exists
        const existing = await ctx.db
            .query('tags')
            .withIndex('by_slug', (q) => q.eq('slug', slug))
            .first();

        if (existing) {
            return existing;
        }

        // Create new tag
        const id = await ctx.db.insert('tags', {
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
// ENTRY-TAG ASSOCIATION FUNCTIONS
// ============================================

// Entry type validator
const entryTypeValidator = v.union(
    v.literal('game'),
    v.literal('hardware'),
    v.literal('place'),
    v.literal('software'),
    v.literal('service')
);

// Add a tag to an entry
export const addTagToEntry = mutation({
    args: {
        entryType: entryTypeValidator,
        entryId: v.string(),
        tagId: v.id('tags')
    },
    handler: async (ctx, args) => {
        const { entryType, entryId, tagId } = args;

        // Check if association already exists by querying the tag index and filtering
        const allAssocs = await ctx.db
            .query('entryTags')
            .withIndex('by_tag', (q) => q.eq('tagId', tagId))
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
            return existing._id;
        }

        // Create association
        const assocId = await ctx.db.insert('entryTags', {
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
            tagId,
            createdAt: Date.now()
        });

        // Increment usage count
        const tag = await ctx.db.get(tagId);
        if (tag) {
            await ctx.db.patch(tagId, { usageCount: tag.usageCount + 1 });
        }

        return assocId;
    }
});

// Remove a tag from an entry
export const removeTagFromEntry = mutation({
    args: {
        entryType: entryTypeValidator,
        entryId: v.string(),
        tagId: v.id('tags')
    },
    handler: async (ctx, args) => {
        const { entryType, entryId, tagId } = args;

        // Find the existing association
        const allAssocs = await ctx.db
            .query('entryTags')
            .withIndex('by_tag', (q) => q.eq('tagId', tagId))
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
            const tag = await ctx.db.get(tagId);
            if (tag && tag.usageCount > 0) {
                await ctx.db.patch(tagId, { usageCount: tag.usageCount - 1 });
            }
        }
    }
});

// Helper function to get entry ID for a specific type
function getEntryIdForType(
    assoc: Doc<'entryTags'>,
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

// Get all tags for an entry
export const getTagsForEntry = query({
    args: {
        entryType: entryTypeValidator,
        entryId: v.string()
    },
    handler: async (ctx, args) => {
        const { entryType, entryId } = args;

        // Get all entryTags and filter by the entry ID
        const allAssocs = await ctx.db.query('entryTags').collect();
        const associations = allAssocs.filter(
            (a) =>
                a.entryType === entryType &&
                getEntryIdForType(a, entryType) === entryId
        );

        // Fetch the actual tag documents
        const tags = await Promise.all(
            associations.map((assoc) => ctx.db.get(assoc.tagId))
        );

        return tags.filter((t): t is Doc<'tags'> => t !== null);
    }
});

// Get all entries with a specific tag
export const getEntriesWithTag = query({
    args: {
        tagId: v.id('tags'),
        entryType: v.optional(entryTypeValidator)
    },
    handler: async (ctx, args) => {
        const associations = await ctx.db
            .query('entryTags')
            .withIndex('by_tag', (q) => q.eq('tagId', args.tagId))
            .collect();

        // Filter by entry type if specified
        const filtered = args.entryType
            ? associations.filter((a) => a.entryType === args.entryType)
            : associations;

        return filtered;
    }
});

// Set all tags for an entry (replaces existing tags)
export const setTagsForEntry = mutation({
    args: {
        entryType: entryTypeValidator,
        entryId: v.string(),
        tagIds: v.array(v.id('tags'))
    },
    handler: async (ctx, args) => {
        const { entryType, entryId, tagIds } = args;

        // Get existing associations for this entry
        const allAssocs = await ctx.db.query('entryTags').collect();
        const existing = allAssocs.filter(
            (a) =>
                a.entryType === entryType &&
                getEntryIdForType(a, entryType) === entryId
        );

        const existingTagIds = new Set(existing.map((e) => e.tagId));
        const newTagIds = new Set(tagIds);

        // Remove old associations not in new list
        for (const assoc of existing) {
            if (!newTagIds.has(assoc.tagId)) {
                await ctx.db.delete(assoc._id);
                const tag = await ctx.db.get(assoc.tagId);
                if (tag && tag.usageCount > 0) {
                    await ctx.db.patch(assoc.tagId, {
                        usageCount: tag.usageCount - 1
                    });
                }
            }
        }

        // Add new associations
        for (const tagId of tagIds) {
            if (!existingTagIds.has(tagId)) {
                await ctx.db.insert('entryTags', {
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
                    tagId,
                    createdAt: Date.now()
                });

                const tag = await ctx.db.get(tagId);
                if (tag) {
                    await ctx.db.patch(tagId, {
                        usageCount: tag.usageCount + 1
                    });
                }
            }
        }
    }
});
