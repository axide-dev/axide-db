import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

// Accessibility type categories
export const accessibilityType = v.union(
    v.literal('visual'),
    v.literal('auditory'),
    v.literal('motor'),
    v.literal('cognitive'),
    v.literal('general')
);

// Entry type for polymorphic references
export const entryType = v.union(
    v.literal('game'),
    v.literal('hardware'),
    v.literal('place'),
    v.literal('software'),
    v.literal('service')
);

// Shared accessibility fields used across all entry types
// Now uses references to the normalized tags and features tables
const accessibilityFields = {
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
    website: v.optional(v.string()),
    createdBy: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
    complete: v.boolean(),
    ...accessibilityFields
};

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
        .index('by_entry', ['associatedEntryType', 'associatedEntryId']),

    // ============================================
    // NORMALIZED TAGS AND FEATURES TABLES
    // ============================================

    // Tags table - reusable tags tied to accessibility types
    tags: defineTable({
        name: v.string(),
        slug: v.string(), // URL-friendly version of the name
        description: v.optional(v.string()),
        accessibilityType: accessibilityType, // visual, auditory, motor, cognitive, general
        createdAt: v.number(),
        usageCount: v.number() // Track how many entries use this tag
    })
        .index('by_slug', ['slug'])
        .index('by_accessibility_type', ['accessibilityType'])
        .index('by_usage_count', ['usageCount'])
        .searchIndex('search_tags', {
            searchField: 'name',
            filterFields: ['accessibilityType']
        }),

    // Accessibility Features table - reusable features tied to accessibility types
    accessibilityFeatures: defineTable({
        name: v.string(),
        slug: v.string(), // URL-friendly version of the name
        description: v.optional(v.string()),
        accessibilityType: accessibilityType, // visual, auditory, motor, cognitive, general
        createdAt: v.number(),
        usageCount: v.number() // Track how many entries use this feature
    })
        .index('by_slug', ['slug'])
        .index('by_accessibility_type', ['accessibilityType'])
        .index('by_usage_count', ['usageCount'])
        .searchIndex('search_features', {
            searchField: 'name',
            filterFields: ['accessibilityType']
        }),

    // Junction table: Entry <-> Tag (many-to-many)
    entryTags: defineTable({
        // Polymorphic entry reference
        entryType: entryType,
        gameId: v.optional(v.id('games')),
        hardwareId: v.optional(v.id('hardware')),
        placeId: v.optional(v.id('places')),
        softwareId: v.optional(v.id('software')),
        serviceId: v.optional(v.id('services')),
        // Tag reference
        tagId: v.id('tags'),
        createdAt: v.number()
    })
        .index('by_tag', ['tagId'])
        .index('by_game', ['gameId'])
        .index('by_hardware', ['hardwareId'])
        .index('by_place', ['placeId'])
        .index('by_software', ['softwareId'])
        .index('by_service', ['serviceId'])
        .index('by_game_tag', ['gameId', 'tagId'])
        .index('by_hardware_tag', ['hardwareId', 'tagId'])
        .index('by_place_tag', ['placeId', 'tagId'])
        .index('by_software_tag', ['softwareId', 'tagId'])
        .index('by_service_tag', ['serviceId', 'tagId']),

    // Junction table: Entry <-> Accessibility Feature (many-to-many with rating)
    entryFeatures: defineTable({
        // Polymorphic entry reference
        entryType: entryType,
        gameId: v.optional(v.id('games')),
        hardwareId: v.optional(v.id('hardware')),
        placeId: v.optional(v.id('places')),
        softwareId: v.optional(v.id('software')),
        serviceId: v.optional(v.id('services')),
        // Feature reference
        featureId: v.id('accessibilityFeatures'),
        // Entry-specific rating for this feature (1-5)
        rating: v.number(),
        // Optional entry-specific notes about this feature
        notes: v.optional(v.string()),
        createdAt: v.number()
    })
        .index('by_feature', ['featureId'])
        .index('by_game', ['gameId'])
        .index('by_hardware', ['hardwareId'])
        .index('by_place', ['placeId'])
        .index('by_software', ['softwareId'])
        .index('by_service', ['serviceId'])
        .index('by_game_feature', ['gameId', 'featureId'])
        .index('by_hardware_feature', ['hardwareId', 'featureId'])
        .index('by_place_feature', ['placeId', 'featureId'])
        .index('by_software_feature', ['softwareId', 'featureId'])
        .index('by_service_feature', ['serviceId', 'featureId'])
});
