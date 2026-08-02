export function Button({
  as: Component = 'button',
  variant = 'primary',
  className = '',
  type = 'button',
  ...props
}) {
  const variantClass =
    variant === 'secondary'
      ? 'button-secondary'
      : variant === 'ghost'
        ? 'button-ghost'
        : 'button-primary'

  return (
    <Component
      type={Component === 'button' ? type : undefined}
      className={`${variantClass} ${className}`.trim()}
      {...props}
    />
  )
}
