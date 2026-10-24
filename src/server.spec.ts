import { ChildProcess, spawn } from 'child_process'
import Fsp from 'fs/promises'
import Http from 'http'
import { AddressInfo } from 'net'
import Os from 'os'
import Path from 'path'

import test from 'ava'
import Sharp from 'sharp'
import { psnr } from 'sharp-iqa'

import { BannerTypeA } from './banners/type-a.js'

const bgPath = Path.join(import.meta.dirname, '../testdata/type-a/bg.jpg')

let bgServer: Http.Server
let bgBase = ''
let bgRequests = 0
let server: ChildProcess
let base = ''
let cacheDir = ''

async function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const s = Http.createServer()
    s.listen(0, '127.0.0.1', () => {
      const port = (s.address() as AddressInfo).port
      s.close(() => resolve(port))
    })
    s.on('error', reject)
  })
}

async function waitForServer(url: string, timeoutMs = 20000) {
  const started = Date.now()
  for (;;) {
    try {
      await fetch(url)
      return
    } catch (err) {
      if (Date.now() - started > timeoutMs) throw err
      await new Promise((r) => setTimeout(r, 100))
    }
  }
}

function bannerUrl(params: Record<string, string>): string {
  const u = new URL(`${base}/banners/type-a`)
  for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v)
  return u.toString()
}

async function getBanner(params: Record<string, string>) {
  const res = await fetch(bannerUrl(params))
  const buffer = Buffer.from(await res.arrayBuffer())
  return { res, buffer }
}

async function pixelAt(buffer: Buffer, x: number, y: number): Promise<number[]> {
  const { data, info } = await Sharp(buffer).raw().toBuffer({ resolveWithObject: true })
  const offset = (y * info.width + x) * info.channels
  return Array.from(data.subarray(offset, offset + 3))
}

function near(actual: number[], expected: number[], tolerance = 4): boolean {
  return actual.every((v, i) => Math.abs(v - expected[i]) <= tolerance)
}

test.before(async () => {
  const bg = await Fsp.readFile(bgPath)
  bgServer = Http.createServer((req, res) => {
    bgRequests++
    if (req.url?.startsWith('/bg.jpg')) {
      res.writeHead(200, { 'content-type': 'image/jpeg' })
      res.end(bg)
    } else if (req.url?.startsWith('/large.jpg')) {
      res.writeHead(200, { 'content-type': 'image/jpeg' })
      res.end(Buffer.alloc(2 * 1024 * 1024))
    } else {
      res.writeHead(404)
      res.end('not found')
    }
  })
  await new Promise<void>((resolve) => bgServer.listen(0, '127.0.0.1', () => resolve()))
  bgBase = `http://127.0.0.1:${(bgServer.address() as AddressInfo).port}`

  cacheDir = await Fsp.mkdtemp(Path.join(Os.tmpdir(), 'banner-generator-test-'))
  const port = await freePort()
  base = `http://127.0.0.1:${port}`
  server = spawn(process.execPath, [Path.join(import.meta.dirname, 'server.js')], {
    env: {
      ...process.env,
      PORT: String(port),
      HOST: '127.0.0.1',
      LOG_LEVEL: 'silent',
      IMAGE_CACHE_DIR: cacheDir,
    },
    stdio: 'inherit',
  })
  await waitForServer(base)
})

test.after.always(async () => {
  server?.kill()
  await new Promise<void>((resolve) => (bgServer ? bgServer.close(() => resolve()) : resolve()))
  if (cacheDir) await Fsp.rm(cacheDir, { recursive: true, force: true })
})

test.serial('GET /banners/type-a without params returns 1200x630 jpeg in bgColor #444', async (t) => {
  const { res, buffer } = await getBanner({})
  t.is(res.status, 200)
  t.is(res.headers.get('content-type'), 'image/jpeg')
  const meta = await Sharp(buffer).metadata()
  t.is(meta.format, 'jpeg')
  t.is(meta.width, 1200)
  t.is(meta.height, 630)
  t.true(near(await pixelAt(buffer, 0, 0), [0x44, 0x44, 0x44]))
})

test.serial('bgColor query parameter changes the background', async (t) => {
  const { res, buffer } = await getBanner({ bgColor: '#ff0000', text0: 'Hello' })
  t.is(res.status, 200)
  t.true(near(await pixelAt(buffer, 0, 0), [255, 0, 0], 8))
})

test.serial('invalid bgColor results in 500', async (t) => {
  const { res } = await getBanner({ bgColor: 'hsl(0, 100%, 50%)' })
  t.is(res.status, 500)
})

