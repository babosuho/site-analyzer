import { analyzeGeo } from './geo-analyzer'

const baseInput = { url: 'https://example.com', responseTimeMs: 300 }

describe('analyzeGeo', () => {
  it('returns high score for page with full E-E-A-T signals', () => {
    const html = `
      <html>
        <head>
          <script type="application/ld+json">${JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            "author": { "@type": "Person", "name": "Jane Doe" },
            "datePublished": "2024-01-01",
            "dateModified": "2024-06-01",
            "publisher": { "@type": "Organization", "name": "Example Co" }
          })}</script>
          <script type="application/ld+json">${JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "Example Co"
          })}</script>
        </head>
        <body>
          <span class="author">Jane Doe</span>
          <a href="/about">About</a>
          <a href="https://pubmed.ncbi.nlm.nih.gov/123">Source 1</a>
          <a href="https://scholar.google.com/article">Source 2</a>
        </body>
      </html>
    `
    const result = analyzeGeo({ ...baseInput, html })
    expect(result.score).toBeGreaterThanOrEqual(75)
    expect(result.details.hasArticleSchema).toBe(true)
    expect(result.details.hasOrganizationSchema).toBe(true)
  })

  it('detects HTTPS from URL', () => {
    const html = `<html><body><p>Content</p></body></html>`
    const httpsResult = analyzeGeo({ ...baseInput, url: 'https://example.com', html })
    const httpResult = analyzeGeo({ ...baseInput, url: 'http://example.com', html })
    expect(httpsResult.details.isHttps).toBe(true)
    expect(httpResult.details.isHttps).toBe(false)
  })

  it('flags HTTP as critical issue', () => {
    const html = `<html><body><p>Content</p></body></html>`
    const result = analyzeGeo({ ...baseInput, url: 'http://example.com', html })
    const issue = result.issues.find(i => i.id === 'not-https')
    expect(issue).toBeDefined()
    expect(issue!.severity).toBe('critical')
  })

  it('detects author info from schema', () => {
    const html = `
      <html>
        <head>
          <script type="application/ld+json">${JSON.stringify({
            "@type": "Article",
            "author": { "@type": "Person", "name": "John" }
          })}</script>
        </head>
        <body><p>Content</p></body>
      </html>
    `
    const result = analyzeGeo({ ...baseInput, html })
    expect(result.details.hasAuthorInfo).toBe(true)
  })

  it('detects author info from HTML elements', () => {
    const html = `
      <html><body>
        <span class="author">Jane Doe</span>
        <p>Article content here.</p>
      </body></html>
    `
    const result = analyzeGeo({ ...baseInput, html })
    expect(result.details.hasAuthorInfo).toBe(true)
  })

  it('flags missing author info as warning', () => {
    const html = `<html><body><p>Content without author</p></body></html>`
    const result = analyzeGeo({ ...baseInput, html })
    const issue = result.issues.find(i => i.id === 'missing-author')
    expect(issue).toBeDefined()
    expect(issue!.severity).toBe('warning')
  })

  it('detects published date from schema', () => {
    const html = `
      <html>
        <head>
          <script type="application/ld+json">${JSON.stringify({
            "@type": "Article",
            "datePublished": "2024-01-15"
          })}</script>
        </head>
        <body><p>Content</p></body>
      </html>
    `
    const result = analyzeGeo({ ...baseInput, html })
    expect(result.details.hasDatePublished).toBe(true)
  })

  it('detects about page link', () => {
    const html = `
      <html><body>
        <a href="/about">About Us</a>
        <p>Content</p>
      </body></html>
    `
    const result = analyzeGeo({ ...baseInput, html })
    expect(result.details.hasAboutPage).toBe(true)
  })

  it('counts external citations', () => {
    const html = `
      <html><body>
        <a href="https://example.com/internal">Internal</a>
        <a href="https://other.com/page">External 1</a>
        <a href="https://another.org/page">External 2</a>
      </body></html>
    `
    const result = analyzeGeo({ ...baseInput, html })
    expect(result.details.externalCitationsCount).toBe(2)
  })

  it('returns score between 0 and 100', () => {
    const html = `<html><body><p>Minimal.</p></body></html>`
    const result = analyzeGeo({ ...baseInput, url: 'http://example.com', html })
    expect(result.score).toBeGreaterThanOrEqual(0)
    expect(result.score).toBeLessThanOrEqual(100)
  })
})
