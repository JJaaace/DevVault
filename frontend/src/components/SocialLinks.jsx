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
          className="rounded-full border border-slate-700 px-3 py-2 text-sm font-medium text-slate-300 transition hover:border-cyan-500 hover:text-cyan-300"
        >
          {link.icon} {link.label}
        </a>
      ))}
    </div>
  )
}
