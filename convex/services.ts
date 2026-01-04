import { v } from 'convex/values';
import { query, mutation } from './_generated/server';
import { isEntryComplete } from './entries';

// Get all services
export const getServices = query({
    args: {
        limit: v.optional(v.number())
    },
    handler: async (ctx, args) => {
        const services = await ctx.db
            .query('services')
            .withIndex('by_created')
            .order('desc')
            .take(args.limit ?? 50);
        return services.map((svc) => ({
            ...svc,
            category: 'service' as const
        }));
    }
});

// Search services by name
export const searchServices = query({
    args: {
        searchQuery: v.string()
    },
    handler: async (ctx, args) => {
        if (!args.searchQuery.trim()) {
            return [];
        }

        const services = await ctx.db
            .query('services')
            .withSearchIndex('search_services', (q) =>
                q.search('name', args.searchQuery)
            )
            .take(20);

        return services.map((svc) => ({
            ...svc,
            category: 'service' as const
        }));
    }
});

// Get a single service by ID
export const getService = query({
    args: { id: v.id('services') },
    handler: async (ctx, args) => {
        const service = await ctx.db.get(args.id);
        return service ? { ...service, category: 'service' as const } : null;
    }
});

// Create a new service
export const createService = mutation({
    args: {
        name: v.string(),
        description: v.string(),
        accessibilityFeatures: v.array(
            v.object({
                feature: v.string(),
                description: v.optional(v.string()),
                rating: v.number()
            })
        ),
        overallRating: v.number(),
        visualAccessibility: v.optional(v.number()),
        auditoryAccessibility: v.optional(v.number()),
        motorAccessibility: v.optional(v.number()),
        cognitiveAccessibility: v.optional(v.number()),
        tags: v.array(v.string()),
        website: v.optional(v.string()),
        // Service-specific fields
        serviceType: v.optional(v.string()),
        provider: v.optional(v.string()),
        availability: v.optional(v.array(v.string())),
        hasAccessibleSupport: v.optional(v.boolean()),
        hasSignLanguageSupport: v.optional(v.boolean())
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error('You must be logged in to create an entry');
        }

        const now = Date.now();
        const newService = {
            ...args,
            photos: [],
            createdBy: identity.subject,
            createdAt: now,
            updatedAt: now
        };

        return await ctx.db.insert('services', {
            ...newService,
            complete: isEntryComplete(newService, 'service')
        });
    }
});

// Update a service
export const updateService = mutation({
    args: {
        id: v.id('services'),
        name: v.optional(v.string()),
        description: v.optional(v.string()),
        accessibilityFeatures: v.optional(
            v.array(
                v.object({
                    feature: v.string(),
                    description: v.optional(v.string()),
                    rating: v.number()
                })
            )
        ),
        overallRating: v.optional(v.number()),
        visualAccessibility: v.optional(v.number()),
        auditoryAccessibility: v.optional(v.number()),
        motorAccessibility: v.optional(v.number()),
        cognitiveAccessibility: v.optional(v.number()),
        tags: v.optional(v.array(v.string())),
        website: v.optional(v.string()),
        serviceType: v.optional(v.string()),
        provider: v.optional(v.string()),
        availability: v.optional(v.array(v.string())),
        hasAccessibleSupport: v.optional(v.boolean()),
        hasSignLanguageSupport: v.optional(v.boolean())
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error('You must be logged in to update an entry');
        }

        const { id, ...updates } = args;
        const existing = await ctx.db.get(id);
        if (!existing) {
            throw new Error('Service not found');
        }

        if (existing.createdBy && existing.createdBy !== identity.subject) {
            throw new Error('You can only edit entries you created');
        }

        const updatedEntry = { ...existing, ...updates };

        return await ctx.db.patch(id, {
            ...updates,
            complete: isEntryComplete(updatedEntry, 'service'),
            updatedAt: Date.now()
        });
    }
});

// Delete a service
export const deleteService = mutation({
    args: { id: v.id('services') },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error('You must be logged in to delete an entry');
        }

        const service = await ctx.db.get(args.id);
        if (!service) {
            throw new Error('Service not found');
        }

        if (service.createdBy && service.createdBy !== identity.subject) {
            throw new Error('You can only delete entries you created');
        }

        await ctx.db.delete(args.id);
    }
});
