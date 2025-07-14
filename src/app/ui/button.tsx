type ButtonProps = {
  type: "button" | "submit" | "reset" | undefined,
  disabled?: boolean,
  className?: string,
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void,
  isPending?: boolean,
  children: React.ReactNode,
};

export default function Button({ type, disabled = false, className = "", onClick = undefined, isPending = false, children }: ButtonProps) {
  return (
    <button
      type={type || "button"}
      disabled={disabled || isPending}
      onClick={onClick}
      className={`flex items-center gap-2 ${isPending ? "hover:cursor-wait" : disabled ? "hover:cursor-not-allowed" : "hover:cursor-pointer"} ${className}`}
    >
      { isPending &&
        <svg className="size-5 animate-spin text-white"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          >
          </path>
        </svg>
      }
      {children}
    </button>
  );
}
