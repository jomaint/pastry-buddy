import clsx from "clsx";

type AvatarSize = "sm" | "md" | "lg" | "xl";

interface AvatarProps {
	src?: string | null;
	alt?: string;
	name: string;
	size?: AvatarSize;
	className?: string;
}

const sizeStyles: Record<AvatarSize, string> = {
	sm: "h-8 w-8 text-xs",
	md: "h-10 w-10 text-sm",
	lg: "h-14 w-14 text-base",
	xl: "h-20 w-20 text-lg",
};

function getInitials(name: string): string {
	const parts = name.trim().split(/\s+/);
	if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? "";
	return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function Avatar({ src, alt, name, size = "md", className }: AvatarProps) {
	const initials = getInitials(name);

	return (
		<div
			className={clsx(
				"relative inline-flex shrink-0 items-center justify-center rounded-full overflow-hidden",
				sizeStyles[size],
				!src && "bg-parchment text-ganache font-medium",
				className,
			)}
		>
			{src ? (
				<img
					src={src}
					alt={alt || name}
					className="h-full w-full object-cover"
				/>
			) : (
				<span aria-label={name}>{initials}</span>
			)}
		</div>
	);
}

export { Avatar, type AvatarProps };
