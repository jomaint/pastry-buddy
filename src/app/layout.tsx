import { Providers } from "@/components/Providers";
import { Shell } from "@/components/layout";
import type { Metadata, Viewport } from "next";
import { DM_Sans, DM_Serif_Display } from "next/font/google";
import "leaflet/dist/leaflet.css";
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

export const viewport: Viewport = {
	width: "device-width",
	initialScale: 1,
	maximumScale: 1,
	userScalable: false,
	viewportFit: "cover",
	themeColor: "#fbf7f2",
};

export const metadata: Metadata = {
	title: {
		default: "Pastry Buddy",
		template: "%s | Pastry Buddy",
	},
	description: "Discover, log, and rank your favorite pastries",
	manifest: "/manifest.json",
	appleWebApp: {
		capable: true,
		statusBarStyle: "default",
		title: "Pastry Buddy",
	},
	other: {
		"mobile-web-app-capable": "yes",
	},
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en" className={`${dmSerifDisplay.variable} ${dmSans.variable}`}>
			<body>
				<Providers>
					<Shell>{children}</Shell>
				</Providers>
			</body>
		</html>
	);
}
