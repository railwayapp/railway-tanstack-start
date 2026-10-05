import { site } from './site'

export function seo({
  title,
  description = site.description,
}: {
  title?: string
  description?: string
}) {
  const fullTitle = title ? `${title} · ${site.name}` : `${site.name} · TanStack Start on Railway`
  return [
    { title: fullTitle },
    { name: 'description', content: description },
    { property: 'og:type', content: 'website' },
    { property: 'og:title', content: fullTitle },
    { property: 'og:description', content: description },
    { property: 'og:image', content: '/og.jpg' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: fullTitle },
    { name: 'twitter:description', content: description },
    { name: 'twitter:image', content: '/og.jpg' },
  ]
}
