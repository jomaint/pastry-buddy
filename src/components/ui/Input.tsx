"use client";

import clsx from "clsx";
import { type InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
	label?: string;
	error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
	({ label, error, className, id, ...props }, ref) => {
		const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

		return (
			<div className="flex flex-col gap-1.5">
				{label && (
					<label htmlFor={inputId} className="text-sm font-medium text-espresso">
						{label}
					</label>
				)}
				<input
					ref={ref}
					id={inputId}
					className={clsx(
						"h-11 w-full rounded-[12px] border bg-flour px-3 text-sm text-espresso placeholder:text-sesame",
						"transition-colors duration-150",
						"focus:outline-none focus:ring-2 focus:ring-brioche/30 focus:border-brioche",
						error
							? "border-raspberry focus:ring-raspberry/30 focus:border-raspberry"
							: "border-parchment",
						"disabled:opacity-50 disabled:cursor-not-allowed",
						className,
					)}
					{...props}
				/>
				{error && <p className="text-xs text-raspberry">{error}</p>}
			</div>
		);
	},
);

Input.displayName = "Input";

export { Input, type InputProps };
