import { v } from 'convex/values';
import { query } from './_generated/server';
import type { Doc, Id } from './_generated/dataModel';

// Entry type definition
export type Category = 'game' | 'hardware' | 'place' | 'software' | 'service';

// Union type for all entry types with category
export type GameEntry = Doc<'games'> & { category: 'game' };
export type HardwareEntry = Doc<'hardware'> & { category: 'hardware' };
export type PlaceEntry = Doc<'places'> & { category: 'place' };
export type SoftwareEntry = Doc<'software'> & { category: 'software' };
export type ServiceEntry = Doc<'services'> & { category: 'service' };

export type AnyEntry =
    | GameEntry
    | HardwareEntry
    | PlaceEntry
    | SoftwareEntry
    | ServiceEntry;

// Entry ID with type
export type EntryRef =
    | { type: 'game'; id: Id<'games'> }
    | { type: 'hardware'; id: Id<'hardware'> }
    | { type: 'place'; id: Id<'places'> }
    | { type: 'software'; id: Id<'software'> }
    | { type: 'service'; id: Id<'services'> };

// Get all entries with optional filtering by category
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
        const limit = args.limit ?? 50;

        // If a specific category is requested, only query that table
        if (args.category) {
            switch (args.category) {
                case 'game': {
                    const games = await ctx.db
                        .query('games')
                        .withIndex('by_created')
                        .order('desc')
                        .take(limit);
                    return games.map((g) => ({
                        ...g,
                        category: 'game' as const
                    }));
                }
                case 'hardware': {
                    const hardware = await ctx.db
                        .query('hardware')
                        .withIndex('by_created')
                        .order('desc')
                        .take(limit);
                    return hardware.map((h) => ({
                        ...h,
                        category: 'hardware' as const
                    }));
                }
                case 'place': {
                    const places = await ctx.db
                        .query('places')
                        .withIndex('by_created')
                        .order('desc')
                        .take(limit);
                    return places.map((p) => ({
                        ...p,
                        category: 'place' as const
                    }));
                }
                case 'software': {
                    const software = await ctx.db
                        .query('software')
                        .withIndex('by_created')
                        .order('desc')
                        .take(limit);
                    return software.map((s) => ({
                        ...s,
                        category: 'software' as const
                    }));
                }
                case 'service': {
                    const services = await ctx.db
                        .query('services')
                        .withIndex('by_created')
                        .order('desc')
                        .take(limit);
                    return services.map((s) => ({
                        ...s,
                        category: 'service' as const
                    }));
                }
            }
        }

        // Query all tables and combine results
        const [games, hardware, places, software, services] = await Promise.all(
            [
                ctx.db
                    .query('games')
                    .withIndex('by_created')
                    .order('desc')
                    .take(limit),
                ctx.db
                    .query('hardware')
                    .withIndex('by_created')
                    .order('desc')
                    .take(limit),
                ctx.db
                    .query('places')
                    .withIndex('by_created')
                    .order('desc')
                    .take(limit),
                ctx.db
                    .query('software')
                    .withIndex('by_created')
                    .order('desc')
                    .take(limit),
                ctx.db
                    .query('services')
                    .withIndex('by_created')
                    .order('desc')
                    .take(limit)
            ]
        );

        // Combine and sort by createdAt
        const allEntries: AnyEntry[] = [
            ...games.map((g) => ({ ...g, category: 'game' as const })),
            ...hardware.map((h) => ({ ...h, category: 'hardware' as const })),
            ...places.map((p) => ({ ...p, category: 'place' as const })),
            ...software.map((s) => ({ ...s, category: 'software' as const })),
            ...services.map((s) => ({ ...s, category: 'service' as const }))
        ];

        // Sort by createdAt descending and take the limit
        return allEntries
            .sort((a, b) => b.createdAt - a.createdAt)
            .slice(0, limit);
    },
});

