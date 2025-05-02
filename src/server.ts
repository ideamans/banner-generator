import { getProperty, setProperty } from 'dot-prop'
import Fastify from 'fastify'
import { merge } from 'ts-deepmerge'

import { BannerTypeA } from './banners/type-a.js'
import { base64ToText, brotliToBase64 } from './brotli.js'
import { Dependency } from './dependency.js'

const dependency = new Dependency()

function setPropertyAsSameType<T>(obj: T, ref: T, key: string, value: string): void {
  const refValue = getProperty(ref, key)
  if (typeof refValue === 'number') {
    setProperty(obj, key, Number(value))
  } else if (typeof refValue === 'boolean') {
    setProperty(obj, key, ['', '0', 'no', 'false'].includes(value.toLowerCase()) ? false : true)
  } else if (typeof refValue === 'string') {
    setProperty(obj, key, value)
  }
}

const app = Fastify({ logger: dependency.loggerOptions() })

app.get<{
  Querystring: {
    merge?: string
    text0?: string
    text0width?: string
    text1?: string
    text1width?: string
    text2?: string
    text2width?: string
  } & { [key: string]: string }
  Reply: { 200: Buffer }
}>('/banners/type-a', async (req, res) => {
  const spec = BannerTypeA.defaultBannerSpec()
  const defaultSpec = BannerTypeA.defaultBannerSpec()

  const b = await brotliToBase64(
    'bgUrl=https%3A%2F%2Fnotes.ideamans.com%2Fogp-background.jpg&text0=ideaman%27s+Notes&text0width=60%25&text1=Mastra+%2B+ローカルLLM経由でMCPする&texts%5B1%5D.fontSize=5%25&texts%5B1%5D.minWidth=60%25&texts%5B1%5D.maxWidth=90%25&text2=2025-05-01+%40miyanaga&text%5B2%5D.fontSize=3%25&text%5B2%5D.minWidth=30%25&text%5B2%5D.maxWidth=40%25'
  )
  console.log(encodeURIComponent(b))

  // Parse _b as base64 brotli
  // XのカードがURLが長いまたは複雑だと対応しないようなのでBrotliで圧縮した値をパースする仕組みを導入
  if (req.query._b) {
    try {
      const qs = await base64ToText(req.query._b)
      const query = new URLSearchParams(qs)

      // Merge zip query parameters with existing query
      for (const [key, value] of query.entries()) {
        req.query[key] = value
      }
    } catch (err) {
      dependency.logger?.warn({ err }, `Failed to parse _b as base64 brotli: ${err.message}`)
    }

    delete req.query._b
  }

  // Merge key value
  for (const [key, value] of Object.entries(req.query)) {
    setPropertyAsSameType(spec, defaultSpec, key, value)
  }

  // Merge JSON object
  if (req.query.merge) {
    const merging = JSON.parse(req.query.merge)
    merge(spec, merging)
  }

  // Sugar syntax
  if (req.query.text0) {
    spec.texts[0].content = req.query.text0
  }
  if (req.query.text0width) {
    spec.texts[0].maxWidth = spec.texts[0].minWidth = req.query.text0width
  }
  if (req.query.text1) {
    spec.texts[1].content = req.query.text1
  }
  if (req.query.text1width) {
    spec.texts[1].maxWidth = spec.texts[1].minWidth = req.query.text1width
  }
  if (req.query.text2) {
    spec.texts[2].content = req.query.text2
  }
  if (req.query.text2width) {
    spec.texts[2].maxWidth = spec.texts[2].minWidth = req.query.text2width
  }

  dependency.logger?.trace({ spec }, `Banner Type A Spec`)

  const sharp = await BannerTypeA.render(spec, dependency)
  const buffer = await sharp.jpeg({ quality: 85 }).toBuffer()

  res.type('image/jpeg').code(200).send(buffer)
})

const port = Number(process.env.PORT || 3000)
const host = process.env.HOST || '0.0.0.0'

app.listen({ host, port }, (err) => {
  if (err) {
    dependency.logger?.fatal({ err }, `Failed to start the server: ${err.message}`)
    process.exit(1)
  }
})
