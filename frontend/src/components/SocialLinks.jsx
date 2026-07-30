export function SocialLinks({ profile }) {
  const links = [
    { label: 'GitHub', href: profile?.githubUrl, icon: 'G' },
    { label: 'LinkedIn', href: profile?.linkedinUrl, icon: 'in' },
    { label: 'Website', href: profile?.websiteUrl, icon: '↗' },
  ].filter((link) => Boolean(link.href))

  if (!links.length) {
    return null
  }

  return (
    <div className="flex flex-wrap gap-3">
      {links.map((link) => (
        <a
          key={link.label}
          href={link.href}
          target="_blank"
          rel="noreferrer"
          className="chip chip--accent transition hover:-translate-y-0.5 hover:shadow-md"
        >
          {link.icon} {link.label}
        </a>
      ))}
    </div>
  )
}
