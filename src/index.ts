import handlebars from 'handlebars'
import inlineCss from 'inline-css'
import puppeteer, {
  Browser,
  ConnectOptions,
  PDFOptions,
  LaunchOptions
} from 'puppeteer'

type Data = {
  url?: string
  content?: string
}

const browserCache = new Map<string, Browser>()

const getCacheKey = (launch?: LaunchOptions, connect?: ConnectOptions) => {
  return `${connect ? 'connect' : 'launch'}:${JSON.stringify({
    launch,
    connect
  })}`
}

const getBrowserInstance = async (
  launchOptions?: LaunchOptions,
  connectOptions?: ConnectOptions
): Promise<Browser> => {
  const key = getCacheKey(launchOptions, connectOptions)
  const cached = browserCache.get(key)
  if (cached) return cached

  const browser = connectOptions
    ? await puppeteer.connect(connectOptions)
    : await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        ...launchOptions
      })

  browserCache.set(key, browser)
  return browser
}

export const generatePdf = async (
  data: Data,
  pdfOptions?: PDFOptions,
  puppeteerLaunchOptions?: LaunchOptions,
  puppeteerConnectOptions?: ConnectOptions,
  emulateMediaType?: 'screen' | 'print'
) => {
  const browser = await getBrowserInstance(
    puppeteerLaunchOptions,
    puppeteerConnectOptions
  )
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

    if (emulateMediaType) {
      await page.emulateMediaType(emulateMediaType)
    }

    const uint8Array = await page.pdf(pdfOptions)
    const buffer = Buffer.from(uint8Array)

    return buffer
  } catch (error) {
    throw error
  } finally {
    await page.close()
  }
}

export const generatePdfs = async (
  arr: Data[],
  pdfOptions?: PDFOptions,
  puppeteerOptions?: LaunchOptions
) => {
  const pdfBuffers: Buffer[] = []

  for (const a of arr) {
    const pdfBuffer = await generatePdf(a, pdfOptions, puppeteerOptions)
    pdfBuffers.push(pdfBuffer)
  }

  return pdfBuffers
}
