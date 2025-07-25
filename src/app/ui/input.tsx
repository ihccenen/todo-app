type InputProps = {
  label?: string;
  type?: string;
  id: string;
  name: string;
  pattern: string;
  defaultValue?: string;
  required?: boolean;
  disabled?: boolean;
  children?: React.ReactNode;
  className?: string;
};

export default function Input({ label = "", type = "text", id, name, pattern, defaultValue = "", required = false, disabled = false, className = "", children = null }: InputProps) {
  return (
    <div className={`relative ${className}`}>
      <input
        type={type}
        name={name}
        id={id}
        pattern={pattern}
        defaultValue={defaultValue}
        required={required}
        disabled={disabled}
        className="block px-2.5 pb-2.5 pt-4 w-full bg-transparent rounded-lg border-1 appearance-none text-white border-blue-500 invalid:[&:not(:placeholder-shown):not(:focus)]:border-red-500 focus:outline-none focus:ring-0 peer"
        placeholder=" "
      />
      { label && <label
                   htmlFor={id}
                   className="absolute text-blue-500 peer-[:invalid&:not(:placeholder-shown)]:text-red-500 transform duration-200 -translate-y-[50%] scale-75 top-0 z-10 origin-[0] peer-focus:bg-gray-900 peer-[&:not(:placeholder-shown)]:bg-gray-900 rounded-md px-2 peer-focus:px-2 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-0 peer-focus:scale-75 peer-focus:-translate-y-[50%] start-1 rtl:peer-focus:translate-x-1/4 rtl:peer-focus:left-auto"
      >
                   {label}
                 </label> }
      {children}
    </div>
  );
}
