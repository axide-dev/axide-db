import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

// Shared accessibility fields used across all entry types
const accessibilityFields = {
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
    cognitiveAccessibility: v.optional(v.number())
};

// Shared base fields for all entries
const baseEntryFields = {
    name: v.string(),
    description: v.string(),
    photos: v.optional(v.array(v.id('_storage'))),
    tags: v.array(v.string()),
    website: v.optional(v.string()),
    createdBy: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
    complete: v.boolean(),
    ...accessibilityFields
};

// Entry type for polymorphic references
export const entryType = v.union(
    v.literal('game'),
    v.literal('hardware'),
    v.literal('place'),
    v.literal('software'),
    v.literal('service')
);

export default defineSchema({
    // Games table
    games: defineTable({
        ...baseEntryFields,
        // Game-specific fields
        platforms: v.array(v.string()),
        publisher: v.optional(v.string()),
        developer: v.optional(v.string()),
        releaseYear: v.optional(v.number()),
        genres: v.optional(v.array(v.string()))
    })
        .index('by_rating', ['overallRating'])
        .index('by_created', ['createdAt'])
        .searchIndex('search_games', {
            searchField: 'name'
        }),

    // Hardware table
    hardware: defineTable({
        ...baseEntryFields,
        // Hardware-specific fields
        manufacturer: v.optional(v.string()),
        model: v.optional(v.string()),
        productType: v.optional(v.string()), // e.g., 'controller', 'keyboard', 'mouse'
        compatibility: v.optional(v.array(v.string())) // e.g., ['PC', 'Xbox', 'PlayStation']
    })
        .index('by_rating', ['overallRating'])
        .index('by_created', ['createdAt'])
        .searchIndex('search_hardware', {
            searchField: 'name'
        }),

    // Places table
    places: defineTable({
        ...baseEntryFields,
        // Place-specific fields
        location: v.object({
            address: v.optional(v.string()),
            city: v.optional(v.string()),
            country: v.optional(v.string()),
            latitude: v.optional(v.number()),
            longitude: v.optional(v.number())
        }),
        placeType: v.optional(v.string()), // e.g., 'restaurant', 'museum', 'park'
        wheelchairAccessible: v.optional(v.boolean()),
        hasAccessibleParking: v.optional(v.boolean()),
        hasAccessibleRestroom: v.optional(v.boolean())
    })
        .index('by_rating', ['overallRating'])
        .index('by_created', ['createdAt'])
        .searchIndex('search_places', {
            searchField: 'name'
        }),

    // Software table
    software: defineTable({
        ...baseEntryFields,
        // Software-specific fields
        platforms: v.array(v.string()),
        developer: v.optional(v.string()),
        version: v.optional(v.string()),
        softwareType: v.optional(v.string()), // e.g., 'app', 'desktop', 'web'
        hasScreenReaderSupport: v.optional(v.boolean()),
        hasKeyboardNavigation: v.optional(v.boolean()),
        hasHighContrastMode: v.optional(v.boolean())
    })
        .index('by_rating', ['overallRating'])
        .index('by_created', ['createdAt'])
        .searchIndex('search_software', {
            searchField: 'name'
        }),

    // Services table
    services: defineTable({
        ...baseEntryFields,
        // Service-specific fields
        serviceType: v.optional(v.string()), // e.g., 'streaming', 'delivery', 'healthcare'
        provider: v.optional(v.string()),
        availability: v.optional(v.array(v.string())), // e.g., ['US', 'EU', 'Worldwide']
        hasAccessibleSupport: v.optional(v.boolean()),
        hasSignLanguageSupport: v.optional(v.boolean())
    })
        .index('by_rating', ['overallRating'])
        .index('by_created', ['createdAt'])
        .searchIndex('search_services', {
            searchField: 'name'
        }),

    // User reviews/ratings - now with polymorphic entry reference
    reviews: defineTable({
        entryType: entryType,
        gameId: v.optional(v.id('games')),
        hardwareId: v.optional(v.id('hardware')),
        placeId: v.optional(v.id('places')),
        softwareId: v.optional(v.id('software')),
        serviceId: v.optional(v.id('services')),
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
        .index('by_game', ['gameId'])
        .index('by_hardware', ['hardwareId'])
        .index('by_place', ['placeId'])
        .index('by_software', ['softwareId'])
        .index('by_service', ['serviceId'])
        .index('by_user', ['userId']),

    // Comments for entries - now with polymorphic entry reference
    comments: defineTable({
        entryType: entryType,
        gameId: v.optional(v.id('games')),
        hardwareId: v.optional(v.id('hardware')),
        placeId: v.optional(v.id('places')),
        softwareId: v.optional(v.id('software')),
        serviceId: v.optional(v.id('services')),
        userId: v.string(),
        userName: v.optional(v.string()),
        userImage: v.optional(v.string()),
        content: v.string(),
        photo: v.optional(v.id('_storage')),
        createdAt: v.number(),
        updatedAt: v.optional(v.number())
    })
        .index('by_game', ['gameId'])
        .index('by_hardware', ['hardwareId'])
        .index('by_place', ['placeId'])
        .index('by_software', ['softwareId'])
        .index('by_service', ['serviceId'])
        .index('by_user', ['userId'])
        .index('by_created', ['createdAt']),

    uploadedFiles: defineTable({
        storageId: v.id('_storage'),
        userId: v.string(),
        fileName: v.string(),
        fileType: v.string(),
        fileSize: v.number(),
        associatedEntryType: v.optional(entryType),
        associatedEntryId: v.optional(v.string()),
        createdAt: v.number()
    })
        .index('by_user', ['userId'])
        .index('by_storage_id', ['storageId'])
        .index('by_entry', ['associatedEntryType', 'associatedEntryId'])
});
