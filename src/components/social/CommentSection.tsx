"use client";

import { useAuth } from "@/api/auth";
import { useAddComment, useComments, useDeleteComment } from "@/api/social";
import { Avatar } from "@/components/ui/Avatar";
import { timeAgo } from "@/lib/time-utils";
import { Loader2, MessageCircle, Send, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

interface CommentSectionProps {
	checkInId: string;
}

export function CommentSection({ checkInId }: CommentSectionProps) {
	const { data: auth } = useAuth();
	const { data: comments, isLoading } = useComments(checkInId);
	const addComment = useAddComment();
	const deleteComment = useDeleteComment();
	const [body, setBody] = useState("");

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!body.trim()) return;
		addComment.mutate({ checkInId, body }, { onSuccess: () => setBody("") });
	};

	return (
		<section className="flex flex-col gap-4">
			<div className="flex items-center gap-2">
				<MessageCircle size={16} className="text-sesame" />
				<h3 className="text-sm font-medium text-espresso">
					Comments{comments && comments.length > 0 ? ` (${comments.length})` : ""}
				</h3>
			</div>

			{/* Comment list */}
			{isLoading ? (
				<div className="flex justify-center py-6">
					<Loader2 size={18} className="animate-spin text-sesame" />
				</div>
			) : comments && comments.length > 0 ? (
				<div className="flex flex-col gap-3">
					{comments.map((comment) => (
						<div key={comment.id} className="flex gap-2.5">
							<Link href={`/profile/${comment.username}`} className="shrink-0">
								<Avatar name={comment.display_name || comment.username} size="sm" />
							</Link>
							<div className="flex-1 min-w-0">
								<div className="flex items-baseline gap-1.5">
									<Link
										href={`/profile/${comment.username}`}
										className="text-xs font-semibold text-espresso hover:text-brioche transition-colors"
									>
										@{comment.username}
									</Link>
									<span className="text-[11px] text-sesame">{timeAgo(comment.created_at)}</span>
								</div>
								<p className="mt-0.5 text-sm text-ganache leading-relaxed">{comment.body}</p>
							</div>
							{auth?.user?.id === comment.user_id && (
								<button
									type="button"
									onClick={() => deleteComment.mutate({ commentId: comment.id, checkInId })}
									disabled={deleteComment.isPending}
									className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sesame/50 transition-colors hover:text-raspberry hover:bg-raspberry/10"
									aria-label="Delete comment"
								>
									<Trash2 size={12} />
								</button>
							)}
						</div>
					))}
				</div>
			) : (
				<p className="text-center text-xs text-sesame py-4">No comments yet</p>
			)}

			{/* Comment input */}
			{auth?.isAuthenticated ? (
				<form onSubmit={handleSubmit} className="flex gap-2">
					<input
						type="text"
						value={body}
						onChange={(e) => setBody(e.target.value)}
						placeholder="Add a comment..."
						maxLength={500}
						className="flex-1 min-h-[44px] rounded-[12px] border border-parchment bg-flour px-3 text-sm text-espresso placeholder:text-sesame/60 focus:border-brioche/40 focus:outline-none transition-colors"
					/>
					<button
						type="submit"
						disabled={!body.trim() || addComment.isPending}
						className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] bg-brioche text-flour transition-colors hover:bg-brioche/90 disabled:opacity-40 disabled:cursor-not-allowed"
						aria-label="Send comment"
					>
						{addComment.isPending ? (
							<Loader2 size={16} className="animate-spin" />
						) : (
							<Send size={16} />
						)}
					</button>
				</form>
			) : (
				<Link
					href="/sign-in"
					className="text-center text-xs text-brioche hover:text-brioche/80 transition-colors"
				>
					Sign in to comment
				</Link>
			)}
		</section>
	);
}
