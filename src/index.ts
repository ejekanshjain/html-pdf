import handlebars from 'handlebars'
import inlineCss from 'inline-css'
import puppeteer, { PDFOptions, PuppeteerLaunchOptions } from 'puppeteer'

type Data = {
  url?: string
  content?: string
}

export const generatePdf = async (
  data: Data,
  pdfOptions?: PDFOptions,
  puppeteerOptions?: PuppeteerLaunchOptions
) => {
  const browserOptions: PuppeteerLaunchOptions = {
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    headless: false,
    ...puppeteerOptions
  }

  const browser = await puppeteer.launch(browserOptions)
  const page = await browser.newPage()

  try {
    if (data.content) {
      const generatedHtml = await inlineCss(data.content, { url: '/' })
      const template = handlebars.compile(generatedHtml, { strict: true })
      const html = template({})

      await page.setContent(html, {
        waitUntil: 'networkidle0'
      })
    } else if (data.url) {
      await page.goto(data.url, {
        waitUntil: ['load', 'networkidle0']
      })
    } else {
      throw new Error('You must provide content or url')
    }

    const buffer = await page.pdf(pdfOptions)
    await browser.close()

    return buffer
  } catch (error) {
    await browser.close()
    throw error
  }
}

export const generatePdfs = async (
  arr: Data[],
  pdfOptions?: PDFOptions,
  puppeteerOptions?: PuppeteerLaunchOptions
) => {
  const pdfBuffers: Buffer[] = []

  for (const a of arr) {
    const pdfBuffer = await generatePdf(a, pdfOptions, puppeteerOptions)
    pdfBuffers.push(pdfBuffer)
  }

  return pdfBuffers
}
