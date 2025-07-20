import Spinner from "./spinner";

type ButtonProps = {
  type: "button" | "submit" | "reset" | undefined;
  disabled?: boolean;
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onPointerDown?: (e: React.PointerEvent<HTMLButtonElement>) => void;
  isPending?: boolean;
  children: React.ReactNode;
};

export default function Button({ type, disabled = false, className = "", onClick, onPointerDown, isPending = false, children }: ButtonProps) {
  return (
    <button
      type={type || "button"}
      disabled={disabled || isPending}
      onClick={onClick}
      onPointerDown={onPointerDown}
      className={`flex items-center gap-2 ${isPending ? "hover:cursor-wait" : disabled ? "hover:cursor-not-allowed" : "hover:cursor-pointer"} ${className}`}
    >
      { isPending && <Spinner />}
      {children}
    </button>
  );
}
