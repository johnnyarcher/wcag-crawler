const { AxePuppeteer } = require('@axe-core/puppeteer')
const puppeteer = require('puppeteer')
const userImpact = require('./user-impact')

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

const config = {
  args: ['--no-sandbox', '--disable-gpu'],
  ignoreHTTPSErrors: true,
  defaultViewport: { width: 375, height: 667, isMobile: true },
  timeout: 300000,
  pause: 4000,
  waitUntil: 'networkidle0'
}

module.exports = class Audit {
  constructor (params) {
    this.config = params.config ? params.config : config
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
   * Boots new Puppeteer browser
   * @memberof Audit
   */
   async bootBrowser () {
    this.browser = await puppeteer.launch(this.config)
  }

  /**
   * Opens a new page in the Puppeteer browser
   * @memberof Audit
   */
  async newPage () {
    if (this.browser) {
      this.page = await this.browser.newPage()
      this.page.on('error', err => console.log({ err, page: this.page }))
    }
  }

  /**
   * Changes the url of the Puppeteer page
   * @param {*} url
   * @memberof Audit
   */
  changeUrl (url) {
    const { timeout, waitUntil } = this.config
    return this.page.goto(url, { timeout, waitUntil })
  }

  /**
   * Closes the Puppeteer browser
   * @memberof Audit
   */
  closePage () {
    return this.page.close()
  }

  /**
   * Closes the Puppeteer page
   * @memberof Audit
   */
  closeBrowser () {
    return this.browser.close()
  }

  /**
   * For inserting a delay to help with timing events
   * @memberof Audit
   * @param {Number} time ms
   */
  delay (time) {
    return new Promise((resolve) => {
      setTimeout(resolve, time)
    })
  }

  async run () {
    await this.bootBrowser()
    await this.newPage()
    await this.page.setBypassCSP(true)
    // console.time('Audit Duration')
    while (this.pages.length > 0) {
      const url = this.pages.pop()
      // console.log(`Navigating to ${url}`)
      await this.changeUrl(url)
      // console.log(`Auditing ${url}`)
      await this.auditPage()
      this.auditedPages.push(url)
    }
    await this.closePage()
    await this.closeBrowser()
    // console.timeEnd('Audit Duration')
  }

  /**
   * Audits the current pupeteer page and adds the results to the class
   * @memberof Audit
   */
  async auditPage () {
    try {
      await this.delay(this.config.pause)
      this.results = await new AxePuppeteer(this.page)
        .options({ iframes: false })
        .withTags(this.setTags())
        .analyze()
    } catch (error) {
      console.error(error)
    }
  }

  /**
   * @memberof Audit
   * @returns 
   */
  setTags () {
    return this.includeWcag21aa === true
      ? ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice']
      : ['wcag2a', 'wcag21a', 'best-practice']
  }

  /**
   * @memberof Audit
   * @param {Array} violations 
   * @param {String} page 
   */
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

  /**
   * @memberof Audit
   * @param {Array} passes 
   */
  addPassCounts (passes) {
    passes.forEach((pass) => {
      if (userImpact[pass.id]) {
        this.passCounts[userImpact[pass.id]]++
      }
      this.addSummary(pass, 'passes')
    })
  }

  /**
   * @memberof Audit
   * @param {Object} set 
   * @param {String} objectKey 
   */
  addSummary (set, objectKey) {
    if (!this.summary[objectKey][set.id]) {
      this.summary[objectKey][set.id] = 0
    }
    this.summary[objectKey][set.id]++
  }

  /**
   * @memberof Audit
   */
  set results (auditResults) {
    this.axeVersion = auditResults.testEngine.version
    this.addViolations(auditResults.violations, auditResults.url)
    this.addPassCounts(auditResults.passes)
  }

  /**
   * @memberof Audit
   */
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
