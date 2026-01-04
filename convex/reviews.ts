import { v } from 'convex/values';
import { query, mutation } from './_generated/server';

// Entry type validator
const entryType = v.union(
    v.literal('game'),
    v.literal('hardware'),
    v.literal('place'),
    v.literal('software'),
    v.literal('service')
);

// Get reviews for an entry
export const getReviewsForEntry = query({
    args: {
        entryType: entryType,
        gameId: v.optional(v.id('games')),
        hardwareId: v.optional(v.id('hardware')),
        placeId: v.optional(v.id('places')),
        softwareId: v.optional(v.id('software')),
        serviceId: v.optional(v.id('services'))
    },
    handler: async (ctx, args) => {
        switch (args.entryType) {
            case 'game':
                if (!args.gameId) return [];
                return await ctx.db
                    .query('reviews')
                    .withIndex('by_game', (q) => q.eq('gameId', args.gameId))
                    .order('desc')
                    .collect();
            case 'hardware':
                if (!args.hardwareId) return [];
                return await ctx.db
                    .query('reviews')
                    .withIndex('by_hardware', (q) =>
                        q.eq('hardwareId', args.hardwareId)
                    )
                    .order('desc')
                    .collect();
            case 'place':
                if (!args.placeId) return [];
                return await ctx.db
                    .query('reviews')
                    .withIndex('by_place', (q) => q.eq('placeId', args.placeId))
                    .order('desc')
                    .collect();
            case 'software':
                if (!args.softwareId) return [];
                return await ctx.db
                    .query('reviews')
                    .withIndex('by_software', (q) =>
                        q.eq('softwareId', args.softwareId)
                    )
                    .order('desc')
                    .collect();
            case 'service':
                if (!args.serviceId) return [];
                return await ctx.db
                    .query('reviews')
                    .withIndex('by_service', (q) =>
                        q.eq('serviceId', args.serviceId)
                    )
                    .order('desc')
                    .collect();
        }
    }
});

// Add a review (requires authentication)
export const addReview = mutation({
    args: {
        entryType: entryType,
        gameId: v.optional(v.id('games')),
        hardwareId: v.optional(v.id('hardware')),
        placeId: v.optional(v.id('places')),
        softwareId: v.optional(v.id('software')),
        serviceId: v.optional(v.id('services')),
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
            entryType: args.entryType,
            gameId: args.gameId,
            hardwareId: args.hardwareId,
            placeId: args.placeId,
            softwareId: args.softwareId,
            serviceId: args.serviceId,
            rating: args.rating,
            comment: args.comment,
            accessibilityType: args.accessibilityType,
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
