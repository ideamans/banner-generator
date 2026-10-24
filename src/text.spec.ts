import test from 'ava'

import { calculateSvgTextSpec, CanvasSpec, createSvg, placeOneSvgText, TextSpec } from './text.js'

const canvas: CanvasSpec = { width: 1200, height: 630, lineGap: '5%', paddingTop: '15%', paddingBottom: '15%' }

function textSpec(overrides: Partial<TextSpec> = {}): TextSpec {
  return {
    content: `ideaman's Notes`,
    fontSize: '20%',
    fillColor: 'white',
    minWidth: '60%',
    maxWidth: '60%',
    letterSpacing: 0,
    fontFace: 'NotoSansJP-Black',
    ...overrides,
  }
}

test('calculateSvgTextSpec - fits text width into minWidth == maxWidth', async (t) => {
  const spec = await calculateSvgTextSpec(textSpec(), canvas)
  t.true(Math.abs(spec.width - 720) < 1, `width ${spec.width} should be about 720`)
  t.true(spec.fontSize > 0)
  t.true(spec.height > 0)
  t.true(spec.xHeight > 0)
})

test('calculateSvgTextSpec - enlarges short text up to minWidth', async (t) => {
  const spec = await calculateSvgTextSpec(
    textSpec({ content: 'A', fontSize: 10, minWidth: '50%', maxWidth: '90%' }),
    canvas
  )
  t.true(Math.abs(spec.width - 600) < 1, `width ${spec.width} should be about 600`)
  t.true(spec.fontSize > 10)
})

test('calculateSvgTextSpec - shrinks long text down to maxWidth', async (t) => {
  const spec = await calculateSvgTextSpec(
    textSpec({
      content: 'アイデアマンズ株式会社の研究ノート'.repeat(3),
      fontSize: '20%',
      minWidth: '10%',
      maxWidth: '90%',
    }),
    canvas
  )
  t.true(Math.abs(spec.width - 1080) < 1, `width ${spec.width} should be about 1080`)
  t.true(spec.fontSize < 240)
})

test('calculateSvgTextSpec - keeps natural size when within min/max', async (t) => {
  const spec = await calculateSvgTextSpec(textSpec({ fontSize: 60, minWidth: '1%', maxWidth: '100%' }), canvas)
  t.is(spec.fontSize, 60)
})

test('calculateSvgTextSpec - every bundled font can be loaded', async (t) => {
  for (const fontFace of ['NotoSansJP-Black', 'NotoSansJP-Bold', 'NotoSansJP-Medium']) {
    const spec = await calculateSvgTextSpec(textSpec({ fontFace }), canvas)
    t.true(spec.width > 0, fontFace)
  }
})

test('calculateSvgTextSpec - unknown font rejects', async (t) => {
  // text-to-svg rejects with a non-Error value (the message string)
  await t.throwsAsync(() => calculateSvgTextSpec(textSpec({ fontFace: 'NoSuchFont' }), canvas), { any: true })
})

test('createSvg - returns an svg path with the fill color', async (t) => {
  const svg = await createSvg(textSpec({ fillColor: '#ff0000' }), 50)
  t.true(svg.startsWith('<svg'))
  t.true(svg.includes('fill="#ff0000"'))
  t.true(svg.includes('<path'))
})

test('placeOneSvgText - adds one overlay centered horizontally', async (t) => {
  const text = textSpec()
  const overlays = await placeOneSvgText([], text, canvas)
  t.is(overlays.length, 1)
  const metrics = await calculateSvgTextSpec(text, canvas)
  t.is(overlays[0].left, Math.floor((canvas.width - metrics.width) / 2))
  t.is(overlays[0].top, Math.floor((canvas.height - metrics.height) / 2))
})
