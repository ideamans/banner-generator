import Fsp from 'fs/promises'
import Path from 'path'

import test from 'ava'
import Sharp from 'sharp'
import type * as SharpTypes from 'sharp'
import { psnr } from 'sharp-iqa'

import { BannerTypeA } from './type-a.js'

const targetPsnr = 44

export async function saveAsToBe(toBePath: string, asIsSharp: SharpTypes.Sharp) {
  const buffer = await asIsSharp.jpeg({ quality: 85 }).toBuffer()
  await Fsp.writeFile(toBePath, buffer)
}

export async function computePsnr(toBePath: string, asIsSharp: SharpTypes.Sharp): Promise<number> {
  const toBeSharp = Sharp(toBePath)
  return await psnr(toBeSharp, asIsSharp)
}

test('TypeA Banners - one text', async (t) => {
  const spec: BannerTypeA.BannerSpec = {
    bgUrl: 'https://notes.ideamans.com/ogp-background.jpg',
    bgColor: '#444',
    overlayColor: '',
    paddingTop: '15%',
    paddingBottom: '15%',
    lineGap: '5%',
    texts: [
      {
        content: `ideaman's Notes`,
        fontSize: '20%',
        fillColor: 'white',
        minWidth: '80%',
        maxWidth: '80%',
        letterSpacing: 0,
        fontFace: 'NotoSansJP-Black',
      },
    ],
  }

  const sharp = await BannerTypeA.render(spec, {
    httpGetImage: async (url: string) => {
      t.is(url, 'https://notes.ideamans.com/ogp-background.jpg')
      const buffer = await Fsp.readFile(Path.join(import.meta.dirname, '../../testdata/type-a/bg.jpg'))
      return buffer
    },
  })

  const toBePath = Path.join(import.meta.dirname, '../../testdata/type-a/one-text.jpg')
  // await saveAsToBe(toBePath, sharp)

  const psnrValue = await computePsnr(toBePath, sharp)
  t.true(psnrValue > targetPsnr, `PSNR expected over ${targetPsnr}, but got ${psnrValue}`)
})

test('TypeA Banners - two texts', async (t) => {
  const spec: BannerTypeA.BannerSpec = {
    bgUrl: 'https://notes.ideamans.com/ogp-background.jpg',
    bgColor: '#444',
    overlayColor: '',
    paddingTop: '15%',
    paddingBottom: '15%',
    lineGap: '5%',
    texts: [
      {
        content: `ideaman's Notes`,
        fontSize: '20%',
        fillColor: 'white',
        minWidth: '80%',
        maxWidth: '80%',
        letterSpacing: 0,
        fontFace: 'NotoSansJP-Black',
      },
      {
        content: `アイデアマンズ株式会社の研究ノート`,
        fontSize: '20%',
        fillColor: 'white',
        minWidth: '60%',
        maxWidth: '60%',
        letterSpacing: 0,
        fontFace: 'NotoSansJP-Medium',
      },
    ],
  }

  const sharp = await BannerTypeA.render(spec, {
    httpGetImage: async (url: string) => {
      t.is(url, 'https://notes.ideamans.com/ogp-background.jpg')
      const buffer = await Fsp.readFile(Path.join(import.meta.dirname, '../../testdata/type-a/bg.jpg'))
      return buffer
    },
  })

  const toBePath = Path.join(import.meta.dirname, '../../testdata/type-a/two-texts.jpg')
  // await saveAsToBe(toBePath, sharp)

  const psnrValue = await computePsnr(toBePath, sharp)
  t.true(psnrValue > targetPsnr, `PSNR expected over ${targetPsnr}, but got ${psnrValue}`)
})

