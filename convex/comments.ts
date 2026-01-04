import { v } from 'convex/values';
import { query, mutation } from './_generated/server';

// Get comments for an entry
export const getCommentsForEntry = query({
    args: { entryId: v.id('accessibilityEntries') },
    handler: async (ctx, args) => {
        return await ctx.db
            .query('comments')
            .withIndex('by_entry', (q) => q.eq('entryId', args.entryId))
            .order('desc')
            .collect();
    }
});

// Get comment count for an entry
export const getCommentCount = query({
    args: { entryId: v.id('accessibilityEntries') },
    handler: async (ctx, args) => {
        const comments = await ctx.db
            .query('comments')
            .withIndex('by_entry', (q) => q.eq('entryId', args.entryId))
            .collect();
        return comments.length;
    }
});

// Add a comment (requires authentication)
export const addComment = mutation({
    args: {
        entryId: v.id('accessibilityEntries'),
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
            entryId: args.entryId,
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
