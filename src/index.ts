import handlebars from 'handlebars'
import inlineCss from 'inline-css'
import puppeteer, {
  type PDFOptions,
  type PuppeteerLaunchOptions
} from 'puppeteer'

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
    headless: 'new',
    ...puppeteerOptions
  }

  const browser = await puppeteer.launch(browserOptions)

  const page = await browser.newPage()

  if (data.content) {
    const generatedHtml = await inlineCss(data.content, { url: '/' })
    const template = handlebars.compile(generatedHtml, { strict: true })
    const html = template({})

    await page.setContent(html, {
      waitUntil: 'networkidle0'
    })
  } else if (data.url)
    await page.goto(data.url, {
      waitUntil: ['load', 'networkidle0']
    })
  else throw new Error('You must provide a content or url')

  const buffer = await page.pdf(pdfOptions)

  await browser.close()

  return buffer
}
