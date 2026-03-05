import { analyzeAeo } from './aeo-analyzer'

const baseInput = { url: 'https://example.com', responseTimeMs: 300 }

describe('analyzeAeo', () => {
  it('returns high score for page with FAQ schema and question headings', () => {
    const html = `
      <html>
        <head>
          <script type="application/ld+json">${JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [{ "@type": "Question", "name": "What is SEO?" }]
          })}</script>
        </head>
        <body>
          <h2>What is SEO?</h2>
          <p>SEO stands for Search Engine Optimization. It is the practice of optimizing websites to rank higher in search results.</p>
          <h2>How does AEO work?</h2>
          <p>AEO focuses on optimizing content to appear in answer boxes and featured snippets on search engines.</p>
          <ul><li>Item 1</li><li>Item 2</li></ul>
          <table><tr><td>Data</td></tr></table>
        </body>
      </html>
    `
    const result = analyzeAeo({ ...baseInput, html })
    expect(result.score).toBeGreaterThanOrEqual(75)
    expect(result.details.hasFaqSchema).toBe(true)
  })

  it('flags missing FAQ schema as warning', () => {
    const html = `<html><body><h2>What is SEO?</h2><p>Short answer.</p></body></html>`
    const result = analyzeAeo({ ...baseInput, html })
    const issue = result.issues.find(i => i.id === 'no-faq-schema')
    expect(issue).toBeDefined()
    expect(issue!.severity).toBe('warning')
  })

  it('detects question-form headings correctly', () => {
    const html = `
      <html><body>
        <h2>What is GEO?</h2>
        <h3>How do I improve page speed?</h3>
        <h2>Why is mobile optimization important?</h2>
        <h3>Regular heading</h3>
      </body></html>
    `
    const result = analyzeAeo({ ...baseInput, html })
    expect(result.details.questionHeadingsCount).toBe(3)
  })

  it('detects HowTo schema', () => {
    const html = `
      <html>
        <head>
          <script type="application/ld+json">${JSON.stringify({
            "@context": "https://schema.org",
            "@type": "HowTo",
            "name": "How to improve SEO"
          })}</script>
        </head>
        <body><p>Content here</p></body>
      </html>
    `
    const result = analyzeAeo({ ...baseInput, html })
    expect(result.details.hasHowToSchema).toBe(true)
  })

  it('detects direct answer paragraph (40-60 words)', () => {
    const shortAnswer = 'SEO is the practice of optimizing websites to rank higher in search engine results pages by improving content quality, technical structure, and obtaining quality backlinks from authoritative websites.'
    const html = `<html><body><p>${shortAnswer}</p></body></html>`
    const result = analyzeAeo({ ...baseInput, html })
    expect(result.details.hasDirectAnswerParagraph).toBe(true)
  })

  it('flags no question headings as warning', () => {
    const html = `<html><body><h2>About us</h2><h3>Our team</h3></body></html>`
    const result = analyzeAeo({ ...baseInput, html })
    const issue = result.issues.find(i => i.id === 'no-question-headings')
    expect(issue).toBeDefined()
  })

  it('detects list and table content', () => {
    const html = `
      <html><body>
        <ul><li>Item</li></ul>
        <table><tr><td>Cell</td></tr></table>
      </body></html>
    `
    const result = analyzeAeo({ ...baseInput, html })
    expect(result.details.hasListContent).toBe(true)
    expect(result.details.hasTableContent).toBe(true)
  })

  it('returns score between 0 and 100', () => {
    const html = `<html><body><p>Minimal page.</p></body></html>`
    const result = analyzeAeo({ ...baseInput, html })
    expect(result.score).toBeGreaterThanOrEqual(0)
    expect(result.score).toBeLessThanOrEqual(100)
  })
})
