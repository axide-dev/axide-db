import { v } from 'convex/values';
import { query, mutation } from './_generated/server';
import type { Id } from './_generated/dataModel';

// Entry type validator
const entryType = v.union(
    v.literal('game'),
    v.literal('hardware'),
    v.literal('place'),
    v.literal('software'),
    v.literal('service')
);

// Get comments for an entry
export const getCommentsForEntry = query({
    args: {
        entryType: entryType,
        gameId: v.optional(v.string()), // Use string to avoid table validation
        hardwareId: v.optional(v.string()),
        placeId: v.optional(v.string()),
        softwareId: v.optional(v.string()),
        serviceId: v.optional(v.string())
    },
    handler: async (ctx, args) => {
        switch (args.entryType) {
            case 'game':
                if (!args.gameId) return [];
                return await ctx.db
                    .query('comments')
                    .withIndex('by_game', (q) =>
                        q.eq('gameId', args.gameId as Id<'games'>)
                    )
                    .order('desc')
                    .collect();
            case 'hardware':
                if (!args.hardwareId) return [];
                return await ctx.db
                    .query('comments')
                    .withIndex('by_hardware', (q) =>
                        q.eq('hardwareId', args.hardwareId as Id<'hardware'>)
                    )
                    .order('desc')
                    .collect();
            case 'place':
                if (!args.placeId) return [];
                return await ctx.db
                    .query('comments')
                    .withIndex('by_place', (q) =>
                        q.eq('placeId', args.placeId as Id<'places'>)
                    )
                    .order('desc')
                    .collect();
            case 'software':
                if (!args.softwareId) return [];
                return await ctx.db
                    .query('comments')
                    .withIndex('by_software', (q) =>
                        q.eq('softwareId', args.softwareId as Id<'software'>)
                    )
                    .order('desc')
                    .collect();
            case 'service':
                if (!args.serviceId) return [];
                return await ctx.db
                    .query('comments')
                    .withIndex('by_service', (q) =>
                        q.eq('serviceId', args.serviceId as Id<'services'>)
                    )
                    .order('desc')
                    .collect();
        }
    }
});

// Get comment count for an entry
export const getCommentCount = query({
    args: {
        entryType: entryType,
        gameId: v.optional(v.string()),
        hardwareId: v.optional(v.string()),
        placeId: v.optional(v.string()),
        softwareId: v.optional(v.string()),
        serviceId: v.optional(v.string())
    },
    handler: async (ctx, args) => {
        let comments: unknown[] = [];
        switch (args.entryType) {
            case 'game':
                if (!args.gameId) return 0;
                comments = await ctx.db
                    .query('comments')
                    .withIndex('by_game', (q) =>
                        q.eq('gameId', args.gameId as Id<'games'>)
                    )
                    .collect();
                break;
            case 'hardware':
                if (!args.hardwareId) return 0;
                comments = await ctx.db
                    .query('comments')
                    .withIndex('by_hardware', (q) =>
                        q.eq('hardwareId', args.hardwareId as Id<'hardware'>)
                    )
                    .collect();
                break;
            case 'place':
                if (!args.placeId) return 0;
                comments = await ctx.db
                    .query('comments')
                    .withIndex('by_place', (q) =>
                        q.eq('placeId', args.placeId as Id<'places'>)
                    )
                    .collect();
                break;
            case 'software':
                if (!args.softwareId) return 0;
                comments = await ctx.db
                    .query('comments')
                    .withIndex('by_software', (q) =>
                        q.eq('softwareId', args.softwareId as Id<'software'>)
                    )
                    .collect();
                break;
            case 'service':
                if (!args.serviceId) return 0;
                comments = await ctx.db
                    .query('comments')
                    .withIndex('by_service', (q) =>
                        q.eq('serviceId', args.serviceId as Id<'services'>)
                    )
                    .collect();
                break;
        }
        return comments.length;
    }
});

// Add a comment (requires authentication)
export const addComment = mutation({
    args: {
        entryType: entryType,
        gameId: v.optional(v.string()),
        hardwareId: v.optional(v.string()),
        placeId: v.optional(v.string()),
        softwareId: v.optional(v.string()),
        serviceId: v.optional(v.string()),
        content: v.string()
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error('You must be logged in to add a comment');
        }

        // Validate content is not empty
        if (!args.content.trim()) {
            throw new Error('Comment cannot be empty');
        }

        return await ctx.db.insert('comments', {
            entryType: args.entryType,
            gameId: args.gameId as Id<'games'> | undefined,
            hardwareId: args.hardwareId as Id<'hardware'> | undefined,
            placeId: args.placeId as Id<'places'> | undefined,
            softwareId: args.softwareId as Id<'software'> | undefined,
            serviceId: args.serviceId as Id<'services'> | undefined,
            userId: identity.subject,
            userName: identity.name ?? undefined,
            userImage: identity.pictureUrl ?? undefined,
            content: args.content.trim(),
            createdAt: Date.now()
        });
    }
});

// Update a comment (requires authentication - only owner can update)
export const updateComment = mutation({
    args: {
        id: v.id('comments'),
        content: v.string()
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error('You must be logged in to update a comment');
        }

        const comment = await ctx.db.get(args.id);
        if (!comment) {
            throw new Error('Comment not found');
        }

        if (comment.userId !== identity.subject) {
            throw new Error('You can only edit your own comments');
        }

        if (!args.content.trim()) {
            throw new Error('Comment cannot be empty');
        }

        return await ctx.db.patch(args.id, {
            content: args.content.trim(),
            updatedAt: Date.now()
        });
    }
});

// Delete a comment (requires authentication - only owner can delete)
export const deleteComment = mutation({
    args: { id: v.id('comments') },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error('You must be logged in to delete a comment');
        }

        const comment = await ctx.db.get(args.id);
        if (!comment) {
            throw new Error('Comment not found');
        }

        if (comment.userId !== identity.subject) {
            throw new Error('You can only delete your own comments');
        }

        await ctx.db.delete(args.id);
    }
});
