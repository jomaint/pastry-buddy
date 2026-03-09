import type { Metadata } from "next";
import { DM_Serif_Display, DM_Sans } from "next/font/google";
import { Shell } from "@/components/layout";
import "./globals.css";

const dmSerifDisplay = DM_Serif_Display({
	weight: "400",
	subsets: ["latin"],
	variable: "--font-display",
});

const dmSans = DM_Sans({
	subsets: ["latin"],
	variable: "--font-body",
});

export const metadata: Metadata = {
	title: "Pastry Buddy",
	description: "Discover, log, and rank your favorite pastries",
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en" className={`${dmSerifDisplay.variable} ${dmSans.variable}`}>
			<body className="font-body bg-creme text-espresso antialiased">
				<Shell>{children}</Shell>
			</body>
		</html>
	);
}