test('TypeA Banners - three texts', async (t) => {
  const spec: BannerTypeA.BannerSpec = {
    bgUrl: 'https://notes.ideamans.com/ogp-background.jpg',
    bgColor: '#444',
    overlayColor: '',
    paddingTop: '15%',
    paddingBottom: '15%',
    lineGap: '5%',
    texts: [
      {
        content: `ideaman's Notes`,
        fontSize: '20%',
        fillColor: 'white',
        minWidth: '60%',
        maxWidth: '60%',
        letterSpacing: 0,
        fontFace: 'NotoSansJP-Black',
      },
      {
        content: `ブログ用のOGPバナーを自動生成するサーバー`,
        fontSize: '20%',
        fillColor: 'white',
        minWidth: '60%',
        maxWidth: '90%',
        letterSpacing: 0,
        fontFace: 'NotoSansJP-Bold',
      },
      {
        content: `2024-09-22 @miyanaga`,
        fontSize: '10%',
        fillColor: 'white',
        minWidth: '30%',
        maxWidth: '40%',
        letterSpacing: 0,
        fontFace: 'NotoSansJP-Medium',
      },
    ],
  }

  const sharp = await BannerTypeA.render(spec, {
    httpGetImage: async (url: string) => {
      t.is(url, 'https://notes.ideamans.com/ogp-background.jpg')
      const buffer = await Fsp.readFile(Path.join(import.meta.dirname, '../../testdata/type-a/bg.jpg'))
      return buffer
    },
  })

  const toBePath = Path.join(import.meta.dirname, '../../testdata/type-a/three-texts.jpg')
  // await saveAsToBe(toBePath, sharp)

  const psnrValue = await computePsnr(toBePath, sharp)
  t.true(psnrValue > targetPsnr, `PSNR expected over ${targetPsnr}, but got ${psnrValue}`)
})

async function pixelAt(sharp: SharpTypes.Sharp, x: number, y: number): Promise<number[]> {
  const { data, info } = await sharp.clone().raw().toBuffer({ resolveWithObject: true })
  const offset = (y * info.width + x) * info.channels
  return Array.from(data.subarray(offset, offset + 3))
}

function assertColorNear(
  t: { true: (v: boolean, m?: string) => void },
  actual: number[],
  expected: number[],
  tolerance = 3
) {
  const ok = actual.every((v, i) => Math.abs(v - expected[i]) <= tolerance)
  t.true(ok, `expected ${JSON.stringify(expected)} ±${tolerance}, but got ${JSON.stringify(actual)}`)
}

const noHttp = {
  httpGetImage: async (url: string): Promise<Buffer> => {
    throw new Error(`httpGetImage must not be called: ${url}`)
  },
}

const bgPath = Path.join(import.meta.dirname, '../../testdata/type-a/bg.jpg')

test('TypeA Banners - default spec', (t) => {
  const spec = BannerTypeA.defaultBannerSpec()
  t.is(spec.bgUrl, '')
  t.is(spec.bgColor, '#444')
  t.is(spec.overlayColor, '')
  t.is(spec.texts.length, 3)
  t.deepEqual(
    spec.texts.map((text) => text.fontFace),
    ['NotoSansJP-Black', 'NotoSansJP-Bold', 'NotoSansJP-Medium']
  )
  // returns a fresh object each time
  t.not(BannerTypeA.defaultBannerSpec(), spec)
})

test('TypeA Banners - bgColor default without bgUrl renders 1200x630 #444', async (t) => {
  const spec = BannerTypeA.defaultBannerSpec()
  const sharp = await BannerTypeA.render(spec, noHttp)
  const buffer = await sharp.clone().jpeg({ quality: 85 }).toBuffer()
  const meta = await Sharp(buffer).metadata()
  t.is(meta.format, 'jpeg')
  t.is(meta.width, 1200)
  t.is(meta.height, 630)
  assertColorNear(t, await pixelAt(sharp, 0, 0), [0x44, 0x44, 0x44])
  assertColorNear(t, await pixelAt(sharp, 600, 315), [0x44, 0x44, 0x44])
})

test('TypeA Banners - bgColor accepts various RGB notations', async (t) => {
  const cases: [string, number[]][] = [
    ['#ff0000', [255, 0, 0]],
    ['#0f0', [0, 255, 0]],
    ['rgb(10, 20, 30)', [10, 20, 30]],
    ['blue', [0, 0, 255]],
  ]
  for (const [bgColor, expected] of cases) {
    const spec = { ...BannerTypeA.defaultBannerSpec(), bgColor }
    const sharp = await BannerTypeA.render(spec, noHttp)
    assertColorNear(t, await pixelAt(sharp, 10, 10), expected)
  }
})

test('TypeA Banners - non RGB bgColor throws', async (t) => {
  const spec = { ...BannerTypeA.defaultBannerSpec(), bgColor: 'hsl(0, 100%, 50%)' }
  await t.throwsAsync(() => BannerTypeA.render(spec, noHttp), { message: 'bgColor must be RGB color space' })
})

