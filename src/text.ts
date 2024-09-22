import Path from 'path'

import Sharp from 'sharp'
import TextToSvg from 'text-to-svg'

import { parseScale, Scale } from './types.js'

const textToSvgByFont: Map<string, ReturnType<typeof TextToSvg.loadSync>> = new Map()
const defaultAnchor: TextToSvg.Anchor = 'left top'

async function loadFont(fontFace: string) {
  const safeFontFace = fontFace.replace(/[^a-zA-Z0-9\-_]/g, '')
  const fontPath = Path.resolve(import.meta.dirname, `../fonts/${safeFontFace}.otf`)

  return new Promise<TextToSvg>((resolve, reject) => {
    TextToSvg.load(fontPath, (error, textToSvg) => {
      if (error) {
        reject(error)
        return
      }

      resolve(textToSvg)
    })
  })
}

export async function referTextToSvgByFont(fontFace: string) {
  if (textToSvgByFont.has(fontFace)) {
    return textToSvgByFont.get(fontFace)
  }

  const textToSvg = await loadFont(fontFace)
  textToSvgByFont.set(fontFace, textToSvg)

  return textToSvg
}

export interface TextSpec {
  fontSize: Scale
  minWidth: Scale
  maxWidth: Scale
  fillColor: string
  letterSpacing: number
  content: string
  fontFace: string
}

export interface CanvasSpec {
  width: number
  height: number
  lineGap: Scale
  paddingY: Scale
}

export interface SvgTextSpec {
  fontSize: number
  width: number
  height: number
  ascender: number
  descender: number
  topOffset: number
  baselineOffset: number
  xHeight: number
}

export async function calculateSvgTextSpec(text: TextSpec, canvas: CanvasSpec): Promise<SvgTextSpec> {
  const textToSvg = await referTextToSvgByFont(text.fontFace)

  const initialFontSize = parseScale(text.fontSize, canvas.width)
  const minWidth = parseScale(text.minWidth, canvas.width)
  const maxWidth = parseScale(text.maxWidth, canvas.width)

  const naturalMetrics = textToSvg.getMetrics(text.content, {
    fontSize: initialFontSize,
    anchor: defaultAnchor,
    x: 0,
    y: 0,
    letterSpacing: text.letterSpacing,
  })

  if (naturalMetrics.width < minWidth) {
    const fontSize = (initialFontSize * minWidth) / naturalMetrics.width
    const metrics = textToSvg.getMetrics(text.content, {
      fontSize,
      anchor: defaultAnchor,
      x: 0,
      y: 0,
      letterSpacing: text.letterSpacing,
    })

    const topOffset = metrics.height - metrics.ascender
    const baselineOffset = metrics.height + metrics.descender
    return {
      fontSize,
      width: metrics.width,
      height: metrics.height,
      ascender: metrics.ascender,
      descender: metrics.descender,
      topOffset,
      baselineOffset,
      xHeight: baselineOffset - topOffset,
    }
  }

  if (naturalMetrics.width > maxWidth) {
    const fontSize = (initialFontSize * maxWidth) / naturalMetrics.width
    const metrics = textToSvg.getMetrics(text.content, {
      fontSize,
      anchor: defaultAnchor,
      x: 0,
      y: 0,
      letterSpacing: text.letterSpacing,
    })

    const topOffset = metrics.height - metrics.ascender
    const baselineOffset = metrics.height + metrics.descender
    return {
      fontSize,
      width: metrics.width,
      height: metrics.height,
      ascender: metrics.ascender,
      descender: metrics.descender,
      topOffset,
      baselineOffset,
      xHeight: baselineOffset - topOffset,
    }
  }

  const topOffset = naturalMetrics.height - naturalMetrics.ascender
  const baselineOffset = naturalMetrics.height + naturalMetrics.descender
  return {
    fontSize: initialFontSize,
    width: naturalMetrics.width,
    height: naturalMetrics.height,
    ascender: naturalMetrics.ascender,
    descender: naturalMetrics.descender,
    topOffset,
    baselineOffset,
    xHeight: baselineOffset - topOffset,
  }
}

export async function createSvg(text: TextSpec, fontSize: number): Promise<string> {
  const textToSvg = await referTextToSvgByFont(text.fontFace)
  return textToSvg.getSVG(text.content, {
    fontSize,
    x: 0,
    y: 0,
    anchor: defaultAnchor,
    letterSpacing: text.letterSpacing,
    attributes: {
      fill: text.fillColor,
    },
  })
}

