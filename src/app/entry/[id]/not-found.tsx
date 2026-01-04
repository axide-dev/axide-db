import Link from 'next/link';
import { Button } from '~/components/ui/button';

export default function EntryNotFound() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center px-4 py-8">
            <div className="flex flex-col items-center gap-4 text-center">
                <h1 className="text-4xl font-bold text-red-500">
                    Entry Not Found
                </h1>
                <p className="text-muted-foreground max-w-md text-lg">
                    The accessibility entry you're looking for doesn't exist or
                    may have been removed.
                </p>
                <Link href="/">
                    <Button variant="outline">← Back to Home</Button>
                </Link>
            </div>
        </main>
    );
}
