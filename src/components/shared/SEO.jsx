import { useEffect } from 'react'

export default function SEO({ title, description, keywords, ogImage, canonicalUrl }) {
  useEffect(() => {
    const baseTitle = 'Home Tiffin'
    
    // 1. Title Update
    if (title) {
      document.title = `${title} | ${baseTitle}`
    } else {
      document.title = 'Home Tiffin | Premium Home-Cooked Food Delivery in Karachi'
    }

    // Helper to update/create meta tags in head
    const updateMetaTag = (name, content, isProperty = false) => {
      if (!content) return
      const attr = isProperty ? 'property' : 'name'
      let element = document.querySelector(`meta[${attr}="${name}"]`)
      if (element) {
        element.setAttribute('content', content)
      } else {
        element = document.createElement('meta')
        element.setAttribute(attr, name)
        element.setAttribute('content', content)
        document.head.appendChild(element)
      }
    }

    // 2. Description Update
    if (description) {
      updateMetaTag('description', description)
      updateMetaTag('og:description', description, true)
      updateMetaTag('twitter:description', description)
    }

    // 3. Keywords Update
    if (keywords) {
      updateMetaTag('keywords', keywords)
    }

    // 4. Title tags for Open Graph & Twitter Card
    const fullTitle = title ? `${title} | ${baseTitle}` : 'Home Tiffin | Premium Home-Cooked Food Delivery in Karachi'
    updateMetaTag('og:title', fullTitle, true)
    updateMetaTag('twitter:title', fullTitle)

    // 5. Image Update
    if (ogImage) {
      updateMetaTag('og:image', ogImage, true)
      updateMetaTag('twitter:image', ogImage)
    }

    // 6. Canonical Link Update
    const canonical = canonicalUrl || window.location.href
    let link = document.querySelector('link[rel="canonical"]')
    if (link) {
      link.setAttribute('href', canonical)
    } else {
      link = document.createElement('link')
      link.setAttribute('rel', 'canonical')
      link.setAttribute('href', canonical)
      document.head.appendChild(link)
    }
  }, [title, description, keywords, ogImage, canonicalUrl])

  return null
}
