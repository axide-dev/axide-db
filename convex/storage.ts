import { query, mutation } from './_generated/server';
import { v } from 'convex/values';

export const getFileUrl = query({
    args: {
        storageId: v.id('_storage')
    },
    handler: async (ctx, args) => {
        return await ctx.storage.getUrl(args.storageId);
    }
});

export const getFileUrls = query({
    args: {
        storageIds: v.array(v.id('_storage'))
    },
    handler: async (ctx, args) => {
        const urls: Record<string, string | null> = {};
        for (const storageId of args.storageIds) {
            urls[storageId] = await ctx.storage.getUrl(storageId);
        }
        return urls;
    }
});

export const generateUploadUrl = mutation({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error('You must be logged in to upload files');
        }
        return await ctx.storage.generateUploadUrl();
    }
});

export const deleteFile = mutation({
    args: {
        storageId: v.id('_storage')
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error('You must be logged in to delete files');
        }
        await ctx.storage.delete(args.storageId);
    }
});

export const registerFile = mutation({
    args: {
        storageId: v.id('_storage'),
        fileName: v.string(),
        fileType: v.string(),
        fileSize: v.number(),
        associatedEntryType: v.optional(
            v.union(
                v.literal('game'),
                v.literal('hardware'),
                v.literal('place'),
                v.literal('software'),
                v.literal('service')
            )
        ),
        associatedEntryId: v.optional(v.string())
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error('You must be logged in to upload files');
        }

        return await ctx.db.insert('uploadedFiles', {
            ...args,
            userId: identity.subject,
            createdAt: Date.now()
        });
    }
});
