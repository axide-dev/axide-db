'use client';

import * as React from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';

function AnimatedDigit({
    digit,
    prevDigit
}: {
    digit: string;
    prevDigit: string | null;
}) {
    const isIncreasing = prevDigit !== null && digit > prevDigit;
    const isDecreasing = prevDigit !== null && digit < prevDigit;
    const shouldAnimate = prevDigit !== null && digit !== prevDigit;

    return (
        <span className="relative inline-flex h-[1em] w-[0.65em] items-center justify-center overflow-hidden">
            {/* Exiting digit */}
            {shouldAnimate && (
                <span
                    key={`exit-${prevDigit}`}
                    className={`absolute inset-0 flex items-center justify-center ${
                        isIncreasing
                            ? 'animate-digit-exit-up'
                            : 'animate-digit-exit-down'
                    }`}
                >
                    {prevDigit}
                </span>
            )}
            {/* Current digit */}
            <span
                key={`current-${digit}`}
                className={`flex items-center justify-center ${
                    shouldAnimate
                        ? isIncreasing
                            ? 'animate-digit-up'
                            : 'animate-digit-down'
                        : ''
                }`}
            >
                {digit}
            </span>
        </span>
    );
}

function AnimatedNumber({ value }: { value: number }) {
    const [prevValue, setPrevValue] = React.useState<number | null>(null);
    const digits = value.toString().split('');
    const prevDigits = prevValue?.toString().split('') ?? null;

    React.useEffect(() => {
        if (prevValue !== value) {
            const timer = setTimeout(() => {
                setPrevValue(value);
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [value, prevValue]);

    // Pad to match lengths
    const maxLength = Math.max(
        digits.length,
        prevDigits?.length ?? digits.length
    );
    const paddedDigits = digits.join('').padStart(maxLength, '0').split('');
    const paddedPrevDigits = prevDigits
        ? prevDigits.join('').padStart(maxLength, '0').split('')
        : null;

    return (
        <span className="inline-flex">
            {paddedDigits.map((digit, index) => (
                <AnimatedDigit
                    key={index}
                    digit={digit}
                    prevDigit={
                        paddedPrevDigits && paddedPrevDigits[index] !== digit
                            ? paddedPrevDigits[index]
                            : null
                    }
                />
            ))}
        </span>
    );
}

export function TotalEntriesCounter() {
    const totalEntries = useQuery(api.entries.getTotalEntries);

    if (totalEntries === undefined) {
        return (
            <div className="flex flex-col items-center gap-4 py-8">
                <div className="h-32 w-48 animate-pulse rounded-2xl bg-[#242433]" />
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center gap-6 py-12">
            {/* Big Counter */}
            <div className="group relative">
                {/* Glow effect behind */}
                <div className="absolute inset-0 rounded-3xl bg-[#2DE2E6]/10 blur-3xl transition-all duration-500 group-hover:bg-[#2DE2E6]/20" />

                {/* Counter container */}
                <div className="relative rounded-3xl border border-[#242433] bg-[#12121A]/80 px-12 py-8 backdrop-blur-sm transition-all duration-300 hover:border-[#2DE2E6]/30 hover:shadow-[0_0_40px_rgba(45,226,230,0.15)]">
                    {/* Number */}
                    <div className="font-heading text-8xl font-bold tracking-tight text-[#2DE2E6] text-glow-cyan sm:text-9xl lg:text-[12rem]">
                        <AnimatedNumber value={totalEntries} />
                    </div>
                </div>
            </div>

            {/* Label */}
            <div className="flex items-center gap-3 text-lg text-[#B9BBC7]">
                <span className="h-px w-8 bg-gradient-to-r from-transparent to-[#2DE2E6]/50" />
                <span className="font-heading font-medium tracking-wide uppercase">
                    {totalEntries === 1 ? 'Entry' : 'Entries'} in Database
                </span>
                <span className="h-px w-8 bg-gradient-to-l from-transparent to-[#2DE2E6]/50" />
            </div>

            {/* Live indicator */}
            <div className="flex items-center gap-2 text-sm text-[#B9BBC7]/60">
                <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#5EF0B6] opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-[#5EF0B6]" />
                </span>
                <span>Live updates</span>
            </div>
        </div>
    );
}
