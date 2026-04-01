'use client'

import Link from 'next/link'

type Props = {
  dark?: boolean
  size?: 'sm' | 'md' | 'lg'
  href?: string | null
}

export default function AticaLogo({ dark = false, size = 'md', href = '/' }: Props) {
  const sizes = {
    sm: { title: 'text-lg', sub: 'text-[8px]' },
    md: { title: 'text-2xl', sub: 'text-[9px]' },
    lg: { title: 'text-5xl', sub: 'text-xs' },
  }

  const content = (
    <div className="flex flex-col items-center select-none">
      <span className={`font-display tracking-[0.25em] font-semibold leading-none ${sizes[size].title} ${dark ? 'text-white' : 'text-[#1a1a2e]'}`}>
        ATICA
      </span>
      <span className={`tracking-[0.4em] font-light mt-0.5 ${sizes[size].sub} ${dark ? 'text-white/40' : 'text-[#1a1a2e]/40'}`}>
        TAILORING
      </span>
    </div>
  )

  if (href) {
    return <Link href={href}>{content}</Link>
  }

  return <div>{content}</div>
}