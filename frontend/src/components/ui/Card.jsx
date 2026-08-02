export function Card({ className = '', strong = false, hero = false, children, ...props }) {
  const modifiers = [
    'surface-card',
    strong ? 'surface-card--strong' : '',
    hero ? 'surface-card--hero' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <section className={modifiers} {...props}>
      {children}
    </section>
  )
}
