import { v } from 'convex/values';
import { query, mutation } from './_generated/server';

// Get reviews for an entry
export const getReviewsForEntry = query({
    args: { entryId: v.id('accessibilityEntries') },
    handler: async (ctx, args) => {
        return await ctx.db
            .query('reviews')
            .withIndex('by_entry', (q) => q.eq('entryId', args.entryId))
            .order('desc')
            .collect();
    }
});

// Add a review (requires authentication)
export const addReview = mutation({
    args: {
        entryId: v.id('accessibilityEntries'),
        rating: v.number(),
        comment: v.string(),
        accessibilityType: v.optional(
            v.union(
                v.literal('visual'),
                v.literal('auditory'),
                v.literal('motor'),
                v.literal('cognitive'),
                v.literal('general')
            )
        )
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error('You must be logged in to add a review');
        }

        return await ctx.db.insert('reviews', {
            ...args,
            userId: identity.subject,
            createdAt: Date.now()
        });
    }
});

// Delete a review (requires authentication - only owner can delete)
export const deleteReview = mutation({
    args: { id: v.id('reviews') },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error('You must be logged in to delete a review');
        }

        const review = await ctx.db.get(args.id);
        if (!review) {
            throw new Error('Review not found');
        }

        if (review.userId !== identity.subject) {
            throw new Error('You can only delete your own reviews');
        }

        await ctx.db.delete(args.id);
    }
});
