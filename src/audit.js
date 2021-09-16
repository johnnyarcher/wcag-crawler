const { AxePuppeteer, loadPage } = require('@axe-core/puppeteer')
const axios = require('axios')
const puppeteer = require('puppeteer')
if (process.env.NODE_ENV !== 'production') require('colors')
const userImpact = require('./user-impact')

const blockedResourceTypes = [
  'texttrack',
  'object',
  'beacon',
  'csp_report'
]

const skippedResources = [
  'quantserve',
  'adzerk',
  'doubleclick',
  'adition',
  'exelator',
  'sharethrough',
  'cdn.api.twitter',
  'google-analytics',
  'googletagmanager',
  'google',
  'fontawesome',
  'facebook',
  'analytics',
  'optimizely',
  'clicktale',
  'mixpanel',
  'zedo',
  'clicksor',
  'tiqcdn',
  'show.tours',
  'boomchatweb',
  'tourmkr'
]

const config = {
  args: [
    '--no-sandbox',
    '--disable-gpu'
  ],
  ignoreHTTPSErrors: true,
  defaultViewport: { width: 375, height: 667, isMobile: true },
  timeout: 100000,
  pause: 4000,
  waitUntil: 'networkidle2'
}

module.exports = class Audit {
  constructor (params) {
    this.url = params.url
    this.config = params.config ? params.config : config
    this.auditedPages = []
    this.skippedPages = []
    this.violations = []
    this.axeVersion = null
    this.page = null
    this.browser = null
    this.includeWcag21aa = params.includeWcag21aa
    this.passCounts = {
      critical: 0,
      serious: 0,
      moderate: 0,
      minor: 0
    }
    this.summary = {
      passes: {},
      violations: {}
    }
    this.clientURN = params.clientURN
    this.locationUrn = params.locationUrn
    this.id = params.id
    this.webhookUrl = params.webhookUrl
  }

  /**
   * Boots new Puppeteer browser
   * @memberof Audit
   */
   async bootBrowser () {
    this.browser = await puppeteer.launch(this.config)
  }

  /**
   * Closes the Puppeteer page/tab
   * @memberof Audit
   */
  closeBrowser () {
    return this.browser.close()
  }

  /**
   * Orchestrates the whole thing.
   * @param {Boolean} send 
   */
  async run () {
    try {
      await this.bootBrowser()
      const axeBuilder = await loadPage(this.browser, this.url)
      this.results = await axeBuilder
        .options({ iframes: false })
        .disableFrame('iframe')
        .withTags(this.setTags())
        .analyze()
      this.auditedPages.push(this.url)
    } catch (error) {
      throw new Error(error)
    }
    await this.closeBrowser()
    console.log('FINISHED'.green.bold)
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
   * @param {Object} auditResults
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
      skippedPages: this.skippedPages,
      summary: this.summary
    }
  }
}
