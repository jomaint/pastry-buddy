"use client";

import { DemoSeed } from "@/components/DemoSeed";
import { ToastProvider } from "@/components/ui/Toast";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

const DEMO_MODE = !process.env.NEXT_PUBLIC_SUPABASE_URL;

export function Providers({ children }: { children: React.ReactNode }) {
	const [queryClient] = useState(
		() =>
			new QueryClient({
				defaultOptions: {
					queries: {
						staleTime: DEMO_MODE ? Number.POSITIVE_INFINITY : 1000 * 60,
						retry: DEMO_MODE ? 0 : 1,
						refetchOnWindowFocus: false,
					},
					mutations: {
						retry: 0,
					},
				},
			}),
	);

	return (
		<QueryClientProvider client={queryClient}>
			{DEMO_MODE && <DemoSeed />}
			<ToastProvider>{children}</ToastProvider>
		</QueryClientProvider>
	);
}
