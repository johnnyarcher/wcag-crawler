import { AxePuppeteer } from '@axe-core/puppeteer'
import puppeteer from 'puppeteer'

const passCounts = {
  critical: 0,
  serious: 0,
  moderate: 0,
  minor: 0
}

const summary = {
  passes: {},
  violations: {}
}

export class Audit {
  constructor (params) {
    this.axeConfig = config
    this.pages = params.pages
    this.auditedPages = []
    this.violations = []
    this.axeVersion = null
    this.page = null
    this.browser = null
    this.includeWcag21aa = params.includeWcag21aa
    this.passCounts = passCounts
    this.summary = summary
  }


  /**
   * Boots new pupeteer browser
   * @memberof Audit
   */
   async bootBrowser () {
    this.browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-gpu'],
      ignoreHTTPSErrors: true,
      defaultViewport: {
        width: 375,
        height: 667,
        isMobile: true
      }
    })
  }

  /**
   * Opens a new page in the pupeteer browser
   * @memberof Audit
   */
  async newPage () {
    if (this.browser) {
      this.page = await this.browser.newPage()
      this.page.on('error', err => console.log({ err, page: this.page }))
    }
  }

  /**
   * Changes the url of the pupeteer page
   * @param {*} url
   * @memberof Audit
   */
  changeUrl (url) {
    return this.page.goto(url, { timeout: 300000, waitUntil: 'networkidle0' })
  }

  /**
   * Closes the puppeteer browser
   * @memberof Audit
   */
  closePage () {
    return this.page.close()
  }

  /**
   * Closes the pupeteer page
   * @memberof Audit
   */
  closeBrowser () {
    return this.browser.close()
  }

  async run () {
    await this.bootBrowser()
    await this.newPage()
    await this.page.setBypassCSP(true)
    console.time('Audit Duration')
    while (this.pages.length > 0) {
      const url = this.pages.pop()
      console.log(`Navigating to ${url}`)
      await this.changeUrl(url)
      console.log(`Auditing ${url}`)
      await this.auditPage()
      this.auditedPages.push(url)
    }
    await this.closePage()
    await this.closeBrowser()
    console.timeEnd('Audit Duration')
  }

  /**
   * Audits the current pupeteer page and adds the results to the class
   * @memberof Audit
   */
  async auditPage () {
    try {
      this.results = await new AxePuppeteer(this.page)
        .options({ iframes: false })
        .withTags(this.setTags())
        .analyze()
    } catch (error) {
      console.error(error)
    }
  }

  setTags () {
    return this.includeWcag21aa === true
      ? ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice']
      : ['wcag2a', 'wcag21a', 'best-practice']
  }

  addViolations (violations, page) {
    violations.forEach((violation) => {
      const { id, description } = violation
      violation.nodes.forEach((node) => {
        this.violations.push({
          element: id,
          impact: node.impact,
          page,
          description,
          html: node.html,
          target: node.target[0],
          failureSummary: node.failureSummary
        })
        this.addSummary(violation, 'violations')
      })
    })
  }

  addPassCounts (passes) {
    passes.forEach((pass) => {
      if (userImpact[pass.id]) {
        this.passCounts[userImpact[pass.id]]++
      }
      this.addSummary(pass, 'passes')
    })
  }

  addSummary (set, objectKey) {
    if (!this.summary[objectKey][set.id]) {
      this.summary[objectKey][set.id] = 0
    }
    this.summary[objectKey][set.id]++
  }

  set results (auditResults) {
    this.axeVersion = auditResults.testEngine.version
    this.addViolations(auditResults.violations, auditResults.url)
    this.addPassCounts(auditResults.passes)
  }

  get results () {
    return {
      axeVersion: this.axeVersion,
      violations: this.violations,
      passCounts: this.passCounts,
      auditedPages: this.auditedPages,
      summary: this.summary
    }
  }
}
