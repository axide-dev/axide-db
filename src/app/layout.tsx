import type { Metadata } from 'next';
import {
    ClerkProvider,
    SignInButton,
    SignUpButton,
    SignedIn,
    SignedOut,
    UserButton
} from '@clerk/nextjs';
import { Space_Grotesk, Inter, JetBrains_Mono } from 'next/font/google';
import '~/styles/globals.css';
import ConvexClientProvider from '~/components/ConvexClientProvider';

const spaceGrotesk = Space_Grotesk({
    variable: '--font-heading',
    subsets: ['latin'],
    weight: ['300', '400', '500', '600', '700']
});

const inter = Inter({
    variable: '--font-sans',
    subsets: ['latin'],
    weight: ['300', '400', '500', '600', '700']
});

const jetbrainsMono = JetBrains_Mono({
    variable: '--font-mono',
    subsets: ['latin'],
    weight: ['400', '500']
});

export const metadata: Metadata = {
    title: 'Axide - Accessibility Database',
    description:
        'A comprehensive database for accessibility information about games, hardware, places, software, and services.'
};

export default function RootLayout({
    children
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <ClerkProvider>
            <ConvexClientProvider>
                <html lang="en" className="dark">
                    <body
                        className={`${spaceGrotesk.variable} ${inter.variable} ${jetbrainsMono.variable} bg-[#0B0B10] text-[#F5F6FA] antialiased`}
                    >
                        <header className="fixed top-0 left-0 right-0 z-50 flex h-16 items-center justify-between border-b border-[#242433]/50 bg-[#0B0B10]/80 px-6 backdrop-blur-md">
                            {/* Logo placeholder */}
                            <div className="flex items-center gap-2">
                                <span className="font-heading text-xl font-bold text-[#2DE2E6]">
                                    Axide DB
                                </span>
                            </div>

                            {/* Auth buttons */}
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
                        </header>
                        <div className="pt-16">{children}</div>
                    </body>
                </html>
            </ConvexClientProvider>
        </ClerkProvider>
    );
}
