import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import '~/styles/globals.css';
import ConvexClientProvider from '~/components/ConvexClientProvider';
import AuthHeader from '~/components/AuthHeader';

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
                    <head>
                        {/* Preload critical Latin font to reduce LCP latency (~156ms savings) */}
                        <link
                            rel="preload"
                            href="/fonts/UcC73FwrK3iLTeHuS_nVMrMxCp50SjIa1ZL7W0Q5nw.woff2"
                            as="font"
                            type="font/woff2"
                            crossOrigin="anonymous"
                        />
                        {/* DNS prefetch for Clerk to reduce connection time */}
                        <link
                            rel="dns-prefetch"
                            href="https://clerk.accounts.dev"
                        />
                        <link
                            rel="preconnect"
                            href="https://clerk.accounts.dev"
                            crossOrigin="anonymous"
                        />
                    </head>
                    <body className="bg-[#0B0B10] text-[#F5F6FA] antialiased">
                        <AuthHeader />
                        <div className="pt-16">{children}</div>
                    </body>
                </html>
            </ConvexClientProvider>
        </ClerkProvider>
    );
}
