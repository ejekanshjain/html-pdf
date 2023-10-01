# html-pdf

Install this package
```
npm install @ejekanshjain/html-pdf
```

Generate pdf
```
import { writeFile } from 'fs/promises'
import { generatePdf } from '@ejekanshjain/html-pdf'

const html = '<html><body><h1>Hello, World</h1></body></html>'

const pdfBuffer = await generatePdf({
  content: html
})

await writeFile('test.pdf', pdfBuffer)

```
