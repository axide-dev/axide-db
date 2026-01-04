'use client';

import * as React from 'react';
import { AccessibilitySearch } from '~/components/AccessibilitySearch';
import { AddEntryForm } from '~/components/AddEntryForm';
import { Button } from '~/components/ui/button';

export default function Page() {
    const [showAddForm, setShowAddForm] = React.useState(false);

    return (
        <main className="flex min-h-screen flex-col items-center px-4 py-8">
            {/* Header with Red Link */}
            <header className="mb-8 flex flex-col items-center gap-4 text-center">
                <a
                    href="/"
                    className="text-4xl font-bold text-red-500 transition-colors hover:text-red-400 sm:text-5xl"
                >
                    Axide Accessibility Database
                </a>
                <p className="text-muted-foreground max-w-2xl text-lg">
                    A comprehensive database for accessibility information about
                    games, hardware, places, software, and services. Search,
                    discover, and share accessibility features to help everyone.
                </p>
            </header>

            {/* Action Button */}
            <div className="mb-8">
                <Button
                    onClick={() => setShowAddForm(!showAddForm)}
                    variant={showAddForm ? 'outline' : 'default'}
                    size="lg"
                >
                    {showAddForm ? '← Back to Search' : '+ Add New Entry'}
                </Button>
            </div>

            {/* Content */}
            <div className="w-full max-w-6xl">
                {showAddForm ? (
                    <div className="flex justify-center">
                        <AddEntryForm onSuccess={() => setShowAddForm(false)} />
                    </div>
                ) : (
                    <AccessibilitySearch />
                )}
            </div>

            {/* Footer */}
            <footer className="mt-16 py-8 text-center">
                <p className="text-muted-foreground text-sm">
                    <span className="text-red-500">♿</span> Making the world
                    more accessible, one entry at a time.
                </p>
            </footer>
        </main>
    );
}
