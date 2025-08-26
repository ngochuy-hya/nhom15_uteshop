import { forwardRef } from "react";
import clsx from "clsx";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
    loading?: boolean;
    variant?: "primary" | "ghost";
    size?: "md" | "sm";
};

const base =
    "inline-flex items-center justify-center rounded-md font-semibold transition-colors duration-300 border-2 disabled:opacity-60 disabled:cursor-not-allowed";
const variants: Record<NonNullable<ButtonProps["variant"]>, string> = {
    primary:
        "bg-white text-black border-transparent hover:!bg-transparent hover:!text-white hover:!border-white",
    ghost:
        "bg-transparent text-white border-white hover:!bg-white hover:!text-black",
};
const sizes: Record<NonNullable<ButtonProps["size"]>, string> = {
    md: "h-11 px-5 text-[16px]",
    sm: "h-9 px-4 text-[14px]",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, loading, children, variant = "primary", size = "md", ...props }, ref) => {
        return (
            <button
                ref={ref}
                className={clsx(base, variants[variant], sizes[size], className)}
                disabled={loading || props.disabled}
                {...props}
            >
                {loading ? "Loading..." : children}
            </button>
        );
    }
);
Button.displayName = "Button";
