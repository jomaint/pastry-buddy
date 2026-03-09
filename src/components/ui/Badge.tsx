import clsx from "clsx";
import type { HTMLAttributes } from "react";

type BadgeVariant =
	| "default"
	| "brioche"
	| "raspberry"
	| "pistachio"
	| "caramel"
	| "blueberry";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
	variant?: BadgeVariant;
}

const variantStyles: Record<BadgeVariant, string> = {
	default: "bg-parchment text-espresso",
	brioche: "bg-brioche/15 text-brioche",
	raspberry: "bg-raspberry/15 text-raspberry",
	pistachio: "bg-pistachio/15 text-pistachio",
	caramel: "bg-caramel/15 text-caramel",
	blueberry: "bg-blueberry/15 text-blueberry",
};

function Badge({ variant = "default", className, children, ...props }: BadgeProps) {
	return (
		<span
			className={clsx(
				"inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
				variantStyles[variant],
				className,
			)}
			{...props}
		>
			{children}
		</span>
	);
}

export { Badge, type BadgeProps };