test('TypeA Banners - bgColor with three texts matches golden image', async (t) => {
  const spec = BannerTypeA.defaultBannerSpec()
  spec.bgColor = '#1e3a5f'
  spec.texts[0].content = `ideaman's Notes`
  spec.texts[1].content = `背景色だけで生成するバナー`
  spec.texts[2].content = `2026-10-24 @miyanaga`
  const sharp = await BannerTypeA.render(spec, noHttp)

  const toBePath = Path.join(import.meta.dirname, '../../testdata/type-a/bg-color.jpg')
  // await saveAsToBe(toBePath, sharp)

  // Flat color backgrounds show more JPEG ringing around glyphs, so the threshold is a bit lower
  const psnrValue = await computePsnr(toBePath, sharp)
  t.true(psnrValue > 40, `PSNR expected over 40, but got ${psnrValue}`)
  // corner keeps the bgColor, center has white text pixels somewhere
  assertColorNear(t, await pixelAt(sharp, 0, 0), [0x1e, 0x3a, 0x5f])
})

test('TypeA Banners - bgUrl image dimensions are kept and bgColor is ignored', async (t) => {
  const urls: string[] = []
  const spec = { ...BannerTypeA.defaultBannerSpec(), bgUrl: 'https://example.com/bg.jpg', bgColor: '#ff0000' }
  const sharp = await BannerTypeA.render(spec, {
    httpGetImage: async (url: string) => {
      urls.push(url)
      return await Fsp.readFile(bgPath)
    },
  })
  t.deepEqual(urls, ['https://example.com/bg.jpg'])
  const buffer = await sharp.clone().jpeg({ quality: 85 }).toBuffer()
  const meta = await Sharp(buffer).metadata()
  t.is(meta.width, 1200)
  t.is(meta.height, 630)

  // Without texts the output equals the background
  const psnrValue = await computePsnr(bgPath, sharp)
  t.true(psnrValue > targetPsnr, `PSNR expected over ${targetPsnr}, but got ${psnrValue}`)
})

test('TypeA Banners - overlayColor blends over the background', async (t) => {
  const base = await BannerTypeA.render({ ...BannerTypeA.defaultBannerSpec(), bgColor: '#ffffff' }, noHttp)
  assertColorNear(t, await pixelAt(base, 5, 5), [255, 255, 255])

  const overlaid = await BannerTypeA.render(
    { ...BannerTypeA.defaultBannerSpec(), bgColor: '#ffffff', overlayColor: '#00000080' },
    noHttp
  )
  // 50% black over white
  assertColorNear(t, await pixelAt(overlaid, 5, 5), [127, 127, 127], 3)
})

test('TypeA Banners - non RGB overlayColor throws', async (t) => {
  const spec = { ...BannerTypeA.defaultBannerSpec(), overlayColor: 'hsl(0, 0%, 0%)' }
  await t.throwsAsync(() => BannerTypeA.render(spec, noHttp), { message: 'overlayColor must be RGB color space' })
})

test('TypeA Banners - texts render white pixels and only first three are used', async (t) => {
  const spec = BannerTypeA.defaultBannerSpec()
  spec.bgColor = '#000000'
  spec.texts[0].content = 'IIIIIIII'
  spec.texts[0].fontSize = '20%'
  const one = await BannerTypeA.render(spec, noHttp)
  const { data, info } = await one.clone().raw().toBuffer({ resolveWithObject: true })
  let white = 0
  for (let i = 0; i < data.length; i += info.channels) {
    if (data[i] > 200 && data[i + 1] > 200 && data[i + 2] > 200) white++
  }
  t.true(white > 1000, `expected white text pixels, got ${white}`)

  // A fourth text is ignored
  const four = BannerTypeA.defaultBannerSpec()
  four.texts[0].content = 'First line'
  four.texts[1].content = 'Second line text'
  four.texts[2].content = 'Third line'
  four.texts.push({ ...four.texts[2], content: 'Fourth line' })
  const three = BannerTypeA.defaultBannerSpec()
  three.texts[0].content = 'First line'
  three.texts[1].content = 'Second line text'
  three.texts[2].content = 'Third line'
  const a = await (await BannerTypeA.render(four, noHttp)).raw().toBuffer()
  const b = await (await BannerTypeA.render(three, noHttp)).raw().toBuffer()
  t.true(a.equals(b))
})

test('TypeA Banners - httpGetImage failure propagates', async (t) => {
  const spec = { ...BannerTypeA.defaultBannerSpec(), bgUrl: 'https://example.com/missing.jpg' }
  await t.throwsAsync(
    () =>
      BannerTypeA.render(spec, {
        httpGetImage: async () => {
          throw new Error('404')
        },
      }),
    { message: '404' }
  )
})
