# WCAG Crawler - Cloud Edition

G5's Axe-core wrapper reborn as a Cloud Run.

## Getting Started

## Usage

`GET /` Are you listening?

`POST /` Can you Audit?

### Sample Body

``` json
{
  "config": {
    "args": ["--no-sandbox"],
    "headless": false,
    "ignoreHTTPSErrors": true,
    "defaultViewport": { "width": 375, "height": 667, "isMobile": true }
  },
  "pages": [
    "https://www.integratedseniorlifestyles.com/senior-living/ok/oklahoma-city/town-village/"
  ],
  "includeWcag21aa": true
}
```

- `config` is a regular [Puppeteer launch options object](https://github.com/puppeteer/puppeteer/blob/v8.0.0/docs/api.md#puppeteerlaunchoptions).
- `pages` is an array of website URLs. This tool does not include link discovery or understand sitemaps.
- `includeWcag21aa` is a boolean for whether to include WCAG 2.1 AA as opposed to WCAG 2.1 A. All audits include WCAG 2 and 2.1 as well as Accessibility Best Practices.
 
## Deployment

## References
