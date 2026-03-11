"use client";

import { useAuth } from "@/api/auth";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
	const { data, isLoading } = useAuth();
	const router = useRouter();

	useEffect(() => {
		if (!isLoading && (!data?.isAuthenticated || data?.user?.role !== "admin")) {
			router.push("/");
		}
	}, [isLoading, data, router]);

	if (isLoading) {
		return (
			<div className="fixed inset-0 z-50 flex items-center justify-center bg-creme">
				<Loader2 size={24} className="animate-spin text-brioche" />
			</div>
		);
	}

	if (!data?.isAuthenticated || data?.user?.role !== "admin") {
		return null;
	}

	return (
		<div className="fixed inset-0 z-50 flex bg-creme">
			<AdminSidebar />

			<div className="flex min-w-0 flex-1 flex-col">
				<header className="flex h-14 shrink-0 items-center justify-between border-b border-parchment bg-flour px-6">
					<h1 className="font-display text-lg text-espresso">Admin</h1>
					<div className="flex items-center gap-4">
						<span className="text-sm text-ganache">
							{data.user?.display_name ?? data.user?.username}
						</span>
						<Link href="/" className="text-sm text-brioche transition-colors hover:text-brioche/80">
							Back to app &rarr;
						</Link>
					</div>
				</header>

				<main className="flex-1 overflow-y-auto p-6">{children}</main>
			</div>
		</div>
	);
}
