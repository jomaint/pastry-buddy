import clsx from "clsx";
import type { HTMLAttributes } from "react";

type CardVariant = "default" | "elevated";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
	variant?: CardVariant;
}

const variantStyles: Record<CardVariant, string> = {
	default: "bg-parchment",
	elevated: "bg-flour shadow-sm",
};

function Card({ variant = "default", className, children, ...props }: CardProps) {
	return (
		<div
			className={clsx("rounded-[16px] p-4", variantStyles[variant], className)}
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
