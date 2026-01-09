"use client";

/**
 * Windows 95/98 style button component that matches the window decoration aesthetic
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Button content
 * @param {string} props.variant - Button variant: 'default' | 'primary' | 'danger'
 * @param {string} props.size - Button size: 'sm' | 'md' | 'lg'
 * @param {boolean} props.disabled - Disabled state
 * @param {Function} props.onClick - Click handler
 * @param {string} props.type - Button type (button, submit, reset)
 * @param {string} props.className - Additional custom classes
 */
export default function Button({
  children,
  variant = "default",
  size = "md",
  disabled = false,
  onClick,
  type = "button",
  className = "",
  ...props
}) {
  // Base styles - Windows 95/98 beveled look
  const baseStyles = `
    relative
    font-jetbrains
    font-medium
    border-2
    transition-all
    disabled:opacity-50
    disabled:cursor-not-allowed
    active:shadow-none
    active:translate-y-px
  `;

  // Variant styles
  const variants = {
    default: `
      bg-[#c0c0c0]
      text-black
      border-t-[#ffffff]
      border-l-[#ffffff]
      border-r-[#808080]
      border-b-[#808080]
      hover:bg-[#d0d0d0]
      shadow-[inset_1px_1px_0_0_#dfdfdf,inset_-1px_-1px_0_0_#000000]
      active:border-t-[#808080]
      active:border-l-[#808080]
      active:border-r-[#ffffff]
      active:border-b-[#ffffff]
      active:shadow-[inset_-1px_-1px_0_0_#dfdfdf,inset_1px_1px_0_0_#000000]
    `,
    primary: `
      bg-gradient-to-b from-[#5a9c4a] to-[#4a7c3a]
      text-white
      border-t-[#7abc6a]
      border-l-[#7abc6a]
      border-r-[#2a5c1a]
      border-b-[#2a5c1a]
      hover:from-[#6aac5a] hover:to-[#5a9c4a]
      shadow-[inset_1px_1px_0_0_#8acc7a,inset_-1px_-1px_0_0_#1a4c0a]
      active:border-t-[#2a5c1a]
      active:border-l-[#2a5c1a]
      active:border-r-[#7abc6a]
      active:border-b-[#7abc6a]
      active:shadow-[inset_-1px_-1px_0_0_#8acc7a,inset_1px_1px_0_0_#1a4c0a]
    `,
    danger: `
      bg-gradient-to-b from-[#e85d5d] to-[#c62828]
      text-white
      border-t-[#ff8080]
      border-l-[#ff8080]
      border-r-[#8b1a1a]
      border-b-[#8b1a1a]
      hover:from-[#ff6b6b] hover:to-[#d32f2f]
      shadow-[inset_1px_1px_0_0_#ff9090,inset_-1px_-1px_0_0_#5a0000]
      active:border-t-[#8b1a1a]
      active:border-l-[#8b1a1a]
      active:border-r-[#ff8080]
      active:border-b-[#ff8080]
      active:shadow-[inset_-1px_-1px_0_0_#ff9090,inset_1px_1px_0_0_#5a0000]
    `,
  };

  // Size styles
  const sizes = {
    sm: "px-3 py-1 text-sm",
    md: "px-4 py-1.5 text-base",
    lg: "px-6 py-2 text-lg",
  };

  const variantClass = variants[variant] || variants.default;
  const sizeClass = sizes[size] || sizes.md;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variantClass} ${sizeClass} ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  );
}
