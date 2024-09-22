import Fsp from 'fs/promises'
import Path from 'path'

import test from 'ava'
import Sharp from 'sharp'
import { psnr } from 'sharp-iqa'

import { BannerTypeA } from './type-a.js'

const targetPsnr = 44

export async function saveAsToBe(toBePath: string, asIsSharp: Sharp.Sharp) {
  const buffer = await asIsSharp.jpeg({ quality: 85 }).toBuffer()
  await Fsp.writeFile(toBePath, buffer)
}

export async function computePsnr(toBePath: string, asIsSharp: Sharp.Sharp): Promise<number> {
  const toBeSharp = Sharp(toBePath)
  return await psnr(toBeSharp, asIsSharp)
}

test('TypeA Banners - one text', async (t) => {
  const spec: BannerTypeA.BannerSpec = {
    bgUrl: 'https://notes.ideamans.com/ogp-background.jpg',
    paddingY: '15%',
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
    paddingY: '15%',
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
    paddingY: '15%',
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
