'use client';

import * as React from 'react';
import { cn } from '~/lib/utils';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'text' | 'circular' | 'card';
}

export function Skeleton({
    className,
    variant = 'default',
    ...props
}: SkeletonProps) {
    const variantStyles = {
        default: '',
        text: 'h-4 w-full rounded',
        circular: 'rounded-full aspect-square',
        card: 'h-48 rounded-xl'
    };

    return (
        <div
            className={cn(
                'animate-pulse rounded-md bg-[#242433]',
                variantStyles[variant],
                className
            )}
            {...props}
        />
    );
}

export function SkeletonCard() {
    return (
        <div className="h-full rounded-xl border border-[#242433] bg-[#12121A] p-6">
            <div className="flex items-start justify-between gap-2 mb-4">
                <Skeleton className="h-6 w-2/3" />
                <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <Skeleton className="h-4 w-24 mb-4" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-4/5 mb-4" />
            <div className="flex gap-2">
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-6 w-16 rounded-full" />
            </div>
        </div>
    );
}

export function SkeletonCounter() {
    return (
        <div className="flex flex-col items-center gap-6 py-12">
            <div className="relative rounded-3xl border border-[#242433] bg-[#12121A]/80 px-12 py-8">
                <Skeleton className="h-32 w-48 sm:h-40 sm:w-64" />
            </div>
            <div className="flex items-center gap-3">
                <Skeleton className="h-px w-8" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-px w-8" />
            </div>
        </div>
    );
}

export function SkeletonEntriesGrid({ count = 6 }: { count?: number }) {
    return (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: count }).map((_, i) => (
                <SkeletonCard key={i} />
            ))}
        </div>
    );
}

export function SkeletonEntryDetail() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="rounded-xl border border-[#242433] bg-[#12121A] p-8">
                <div className="flex items-start justify-between gap-4 mb-6">
                    <div className="flex-1">
                        <Skeleton className="h-10 w-3/4 mb-4" />
                        <Skeleton className="h-6 w-32" />
                    </div>
                    <Skeleton className="h-8 w-24 rounded-full" />
                </div>
                <Skeleton className="h-20 w-full mb-6" />
                <div className="grid gap-4 sm:grid-cols-2">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                </div>
            </div>
            {/* Comments skeleton */}
            <div className="rounded-xl border border-[#242433] bg-[#12121A] p-6">
                <Skeleton className="h-6 w-32 mb-4" />
                <Skeleton className="h-24 w-full mb-4" />
                <div className="space-y-4">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                </div>
            </div>
        </div>
    );
}

export function SkeletonComments() {
    return (
        <div className="rounded-xl border border-[#242433] bg-[#12121A] p-6">
            <Skeleton className="h-6 w-32 mb-4" />
            <Skeleton className="h-24 w-full mb-4" />
            <div className="space-y-4">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
            </div>
        </div>
    );
}
