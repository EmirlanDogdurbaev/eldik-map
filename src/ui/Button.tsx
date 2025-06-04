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
      className={props.className}
      disabled={props.disabled}
      onClick={props.onClick}
      type={props.type}
    >
      {props.icon && props.iconPosition === "left" && (
        <span className="mr-2">{props.icon}</span>
      )}
      {props.children}
      {props.icon && props.iconPosition === "right" && (
        <span className="ml-2">{props.icon}</span>
      )}
    </button>
  );
};

export default Button;