// Search entries by name across all tables
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

        const searchTerm = args.searchQuery;

        // If a specific category is requested, only search that table
        if (args.category) {
            switch (args.category) {
                case 'game': {
                    const games = await ctx.db
                        .query('games')
                        .withSearchIndex('search_games', (q) =>
                            q.search('name', searchTerm)
                        )
                        .take(20);
                    return games.map((g) => ({
                        ...g,
                        category: 'game' as const
                    }));
                }
                case 'hardware': {
                    const hardware = await ctx.db
                        .query('hardware')
                        .withSearchIndex('search_hardware', (q) =>
                            q.search('name', searchTerm)
                        )
                        .take(20);
                    return hardware.map((h) => ({
                        ...h,
                        category: 'hardware' as const
                    }));
                }
                case 'place': {
                    const places = await ctx.db
                        .query('places')
                        .withSearchIndex('search_places', (q) =>
                            q.search('name', searchTerm)
                        )
                        .take(20);
                    return places.map((p) => ({
                        ...p,
                        category: 'place' as const
                    }));
                }
                case 'software': {
                    const software = await ctx.db
                        .query('software')
                        .withSearchIndex('search_software', (q) =>
                            q.search('name', searchTerm)
                        )
                        .take(20);
                    return software.map((s) => ({
                        ...s,
                        category: 'software' as const
                    }));
                }
                case 'service': {
                    const services = await ctx.db
                        .query('services')
                        .withSearchIndex('search_services', (q) =>
                            q.search('name', searchTerm)
                        )
                        .take(20);
                    return services.map((s) => ({
                        ...s,
                        category: 'service' as const
                    }));
                }
            }
        }

        // Search all tables in parallel
        const [games, hardware, places, software, services] = await Promise.all(
            [
                ctx.db
                    .query('games')
                    .withSearchIndex('search_games', (q) =>
                        q.search('name', searchTerm)
                    )
                    .take(20),
                ctx.db
                    .query('hardware')
                    .withSearchIndex('search_hardware', (q) =>
                        q.search('name', searchTerm)
                    )
                    .take(20),
                ctx.db
                    .query('places')
                    .withSearchIndex('search_places', (q) =>
                        q.search('name', searchTerm)
                    )
                    .take(20),
                ctx.db
                    .query('software')
                    .withSearchIndex('search_software', (q) =>
                        q.search('name', searchTerm)
                    )
                    .take(20),
                ctx.db
                    .query('services')
                    .withSearchIndex('search_services', (q) =>
                        q.search('name', searchTerm)
                    )
                    .take(20)
            ]
        );

        // Combine results
        const allResults: AnyEntry[] = [
            ...games.map((g) => ({ ...g, category: 'game' as const })),
            ...hardware.map((h) => ({ ...h, category: 'hardware' as const })),
            ...places.map((p) => ({ ...p, category: 'place' as const })),
            ...software.map((s) => ({ ...s, category: 'software' as const })),
            ...services.map((s) => ({ ...s, category: 'service' as const }))
        ];

        return allResults.slice(0, 20);
    }
});

// Get a single entry by ID (searches all tables)
export const getEntry = query({
    args: { id: v.string() },
    handler: async (ctx, args) => {
        const id = args.id;

        // Try each table
        const [game, hardware, place, software, service] = await Promise.all([
            ctx.db.get(id as Id<'games'>),
            ctx.db.get(id as Id<'hardware'>),
            ctx.db.get(id as Id<'places'>),
            ctx.db.get(id as Id<'software'>),
            ctx.db.get(id as Id<'services'>)
        ]);

        if (game) return { ...game, category: 'game' as const };
        if (hardware) return { ...hardware, category: 'hardware' as const };
        if (place) return { ...place, category: 'place' as const };
        if (software) return { ...software, category: 'software' as const };
        if (service) return { ...service, category: 'service' as const };

        return null;
    }
});

/**
 * Checks if an entry is complete based on its category and fields.
 * An entry is complete if all required fields are filled and it has at least one photo.
 */
export function isEntryComplete(entry: any, category: Category): boolean {
    const commonRequired = [
        entry.name,
        entry.description,
        entry.accessibilityFeatures,
        entry.overallRating,
        entry.visualAccessibility,
        entry.auditoryAccessibility,
        entry.motorAccessibility,
        entry.cognitiveAccessibility,
        entry.tags,
        entry.website
    ];

    const hasPhotos = entry.photos && entry.photos.length > 0;

    const checkFields = (fields: any[]) => {
        return fields.every((field) => {
            if (Array.isArray(field)) {
                return field.length > 0;
            }
            if (typeof field === 'number') {
                return field !== undefined && field !== null;
            }
            return field !== undefined && field !== null && field !== '';
        });
    };

    if (!checkFields(commonRequired) || !hasPhotos) {
        return false;
    }

    switch (category) {
        case 'game':
            return checkFields([entry.platforms]);
        case 'software':
            return checkFields([entry.platforms]);
        case 'hardware':
            return checkFields([
                entry.manufacturer,
                entry.model,
                entry.productType
            ]);
        case 'place':
            return checkFields([
                entry.location?.address,
                entry.location?.city,
                entry.placeType
            ]);
        case 'service':
            return checkFields([entry.serviceType, entry.provider]);
        default:
            return true;
    }
}

export const getNumberOfEntriesPerCategory = query({
    handler: async (ctx) => {
        const [games, hardware, places, software, services] = await Promise.all(
            [
                ctx.db.query('games').collect(),
                ctx.db.query('hardware').collect(),
                ctx.db.query('places').collect(),
                ctx.db.query('software').collect(),
                ctx.db.query('services').collect()
            ]
        );
        const gameCount = games.length;
        const hardwareCount = hardware.length;
        const placeCount = places.length;
        const softwareCount = software.length;
        const serviceCount = services.length;

        return {
            game: gameCount,
            hardware: hardwareCount,
            place: placeCount,
            software: softwareCount,
            service: serviceCount
        };
    }
});