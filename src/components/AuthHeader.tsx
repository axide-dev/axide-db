'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// Dynamically import Clerk components to reduce initial bundle size (~184 KiB savings)
const SignInButton = dynamic(
    () => import('@clerk/nextjs').then((mod) => mod.SignInButton),
    { ssr: false }
);

const SignUpButton = dynamic(
    () => import('@clerk/nextjs').then((mod) => mod.SignUpButton),
    { ssr: false }
);

const SignedIn = dynamic(
    () => import('@clerk/nextjs').then((mod) => mod.SignedIn),
    { ssr: false }
);

const SignedOut = dynamic(
    () => import('@clerk/nextjs').then((mod) => mod.SignedOut),
    { ssr: false }
);

const UserButton = dynamic(
    () => import('@clerk/nextjs').then((mod) => mod.UserButton),
    { ssr: false }
);

function AuthButtonsSkeleton() {
    return (
        <div className="flex items-center gap-4">
            <div className="h-9 w-20 animate-pulse rounded-full bg-[#242433]" />
            <div className="h-9 w-20 animate-pulse rounded-full bg-[#242433]" />
        </div>
    );
}

export default function AuthHeader() {
    return (
        <header className="fixed top-0 left-0 right-0 z-50 flex h-16 items-center justify-between border-b border-[#242433]/50 bg-[#0B0B10]/80 px-6 backdrop-blur-md">
            {/* Logo placeholder */}
            <div className="flex items-center gap-2">
                <span className="font-heading text-xl font-bold text-[#2DE2E6]">
                    Axide DB
                </span>
            </div>

            {/* Auth buttons - deferred loading */}
            <Suspense fallback={<AuthButtonsSkeleton />}>
                <div className="flex items-center gap-4">
                    <SignedOut>
                        <SignInButton>
                            <button className="rounded-full border border-[#242433] bg-transparent px-4 py-2 text-sm font-medium text-[#F5F6FA] transition-all hover:border-[#2DE2E6]/50 hover:bg-[#2DE2E6]/5">
                                Sign In
                            </button>
                        </SignInButton>
                        <SignUpButton>
                            <button className="rounded-full bg-[#2DE2E6] px-5 py-2 text-sm font-medium text-[#0B0B10] transition-all hover:bg-[#2DE2E6]/90 hover:shadow-[0_0_20px_rgba(45,226,230,0.3)]">
                                Sign Up
                            </button>
                        </SignUpButton>
                    </SignedOut>
                    <SignedIn>
                        <UserButton
                            appearance={{
                                elements: {
                                    avatarBox:
                                        'w-9 h-9 ring-2 ring-[#242433] hover:ring-[#2DE2E6]/50 transition-all'
                                }
                            }}
                        />
                    </SignedIn>
                </div>
            </Suspense>
        </header>
    );
}
