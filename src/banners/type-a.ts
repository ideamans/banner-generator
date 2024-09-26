import ColorParse from 'color-parse'
import Sharp from 'sharp'

import { placeOneSvgText, placeThreeSvgTexts, placeTwoSvgTexts, TextSpec } from '../text.js'
import { DependencyInterface, Scale } from '../types.js'

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace BannerTypeA {
  export interface BannerSpec {
    bgUrl: string
    overlayColor: string
    paddingTop: Scale
    paddingBottom: Scale
    lineGap: Scale
    texts?: TextSpec[]
  }

  export function defaultBannerSpec(): BannerSpec {
    return {
      bgUrl: '',
      overlayColor: '',
      paddingTop: '15%',
      paddingBottom: '15%',
      lineGap: '5%',
      texts: [
        {
          content: ``,
          fontSize: '20%',
          fillColor: 'white',
          minWidth: '60%',
          maxWidth: '60%',
          letterSpacing: 0,
          fontFace: 'NotoSansJP-Black',
        },
        {
          content: ``,
          fontSize: '10%',
          fillColor: 'white',
          minWidth: '50%',
          maxWidth: '90%',
          letterSpacing: 0,
          fontFace: 'NotoSansJP-Bold',
        },
        {
          content: ``,
          fontSize: '5%',
          fillColor: 'white',
          minWidth: '40%',
          maxWidth: '40%',
          letterSpacing: 0,
          fontFace: 'NotoSansJP-Medium',
        },
      ],
    }
  }

  export async function render(
    spec: BannerSpec,
    dependency: Pick<DependencyInterface, 'logger' | 'httpGetImage'>
  ): Promise<Sharp.Sharp> {
    // bgImage required
    if (!spec.bgUrl) {
      throw new Error('bgUrl is required')
    }

    // bgImage sharp
    const buffer = await dependency.httpGetImage(spec.bgUrl)
    const bg = Sharp(buffer)
    const bgMetrics = await bg.metadata()

    const canvas = {
      width: bgMetrics.width,
      height: bgMetrics.height,
      paddingTop: spec.paddingTop,
      paddingBottom: spec.paddingBottom,
      lineGap: spec.lineGap,
    }

    // overlays
    let overlays: Sharp.OverlayOptions[] = []

    // overlay color
    if (spec.overlayColor) {
      const color = ColorParse(spec.overlayColor)
      if (color.space !== 'rgb') {
        throw new Error('overlayColor must be RGB color space')
      }

      overlays.push({
        input: {
          create: {
            width: canvas.width,
            height: canvas.height,
            channels: 4,
            background: { r: color.values[0], g: color.values[1], b: color.values[2], alpha: color.alpha },
          },
        },
        blend: 'over',
      })
    }

    // available texts and place them by numbers
    const available = (spec.texts || []).filter((t) => t.content).slice(0, 3)
    if (available.length === 1) {
      overlays = await placeOneSvgText(overlays, available[0], canvas)
    } else if (available.length === 2) {
      overlays = await placeTwoSvgTexts(overlays, available[0], available[1], canvas)
    } else if (available.length === 3) {
      overlays = await placeThreeSvgTexts(overlays, available[0], available[1], available[2], canvas)
    }

    return bg.composite(overlays)
  }
}
