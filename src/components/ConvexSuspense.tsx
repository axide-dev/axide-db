'use client';

import * as React from 'react';
import {
    Skeleton,
    SkeletonCounter,
    SkeletonEntriesGrid,
    SkeletonEntryDetail,
    SkeletonComments
} from '~/components/ui/skeleton';

type FallbackVariant =
    | 'default'
    | 'counter'
    | 'entries'
    | 'entry-detail'
    | 'comments'
    | 'custom';

interface ConvexSuspenseProps {
    children: React.ReactNode;
    variant?: FallbackVariant;
    fallback?: React.ReactNode;
    className?: string;
}

function DefaultFallback({ variant }: { variant: FallbackVariant }) {
    switch (variant) {
        case 'counter':
            return <SkeletonCounter />;
        case 'entries':
            return <SkeletonEntriesGrid count={6} />;
        case 'entry-detail':
            return <SkeletonEntryDetail />;
        case 'comments':
            return <SkeletonComments />;
        default:
            return (
                <div className="flex items-center justify-center py-16">
                    <div className="flex flex-col items-center gap-4">
                        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#2DE2E6] border-t-transparent" />
                        <span className="text-[#B9BBC7]">Loading...</span>
                    </div>
                </div>
            );
    }
}

/**
 * A wrapper component that provides consistent Suspense boundaries for Convex data.
 * Use this to wrap components that fetch data from Convex to enable streaming.
 *
 * @example
 * ```tsx
 * <ConvexSuspense variant="entries">
 *   <EntriesList />
 * </ConvexSuspense>
 * ```
 */
export function ConvexSuspense({
    children,
    variant = 'default',
    fallback,
    className
}: ConvexSuspenseProps) {
    const suspenseFallback = fallback ?? <DefaultFallback variant={variant} />;

    return (
        <React.Suspense fallback={suspenseFallback}>
            <div className={className}>{children}</div>
        </React.Suspense>
    );
}

/**
 * A hook-like component that renders loading state while data is undefined.
 * Use this inside client components when you need inline loading states.
 */
interface ConvexLoadingProps<T> {
    data: T | undefined;
    fallback?: React.ReactNode;
    children: (data: T) => React.ReactNode;
}

export function ConvexLoading<T>({
    data,
    fallback,
    children
}: ConvexLoadingProps<T>) {
    if (data === undefined) {
        return fallback ?? <Skeleton className="h-8 w-full" />;
    }
    return <>{children(data)}</>;
}
