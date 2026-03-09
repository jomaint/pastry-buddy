import { Header } from "./Header";
import { BottomNav } from "./BottomNav";
import { Sidebar } from "./Sidebar";

interface ShellProps {
	children: React.ReactNode;
}

export function Shell({ children }: ShellProps) {
	return (
		<div className="min-h-dvh bg-creme">
			{/* Desktop sidebar */}
			<Sidebar />

			{/* Mobile header */}
			<Header />

			{/* Main content */}
			<main className="pb-20 md:pb-0 md:pl-64">
				{children}
			</main>

			{/* Mobile bottom nav */}
			<BottomNav />
		</div>
	);
}