export function pushOverlaySvg(
  overlays: Sharp.OverlayOptions[],
  args: SvgTextSpec & { svg: string; left: number; top: number }
) {
  // Debug background
  // overlays.push({
  //   input: {
  //     create: {
  //       width: Math.floor(args.width),
  //       height: Math.floor(args.height),
  //       background: { r: 0, g: 0, b: 0, alpha: 1 },
  //       channels: 4,
  //     },
  //   },
  //   left: Math.floor(args.left),
  //   top: Math.floor(args.top),
  // })
  // overlays.push({
  //   input: {
  //     create: {
  //       width: Math.floor(args.width),
  //       height: Math.floor(args.xHeight),
  //       background: { r: 255, g: 0, b: 0, alpha: 1 },
  //       channels: 4,
  //     },
  //   },
  //   left: Math.floor(args.left),
  //   top: Math.floor(args.top + args.topOffset),
  // })
  overlays.push({
    input: Buffer.from(args.svg),
    left: Math.floor(args.left),
    top: Math.floor(args.top),
  })
}

export async function placeOneSvgText(
  overlays: Sharp.OverlayOptions[],
  text: TextSpec,
  canvas: CanvasSpec
): Promise<Sharp.OverlayOptions[]> {
  const newOverlays: Sharp.OverlayOptions[] = [...overlays]

  // Place one text to center middle
  const svgTextSpec = await calculateSvgTextSpec(text, canvas)
  const textSvg = await createSvg(text, svgTextSpec.fontSize)

  pushOverlaySvg(newOverlays, {
    svg: textSvg,
    left: (canvas.width - svgTextSpec.width) / 2,
    top: (canvas.height - svgTextSpec.height) / 2,
    ...svgTextSpec,
  })

  return newOverlays
}

export async function placeTwoSvgTexts(
  overlays: Sharp.OverlayOptions[],
  first: TextSpec,
  second: TextSpec,
  canvas: CanvasSpec
): Promise<Sharp.OverlayOptions[]> {
  const newOverlays: Sharp.OverlayOptions[] = [...overlays]

  const firstMetrics = await calculateSvgTextSpec(first, canvas)
  const firstSvg = await createSvg(first, firstMetrics.fontSize)
  const secondMetrics = await calculateSvgTextSpec(second, canvas)
  const secondSvg = await createSvg(second, secondMetrics.fontSize)

  const lineGap = parseScale(canvas.lineGap, canvas.height)
  const totalHeight = firstMetrics.xHeight + lineGap + secondMetrics.xHeight
  const firstTop = (canvas.height - totalHeight) / 2 - firstMetrics.topOffset
  const secondTop = firstTop + firstMetrics.topOffset + firstMetrics.xHeight + lineGap - secondMetrics.topOffset

  pushOverlaySvg(newOverlays, {
    svg: firstSvg,
    left: (canvas.width - firstMetrics.width) / 2,
    top: firstTop,
    ...firstMetrics,
  })
  pushOverlaySvg(newOverlays, {
    svg: secondSvg,
    left: (canvas.width - secondMetrics.width) / 2,
    top: secondTop,
    ...secondMetrics,
  })

  return newOverlays
}

export async function placeThreeSvgTexts(
  overlays: Sharp.OverlayOptions[],
  first: TextSpec,
  second: TextSpec,
  third: TextSpec,
  canvas: CanvasSpec
): Promise<Sharp.OverlayOptions[]> {
  const newOverlays: Sharp.OverlayOptions[] = [...overlays]

  const firstMetrics = await calculateSvgTextSpec(first, canvas)
  const firstSvg = await createSvg(first, firstMetrics.fontSize)
  const secondMetrics = await calculateSvgTextSpec(second, canvas)
  const secondSvg = await createSvg(second, secondMetrics.fontSize)
  const thirdMetrics = await calculateSvgTextSpec(third, canvas)
  const thirdSvg = await createSvg(third, thirdMetrics.fontSize)

  const paddingY = parseScale(canvas.paddingY, canvas.height)
  const firstTop = paddingY - firstMetrics.topOffset
  const firstBottom = firstTop + firstMetrics.height + firstMetrics.descender
  const thirdTop = canvas.height - paddingY - thirdMetrics.height - thirdMetrics.descender
  const secondTop = firstBottom + (thirdTop - firstBottom - secondMetrics.height) / 2

  pushOverlaySvg(newOverlays, {
    svg: firstSvg,
    left: (canvas.width - firstMetrics.width) / 2,
    top: firstTop,
    ...firstMetrics,
  })
  pushOverlaySvg(newOverlays, {
    svg: secondSvg,
    left: (canvas.width - secondMetrics.width) / 2,
    top: secondTop,
    ...secondMetrics,
  })
  pushOverlaySvg(newOverlays, {
    svg: thirdSvg,
    left: (canvas.width - thirdMetrics.width) / 2,
    top: thirdTop,
    ...thirdMetrics,
  })

  return newOverlays
}
