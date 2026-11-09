import test from 'ava'

import { parseScale } from './types.js'

test('parseScale - number is returned as is', (t) => {
  t.is(parseScale(120, 1000), 120)
  t.is(parseScale(0, 1000), 0)
})

test('parseScale - percentage is relative to the reference', (t) => {
  t.is(parseScale('15%', 630), 94.5)
  t.is(parseScale('100%', 1200), 1200)
  t.is(parseScale('0%', 1200), 0)
})

test('parseScale - px suffix and bare numeric string are pixels', (t) => {
  t.is(parseScale('40px', 1000), 40)
  t.is(parseScale('40', 1000), 40)
})
