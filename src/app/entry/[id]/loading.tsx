import { SkeletonEntryDetail } from '~/components/ui/skeleton';

export default function Loading() {
    return (
        <div className="flex min-h-screen flex-col items-center px-4 py-12 sm:px-8">
            <div className="w-full max-w-4xl">
                <SkeletonEntryDetail />
            </div>
        </div>
    );
}