test.serial('bgUrl + sugar syntax equals direct rendering of the same spec', async (t) => {
  const bgUrl = `${bgBase}/bg.jpg?sugar`
  const { res, buffer } = await getBanner({
    bgUrl,
    text0: `ideaman's Notes`,
    text0width: '70%',
    text1: 'アイデアマンズ株式会社の研究ノート',
    text1width: '70%',
  })
  t.is(res.status, 200)
  const meta = await Sharp(buffer).metadata()
  t.is(meta.width, 1200)
  t.is(meta.height, 630)

  const spec = BannerTypeA.defaultBannerSpec()
  spec.bgUrl = bgUrl
  spec.texts[0].content = `ideaman's Notes`
  spec.texts[0].minWidth = spec.texts[0].maxWidth = '70%'
  spec.texts[1].content = 'アイデアマンズ株式会社の研究ノート'
  spec.texts[1].minWidth = spec.texts[1].maxWidth = '70%'
  const expected = await BannerTypeA.render(spec, { httpGetImage: async () => await Fsp.readFile(bgPath) })
  const value = await psnr(Sharp(buffer), Sharp(await expected.jpeg({ quality: 85 }).toBuffer()))
  t.true(value > 40, `PSNR ${value}`)
})

test.serial('key path parameters override the spec', async (t) => {
  const { res, buffer } = await getBanner({
    'texts[0].content': 'Key Path',
    'texts[0].fillColor': '#00ff00',
    bgColor: '#ffffff',
    overlayColor: '#00000080',
  })
  t.is(res.status, 200)

  const spec = BannerTypeA.defaultBannerSpec()
  spec.texts[0].content = 'Key Path'
  spec.texts[0].fillColor = '#00ff00'
  spec.overlayColor = '#00000080'
  spec.bgColor = '#ffffff'
  const expected = await BannerTypeA.render(spec, { httpGetImage: async () => Buffer.alloc(0) })
  const value = await psnr(Sharp(buffer), Sharp(await expected.jpeg({ quality: 85 }).toBuffer()))
  t.true(value > 40, `PSNR ${value}`)
  // 50% black overlay on white background
  t.true(near(await pixelAt(buffer, 0, 0), [127, 127, 127], 6))
})

// NOTE: This captures the CURRENT behavior. server.ts calls merge() from ts-deepmerge without using
// its return value, and merge() does not mutate the target, so the `merge` parameter has no effect.
// If that is fixed, update this test to expect the merged bgColor.
test.serial('merge parameter is currently ignored (known issue)', async (t) => {
  const { res, buffer } = await getBanner({ merge: JSON.stringify({ bgColor: '#ffffff' }) })
  t.is(res.status, 200)
  t.true(near(await pixelAt(buffer, 0, 0), [0x44, 0x44, 0x44]))
})

test.serial('invalid merge JSON results in 500', async (t) => {
  const { res } = await getBanner({ merge: '{not json' })
  t.is(res.status, 500)
})

test.serial('numeric key path values are converted to numbers', async (t) => {
  const a = await getBanner({ text0: 'Spacing', 'texts[0].letterSpacing': '0.5', 'texts[0].minWidth': '1%' })
  const b = await getBanner({ text0: 'Spacing', 'texts[0].minWidth': '1%' })
  t.is(a.res.status, 200)
  t.is(b.res.status, 200)
  t.false(a.buffer.equals(b.buffer))
})

test.serial('background image is fetched once and then cached', async (t) => {
  const bgUrl = `${bgBase}/bg.jpg?cache`
  const before = bgRequests
  const first = await getBanner({ bgUrl, text0: 'cache' })
  const second = await getBanner({ bgUrl, text0: 'cache' })
  t.is(first.res.status, 200)
  t.is(second.res.status, 200)
  t.is(bgRequests - before, 1)
  t.true(first.buffer.equals(second.buffer))
})

test.serial('missing background image propagates upstream 404', async (t) => {
  // Fastify uses the `status` of the axios error as the response status
  const { res } = await getBanner({ bgUrl: `${bgBase}/missing.jpg`, text0: 'x' })
  t.is(res.status, 404)
})

test.serial('too large background image results in 500', async (t) => {
  const { res } = await getBanner({ bgUrl: `${bgBase}/large.jpg`, text0: 'x' })
  t.is(res.status, 500)
})

test.serial('unknown route returns 404', async (t) => {
  const res = await fetch(`${base}/banners/type-z`)
  t.is(res.status, 404)
})
