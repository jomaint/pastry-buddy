"use client";

import clsx from "clsx";
import { type ButtonHTMLAttributes, forwardRef } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: ButtonVariant;
	size?: ButtonSize;
}

const variantStyles: Record<ButtonVariant, string> = {
	primary: "bg-brioche text-flour hover:bg-brioche/90 active:bg-brioche/80",
	secondary: "bg-parchment text-espresso hover:bg-parchment/80 active:bg-parchment/70",
	ghost: "bg-transparent text-espresso hover:bg-parchment active:bg-parchment/80",
};

const sizeStyles: Record<ButtonSize, string> = {
	sm: "h-8 px-3 text-sm gap-1.5",
	md: "h-10 px-4 text-sm gap-2",
	lg: "h-12 px-6 text-base gap-2",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
	({ variant = "primary", size = "md", className, disabled, children, ...props }, ref) => {
		return (
			<button
				ref={ref}
				disabled={disabled}
				className={clsx(
					"inline-flex items-center justify-center rounded-[14px] font-medium transition-colors duration-150",
					"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brioche/30 focus-visible:ring-offset-2",
					"disabled:opacity-50 disabled:cursor-not-allowed",
					variantStyles[variant],
					sizeStyles[size],
					className,
				)}
				{...props}
			>
				{children}
			</button>
		);
	},
);

Button.displayName = "Button";

export { Button, type ButtonProps };
