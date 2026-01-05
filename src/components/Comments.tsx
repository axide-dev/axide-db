'use client';

import * as React from 'react';
import { useQuery, useMutation } from 'convex/react';
import { useUser, SignInButton } from '@clerk/nextjs';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { Button } from '~/components/ui/button';
import { Textarea } from '~/components/ui/textarea';
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
    CardFooter
} from '~/components/ui/card';
import { Badge } from '~/components/ui/badge';

type Category = 'game' | 'hardware' | 'place' | 'software' | 'service';

interface CommentsProps {
    entryId:
        | Id<'games'>
        | Id<'hardware'>
        | Id<'places'>
        | Id<'software'>
        | Id<'services'>;
    entryName: string;
    entryType: Category;
}

function formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

export function Comments({ entryId, entryName, entryType }: CommentsProps) {
    const { isSignedIn, user } = useUser();
    const comments = useQuery(api.comments.getCommentsForEntry, {
        entryType,
        gameId: entryType === 'game' ? (entryId as string) : undefined,
        hardwareId: entryType === 'hardware' ? (entryId as string) : undefined,
        placeId: entryType === 'place' ? (entryId as string) : undefined,
        softwareId: entryType === 'software' ? (entryId as string) : undefined,
        serviceId: entryType === 'service' ? (entryId as string) : undefined
    });
    const addComment = useMutation(api.comments.addComment);
    const deleteComment = useMutation(api.comments.deleteComment);

    const [newComment, setNewComment] = React.useState('');
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim() || !isSignedIn) return;

        setIsSubmitting(true);
        try {
            await addComment({
                entryType,
                gameId: entryType === 'game' ? (entryId as string) : undefined,
                hardwareId:
                    entryType === 'hardware' ? (entryId as string) : undefined,
                placeId:
                    entryType === 'place' ? (entryId as string) : undefined,
                softwareId:
                    entryType === 'software' ? (entryId as string) : undefined,
                serviceId:
                    entryType === 'service' ? (entryId as string) : undefined,
                content: newComment.trim()
            });
            setNewComment('');
        } catch (error) {
            console.error('Failed to add comment:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (commentId: Id<'comments'>) => {
        if (!confirm('Are you sure you want to delete this comment?')) return;

        try {
            await deleteComment({ id: commentId });
        } catch (error) {
            console.error('Failed to delete comment:', error);
        }
    };

    return (
        <Card className="w-full border-[#242433] bg-[#12121A]">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[#F5F6FA]">
                    💬 Comments
                    {comments && (
                        <Badge
                            variant="secondary"
                            className="bg-[#5EEAD4]/20 text-[#5EEAD4]"
                            aria-label={`${comments.length} comments`}
                        >
                            {comments.length}
                        </Badge>
                    )}
                </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
                {/* Comment Form */}
                {isSignedIn ? (
                    <form
                        onSubmit={handleSubmit}
                        className="flex flex-col gap-3"
                    >
                        <div className="flex items-start gap-3">
                            {user?.imageUrl && (
                                <img
                                    src={user.imageUrl}
                                    alt={user.fullName ?? 'User'}
                                    className="h-8 w-8 rounded-full ring-2 ring-[#242433]"
                                />
                            )}
                            <div className="flex-1">
                                <Textarea
                                    placeholder={`Share your accessibility experience with ${entryName}...`}
                                    value={newComment}
                                    onChange={(e) =>
                                        setNewComment(e.target.value)
                                    }
                                    rows={3}
                                    className="resize-none border-[#242433] bg-[#0B0B10] text-[#F5F6FA] placeholder:text-[#B9BBC7]/50 focus:border-[#2DE2E6]/50"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <Button
                                type="submit"
                                disabled={isSubmitting || !newComment.trim()}
                                size="sm"
                                className="bg-[#2DE2E6] text-[#0B0B10] hover:bg-[#2DE2E6]/90"
                            >
                                {isSubmitting ? 'Posting...' : 'Post Comment'}
                            </Button>
                        </div>
                    </form>
                ) : (
                    <div className="flex flex-col items-center gap-3 rounded-lg border border-[#242433] bg-[#0B0B10] p-6 text-center">
                        <p className="text-[#B9BBC7]">
                            Sign in to share your accessibility experience
                        </p>
                        <SignInButton mode="modal">
                            <Button
                                variant="outline"
                                className="border-[#242433] text-[#F5F6FA] hover:border-[#2DE2E6]/50 hover:bg-[#2DE2E6]/5"
                            >
                                Sign In to Comment
                            </Button>
                        </SignInButton>
                    </div>
                )}

                {/* Comments List */}
                <div className="flex flex-col gap-4">
                    {comments === undefined ? (
                        <p className="text-center text-sm text-[#B9BBC7]">
                            Loading comments...
                        </p>
                    ) : comments.length === 0 ? (
                        <p className="text-center text-sm text-[#B9BBC7]">
                            No comments yet. Be the first to share your
                            experience!
                        </p>
                    ) : (
                        comments.map((comment) => (
                            <div
                                key={comment._id}
                                className="flex gap-3 border-t border-[#242433] pt-4"
                            >
                                {comment.userImage ? (
                                    <img
                                        src={comment.userImage}
                                        alt={comment.userName ?? 'User'}
                                        className="h-8 w-8 rounded-full ring-2 ring-[#242433]"
                                    />
                                ) : (
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#242433]">
                                        👤
                                    </div>
                                )}
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium text-[#F5F6FA]">
                                            {comment.userName ?? 'Anonymous'}
                                        </span>
                                        <span className="text-xs text-[#B9BBC7]/60">
                                            {formatDate(comment.createdAt)}
                                        </span>
                                        {comment.updatedAt && (
                                            <Badge
                                                variant="outline"
                                                className="text-xs border-[#242433] text-[#B9BBC7]"
                                            >
                                                edited
                                            </Badge>
                                        )}
                                    </div>
                                    <p className="mt-1 whitespace-pre-wrap text-sm text-[#B9BBC7]">
                                        {comment.content}
                                    </p>
                                    {/* Show delete button if user owns the comment */}
                                    {isSignedIn &&
                                        user?.id === comment.userId && (
                                            <Button
                                                variant="ghost"
                                                size="xs"
                                                className="mt-1 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                                onClick={() =>
                                                    handleDelete(comment._id)
                                                }
                                            >
                                                Delete
                                            </Button>
                                        )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
