import React from "react";

interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        ref={ref} // Пробрасываем ref к нативному элементу
        className={`${className} focus:border-blue-400 focus:outline-0`}
        {...props}
      />
    );
  }
);

Textarea.displayName = "Textarea"; // Устанавливаем displayName для удобства отладки в React DevTools

export default Textarea;
