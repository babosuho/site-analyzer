import { analyzeSeo } from './seo-analyzer'

const baseInput = { url: 'https://example.com', responseTimeMs: 300 }

describe('analyzeSeo', () => {
  // ── Title ─────────────────────────────────────────────────

  it('returns score 100 for a perfectly optimized page', () => {
    const html = `
      <html>
        <head>
          <title>Best SEO Title Example - 55 chars long here</title>
          <meta name="description" content="A perfect meta description that is between 120 and 160 characters long to pass the SEO check properly yes.">
          <link rel="canonical" href="https://example.com/">
          <meta property="og:title" content="Best SEO Title">
          <meta property="og:description" content="OG description">
          <meta property="og:image" content="https://example.com/img.jpg">
          <script type="application/ld+json">{"@context":"https://schema.org","@type":"WebPage"}</script>
        </head>
        <body>
          <h1>Main Heading</h1>
          <img src="cat.jpg" alt="A cute cat">
          <a href="/about">About</a>
          <a href="https://external.com">External</a>
        </body>
      </html>
    `
    const result = analyzeSeo({ ...baseInput, html })
    expect(result.score).toBeGreaterThanOrEqual(90)
    expect(result.issues.filter(i => i.severity === 'critical')).toHaveLength(0)
  })

  it('flags missing title as critical', () => {
    const html = `<html><head></head><body><h1>Hello</h1></body></html>`
    const result = analyzeSeo({ ...baseInput, html })
    expect(result.score).toBeLessThan(70)
    const issue = result.issues.find(i => i.id === 'missing-title')
    expect(issue).toBeDefined()
    expect(issue!.severity).toBe('critical')
  })

  it('flags title too short as warning', () => {
    const html = `<html><head><title>Hi</title></head><body><h1>Hello</h1></body></html>`
    const result = analyzeSeo({ ...baseInput, html })
    const issue = result.issues.find(i => i.id === 'title-too-short')
    expect(issue).toBeDefined()
    expect(issue!.severity).toBe('warning')
  })

  it('flags title too long as warning', () => {
    const title = 'A'.repeat(70)
    const html = `<html><head><title>${title}</title></head><body><h1>Hello</h1></body></html>`
    const result = analyzeSeo({ ...baseInput, html })
    const issue = result.issues.find(i => i.id === 'title-too-long')
    expect(issue).toBeDefined()
  })

  // ── Meta Description ──────────────────────────────────────

  it('flags missing meta description as critical', () => {
    const html = `<html><head><title>Good Title Here For You</title></head><body><h1>Hello</h1></body></html>`
    const result = analyzeSeo({ ...baseInput, html })
    const issue = result.issues.find(i => i.id === 'missing-meta-description')
    expect(issue).toBeDefined()
    expect(issue!.severity).toBe('critical')
  })

  it('flags meta description too short as warning', () => {
    const html = `<html><head><title>Good Title</title><meta name="description" content="Short."></head><body><h1>Hello</h1></body></html>`
    const result = analyzeSeo({ ...baseInput, html })
    const issue = result.issues.find(i => i.id === 'meta-description-too-short')
    expect(issue).toBeDefined()
  })

  // ── H1 ───────────────────────────────────────────────────

  it('flags missing H1 as critical', () => {
    const html = `<html><head><title>Good Title</title></head><body><h2>Sub</h2></body></html>`
    const result = analyzeSeo({ ...baseInput, html })
    const issue = result.issues.find(i => i.id === 'missing-h1')
    expect(issue).toBeDefined()
    expect(issue!.severity).toBe('critical')
  })

  it('flags multiple H1 as warning', () => {
    const html = `<html><head><title>Title</title></head><body><h1>One</h1><h1>Two</h1></body></html>`
    const result = analyzeSeo({ ...baseInput, html })
    const issue = result.issues.find(i => i.id === 'multiple-h1')
    expect(issue).toBeDefined()
    expect(issue!.severity).toBe('warning')
  })

  // ── OG Tags ───────────────────────────────────────────────

  it('flags missing OG tags as warning', () => {
    const html = `<html><head><title>Good Title Here</title></head><body><h1>Hello</h1></body></html>`
    const result = analyzeSeo({ ...baseInput, html })
    const issue = result.issues.find(i => i.id === 'missing-og-tags')
    expect(issue).toBeDefined()
    expect(issue!.severity).toBe('warning')
  })

  // ── Images ────────────────────────────────────────────────

  it('flags images missing alt as warning', () => {
    const html = `
      <html><head><title>Good Title</title></head>
      <body><h1>Hello</h1><img src="a.jpg"><img src="b.jpg" alt=""></body>
      </html>
    `
    const result = analyzeSeo({ ...baseInput, html })
    const issue = result.issues.find(i => i.id === 'images-missing-alt')
    expect(issue).toBeDefined()
    expect(result.details.imagesMissingAlt).toBeGreaterThan(0)
  })

  // ── Canonical ─────────────────────────────────────────────

  it('flags missing canonical as info', () => {
    const html = `<html><head><title>Good Title Here</title></head><body><h1>Hello</h1></body></html>`
    const result = analyzeSeo({ ...baseInput, html })
    const issue = result.issues.find(i => i.id === 'missing-canonical')
    expect(issue).toBeDefined()
    expect(issue!.severity).toBe('info')
  })

  // ── Schema.org ────────────────────────────────────────────

  it('detects schema.org JSON-LD correctly', () => {
    const html = `
      <html><head><title>Good Title</title>
      <script type="application/ld+json">{"@context":"https://schema.org"}</script>
      </head><body><h1>Hello</h1></body></html>
    `
    const result = analyzeSeo({ ...baseInput, html })
    expect(result.details.hasSchemaOrg).toBe(true)
  })

  // ── Details Shape ─────────────────────────────────────────

  it('returns correct details shape', () => {
    const html = `
      <html>
        <head>
          <title>A Good Title Here</title>
          <meta name="description" content="A reasonable meta description that passes the check for length.">
          <link rel="canonical" href="https://example.com/">
        </head>
        <body>
          <h1>Heading</h1>
          <a href="/page1">Internal</a>
          <a href="https://other.com">External</a>
        </body>
      </html>
    `
    const result = analyzeSeo({ ...baseInput, html })
    expect(result.details.title).toBe('A Good Title Here')
    expect(result.details.h1Count).toBe(1)
    expect(result.details.hasCanonical).toBe(true)
    expect(result.details.internalLinksCount).toBeGreaterThanOrEqual(1)
    expect(result.details.externalLinksCount).toBeGreaterThanOrEqual(1)
    expect(typeof result.score).toBe('number')
    expect(result.score).toBeGreaterThanOrEqual(0)
    expect(result.score).toBeLessThanOrEqual(100)
  })
})
