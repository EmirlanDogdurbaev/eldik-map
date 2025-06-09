import React from "react";

type Props = {
  className?: string;
  children?: React.ReactNode;
  onClick?: () => void;
  onSubmit?: () => void;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  variant?: "primary" | "secondary" | "tertiary";
  size?: "small" | "medium" | "large";
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
};

const Button = (props: Props) => {
  return (
    <button
      className={`${props.className} bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  `}
      disabled={props.disabled}
      onClick={props.onClick}
      type={props.type}
    >
      {props.children}  
    </button>
  );
};

export default Button;
