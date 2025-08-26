import clsx from "clsx";
import type { InputHTMLAttributes } from "react";
import type { ReactNode } from "react";

type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "className"> & {
    label: string;
    error?: string;
    leftIcon?: ReactNode;
    rightIcon?: ReactNode;
    containerClassName?: string;
    inputClassName?: string;
    labelClassName?: string;
};

export function Input({
                          id,
                          label,
                          error,
                          leftIcon,
                          rightIcon,
                          containerClassName,
                          inputClassName,
                          labelClassName,
                          required,
                          ...props
                      }: InputProps) {
    return (
        <div className={clsx("mb-4", containerClassName)}>
            <div className={clsx(
                "relative border-b-2 border-neutral-300/90 focus-within:border-white/90 rounded-sm",
                error && "border-red-400 focus-within:border-red-400"
            )}>
                {leftIcon && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 pl-1">
            {leftIcon}
          </span>
                )}
                <input
                    id={id}
                    placeholder=" "
                    required={required}
                    className={clsx(
                        "peer w-full h-10 bg-transparent border-none outline-none text-white placeholder-transparent",
                        leftIcon && "pl-8",
                        rightIcon && "pr-8",
                        inputClassName
                    )}
                    {...props}
                />
                <label
                    htmlFor={id}
                    className={clsx(
                        "absolute left-0 text-white transition-all duration-150 pointer-events-none",
                        // floating
                        "top-1/2 -translate-y-1/2 peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-base",
                        "peer-focus:top-0 peer-focus:text-sm peer-valid:top-0 peer-valid:text-sm",
                        leftIcon && "pl-8",
                        labelClassName
                    )}
                >
                    {label}{required ? " *" : ""}
                </label>
                {rightIcon && (
                    <span className="absolute right-0 top-1/2 -translate-y-1/2 pr-1">
            {rightIcon}
          </span>
                )}
            </div>
            {error && <p className="text-sm text-red-300 mt-1">{error}</p>}
        </div>
    );
}
