import { BrotliOptions } from 'node:zlib'

import test from 'ava'

import { base64ToText, brotliToBase64 } from './brotli.js'

test('brotliToBase64 should compress text and return base64 string', async (t) => {
  const input = 'Hello, World! This is a test string for brotli compression.'
  const compressed = await brotliToBase64(input)

  t.is(typeof compressed, 'string')
  t.not(compressed, input)
  t.true(compressed.length > 0)
  console.log(compressed)
})

test('base64ToText should decompress base64 string back to original text', async (t) => {
  const originalText = 'Hello, World! This is a test string for brotli compression.'
  const compressed = await brotliToBase64(originalText)
  const decompressed = await base64ToText(compressed)

  t.is(decompressed, originalText)
})

test('brotliToBase64 and base64ToText should handle empty string', async (t) => {
  const input = ''
  const compressed = await brotliToBase64(input)
  const decompressed = await base64ToText(compressed)

  t.is(decompressed, input)
})

test('brotliToBase64 and base64ToText should handle Japanese text', async (t) => {
  const input = 'こんにちは、世界！これはブロートリ圧縮のテストです。'
  const compressed = await brotliToBase64(input)
  const decompressed = await base64ToText(compressed)

  t.is(decompressed, input)
})

test('brotliToBase64 should accept BrotliOptions', async (t) => {
  const input = 'Hello, World!'
  const options: BrotliOptions = { params: { [1]: 9 } } // 最高圧縮レベル
  const compressed = await brotliToBase64(input, options)
  const decompressed = await base64ToText(compressed)

  t.is(decompressed, input)
})
