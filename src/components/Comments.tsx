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
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    💬 Comments
                    {comments && (
                        <Badge variant="secondary">{comments.length}</Badge>
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
                                    className="h-8 w-8 rounded-full"
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
                                    className="resize-none"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <Button
                                type="submit"
                                disabled={isSubmitting || !newComment.trim()}
                                size="sm"
                            >
                                {isSubmitting ? 'Posting...' : 'Post Comment'}
                            </Button>
                        </div>
                    </form>
                ) : (
                    <div className="bg-muted/50 flex flex-col items-center gap-3 rounded-lg p-6 text-center">
                        <p className="text-muted-foreground">
                            Sign in to share your accessibility experience
                        </p>
                        <SignInButton mode="modal">
                            <Button variant="outline">
                                Sign In to Comment
                            </Button>
                        </SignInButton>
                    </div>
                )}

                {/* Comments List */}
                <div className="flex flex-col gap-4">
                    {comments === undefined ? (
                        <p className="text-muted-foreground text-center text-sm">
                            Loading comments...
                        </p>
                    ) : comments.length === 0 ? (
                        <p className="text-muted-foreground text-center text-sm">
                            No comments yet. Be the first to share your
                            experience!
                        </p>
                    ) : (
                        comments.map((comment) => (
                            <div
                                key={comment._id}
                                className="border-border flex gap-3 border-t pt-4"
                            >
                                {comment.userImage ? (
                                    <img
                                        src={comment.userImage}
                                        alt={comment.userName ?? 'User'}
                                        className="h-8 w-8 rounded-full"
                                    />
                                ) : (
                                    <div className="bg-muted flex h-8 w-8 items-center justify-center rounded-full">
                                        👤
                                    </div>
                                )}
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium">
                                            {comment.userName ?? 'Anonymous'}
                                        </span>
                                        <span className="text-muted-foreground text-xs">
                                            {formatDate(comment.createdAt)}
                                        </span>
                                        {comment.updatedAt && (
                                            <Badge
                                                variant="outline"
                                                className="text-xs"
                                            >
                                                edited
                                            </Badge>
                                        )}
                                    </div>
                                    <p className="mt-1 whitespace-pre-wrap text-sm">
                                        {comment.content}
                                    </p>
                                    {/* Show delete button if user owns the comment */}
                                    {isSignedIn &&
                                        user?.id === comment.userId && (
                                            <Button
                                                variant="ghost"
                                                size="xs"
                                                className="text-destructive mt-1"
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
