import Fsp from 'fs/promises'

import { BannerTypeA } from './banners/type-a.js'
import { Dependency } from './dependency.js'

const dependency = new Dependency()

export async function typeA() {
  await Fsp.mkdir('tmp', { recursive: true })
  const spec: BannerTypeA.BannerSpec = {
    bgUrl: 'https://notes.ideamans.com/ogp-background.jpg',
    paddingTop: '15%',
    paddingBottom: '15%',
    lineGap: '5%',
    texts: [
      {
        content: `ideaman's Notes`,
        fontSize: 20,
        fillColor: 'white',
        minWidth: '60%',
        maxWidth: '60%',
        letterSpacing: 0,
        fontFace: 'NotoSansJP-Black',
      },
      {
        content: `WebアプリのためのSSLをサクッと立てる`,
        fontSize: 10,
        fillColor: 'white',
        minWidth: '50%',
        maxWidth: '90%',
        letterSpacing: 0,
        fontFace: 'NotoSansJP-Bold',
      },
      {
        content: `2024-09-21 @miyanaga`,
        fontSize: 5,
        fillColor: 'white',
        minWidth: '40%',
        maxWidth: '40%',
        letterSpacing: 0,
        fontFace: 'NotoSansJP-Medium',
      },
    ],
  }

  const sharp = await BannerTypeA.render(spec, dependency)
  const buffer = await sharp.jpeg({ quality: 85 }).toBuffer()

  await Fsp.writeFile('./tmp/type-a.jpg', buffer)
}

export function typeAUrl() {
  const u = new URL('http://localhost:3000/banners/type-a')
  u.searchParams.set('bgUrl', 'https://notes.ideamans.com/ogp-background.jpg')
  u.searchParams.set('text0', `ideaman's Notes`)
  u.searchParams.set('text0width', '70%')
  u.searchParams.set('text1', `アイデアマンズ株式会社の研究ノート`)
  u.searchParams.set('text1width', '70%')
  console.log(u.toString())
}

typeAUrl()
