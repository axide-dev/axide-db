import Link from 'next/link';
import { Button } from '~/components/ui/button';

export default function EntryNotFound() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center px-4 py-8">
            <div className="flex flex-col items-center gap-6 text-center">
                {/* Decorative 404 */}
                <div className="relative">
                    <span className="font-heading text-8xl font-bold text-[#242433]">
                        404
                    </span>
                    <span className="absolute inset-0 flex items-center justify-center font-heading text-8xl font-bold text-[#2DE2E6]/20 blur-xl">
                        404
                    </span>
                </div>

                <h1 className="font-heading text-3xl font-bold text-[#F5F6FA]">
                    Entry Not Found
                </h1>
                <p className="max-w-md text-lg text-[#B9BBC7]">
                    The accessibility entry you&apos;re looking for doesn&apos;t
                    exist or may have been removed.
                </p>
                <Link href="/">
                    <Button
                        variant="outline"
                        className="border-[#242433] text-[#F5F6FA] hover:border-[#2DE2E6]/50 hover:bg-[#2DE2E6]/5"
                    >
                        ← Back to Home
                    </Button>
                </Link>
            </div>
        </div>
    );
}
