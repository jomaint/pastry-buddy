import clsx from "clsx";
import type { HTMLAttributes } from "react";

type CardVariant = "default" | "elevated" | "glass" | "feed";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
	variant?: CardVariant;
}

const variantStyles: Record<CardVariant, string> = {
	default: "bg-parchment",
	elevated: "bg-flour shadow-sm",
	glass: "glass-card",
	feed: "bg-flour shadow-sm golden-border-left",
};

function Card({ variant = "default", className, children, ...props }: CardProps) {
	return (
		<div
			className={clsx(
				"rounded-[16px] p-4 transition-all duration-200",
				"hover:shadow-md hover:-translate-y-0.5",
				"active:scale-[0.99] active:shadow-sm",
				variantStyles[variant],
				className,
			)}
			{...props}
		>
			{children}
		</div>
	);
}

function CardHeader({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
	return (
		<div className={clsx("pb-3", className)} {...props}>
			{children}
		</div>
	);
}

function CardContent({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
	return (
		<div className={clsx(className)} {...props}>
			{children}
		</div>
	);
}

function CardFooter({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
	return (
		<div className={clsx("pt-3", className)} {...props}>
			{children}
		</div>
	);
}

export { Card, CardHeader, CardContent, CardFooter, type CardProps };
