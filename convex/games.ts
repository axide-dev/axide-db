import { v } from 'convex/values';
import { query, mutation } from './_generated/server';
import { isEntryComplete } from './entries';

// Get all games
export const getGames = query({
    args: {
        limit: v.optional(v.number())
    },
    handler: async (ctx, args) => {
        const games = await ctx.db
            .query('games')
            .withIndex('by_created')
            .order('desc')
            .take(args.limit ?? 50);
        return games.map((game) => ({ ...game, category: 'game' as const }));
    }
});

// Search games by name
export const searchGames = query({
    args: {
        searchQuery: v.string()
    },
    handler: async (ctx, args) => {
        if (!args.searchQuery.trim()) {
            return [];
        }

        const games = await ctx.db
            .query('games')
            .withSearchIndex('search_games', (q) =>
                q.search('name', args.searchQuery)
            )
            .take(20);

        return games.map((game) => ({ ...game, category: 'game' as const }));
    }
});

// Get a single game by ID
export const getGame = query({
    args: { id: v.id('games') },
    handler: async (ctx, args) => {
        const game = await ctx.db.get(args.id);
        return game ? { ...game, category: 'game' as const } : null;
    }
});

// Create a new game
// Note: Tags and accessibility features are now managed through separate junction tables
// Use tags.addTagToEntry and features.addFeatureToEntry after creating the game
export const createGame = mutation({
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
        // Game-specific fields
        platforms: v.array(v.string()),
        publisher: v.optional(v.string()),
        developer: v.optional(v.string()),
        releaseYear: v.optional(v.number()),
        genres: v.optional(v.array(v.string())),
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
        const newGame = {
            ...rest,
            photos: photos ?? [],
            createdBy: identity.subject,
            createdAt: now,
            updatedAt: now
        };

        return await ctx.db.insert('games', {
            ...newGame,
            complete: isEntryComplete(newGame, 'game')
        });
    }
});

// Update a game
// Note: Tags and accessibility features are now managed through separate junction tables
// Use tags.setTagsForEntry and features.setFeaturesForEntry to update them
export const updateGame = mutation({
    args: {
        id: v.id('games'),
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
        publisher: v.optional(v.string()),
        developer: v.optional(v.string()),
        releaseYear: v.optional(v.number()),
        genres: v.optional(v.array(v.string())),
        // Legacy fields for backward compatibility
        accessibilityFeatures: v.optional(v.array(v.any())),
        tags: v.optional(v.array(v.string()))
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error('You must be logged in to update an entry');
        }

        const { id, accessibilityFeatures, tags, ...updates } = args;
        const existing = await ctx.db.get(id);
        if (!existing) {
            throw new Error('Game not found');
        }

        if (existing.createdBy && existing.createdBy !== identity.subject) {
            throw new Error('You can only edit entries you created');
        }

        const updatedEntry = { ...existing, ...updates };

        return await ctx.db.patch(id, {
            ...updates,
            complete: isEntryComplete(updatedEntry, 'game'),
            updatedAt: Date.now()
        });
    }
});

// Delete a game
export const deleteGame = mutation({
    args: { id: v.id('games') },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error('You must be logged in to delete an entry');
        }

        const game = await ctx.db.get(args.id);
        if (!game) {
            throw new Error('Game not found');
        }

        if (game.createdBy && game.createdBy !== identity.subject) {
            throw new Error('You can only delete entries you created');
        }

        await ctx.db.delete(args.id);
    }
});
