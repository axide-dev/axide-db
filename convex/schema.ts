import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
    // Main accessibility entries table
    accessibilityEntries: defineTable({
        // Basic info
        name: v.string(),
        description: v.string(),
        category: v.union(
            v.literal('game'),
            v.literal('hardware'),
            v.literal('place'),
            v.literal('software'),
            v.literal('service')
        ),

        // Photos stored as Convex storage IDs
        photos: v.optional(v.array(v.id('_storage'))),

        // Accessibility features
        accessibilityFeatures: v.array(
            v.object({
                feature: v.string(),
                description: v.optional(v.string()),
                rating: v.number() // 1-5 rating
            })
        ),

        // Overall accessibility rating (1-5)
        overallRating: v.number(),

        // Specific accessibility categories
        visualAccessibility: v.optional(v.number()),
        auditoryAccessibility: v.optional(v.number()),
        motorAccessibility: v.optional(v.number()),
        cognitiveAccessibility: v.optional(v.number()),

        // Additional metadata
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

        // For games/software
        platforms: v.optional(v.array(v.string())),

        // User who created this entry
        createdBy: v.optional(v.string()),
        createdAt: v.number(),
        updatedAt: v.number()
    })
        .index('by_category', ['category'])
        .index('by_rating', ['overallRating'])
        .index('by_created', ['createdAt'])
        .searchIndex('search_entries', {
            searchField: 'name',
            filterFields: ['category']
        }),

    // User reviews/ratings
    reviews: defineTable({
        entryId: v.id('accessibilityEntries'),
        userId: v.string(),
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
        ),
        createdAt: v.number()
    })
        .index('by_entry', ['entryId'])
        .index('by_user', ['userId']),

    // Comments for entries (especially places)
    comments: defineTable({
        entryId: v.id('accessibilityEntries'),
        userId: v.string(),
        userName: v.optional(v.string()),
        userImage: v.optional(v.string()),
        content: v.string(),
        // Optional photo attachment
        photo: v.optional(v.id('_storage')),
        createdAt: v.number(),
        updatedAt: v.optional(v.number())
    })
        .index('by_entry', ['entryId'])
        .index('by_user', ['userId'])
        .index('by_created', ['createdAt'])
});
