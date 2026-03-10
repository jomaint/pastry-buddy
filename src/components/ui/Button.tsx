"use client";

import clsx from "clsx";
import { type ButtonHTMLAttributes, forwardRef } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "golden";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: ButtonVariant;
	size?: ButtonSize;
}

const variantStyles: Record<ButtonVariant, string> = {
	primary: "bg-brioche text-flour hover:bg-brioche/90 active:bg-brioche/80",
	secondary: "bg-parchment text-espresso hover:bg-parchment/80 active:bg-parchment/70",
	ghost: "bg-transparent text-espresso hover:bg-parchment active:bg-parchment/80",
	golden: "golden-gradient text-flour hover:opacity-90 active:opacity-80",
};

const sizeStyles: Record<ButtonSize, string> = {
	sm: "min-h-[44px] px-3 text-sm gap-1.5",
	md: "min-h-[44px] px-4 text-sm gap-2",
	lg: "min-h-[48px] px-6 text-base gap-2",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
	({ variant = "primary", size = "md", className, disabled, children, ...props }, ref) => {
		return (
			<button
				ref={ref}
				disabled={disabled}
				className={clsx(
					"inline-flex items-center justify-center rounded-[14px] font-medium transition-all duration-150",
					"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brioche/30 focus-visible:ring-offset-2",
					"active:scale-[0.97]",
					"disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100",
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
