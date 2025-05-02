import { Readable, Writable } from 'node:stream'
import { pipeline as _pipeline } from 'node:stream/promises'
import { BrotliOptions, createBrotliCompress, createBrotliDecompress } from 'node:zlib'

const pipeline = _pipeline // 型推論を利かせるため alias

export async function brotliToBase64(text: string, options: BrotliOptions = {}): Promise<string> {
  const source = Readable.from([Buffer.from(text)])
  const brotli = createBrotliCompress(options)

  const chunks: Buffer[] = []
  const sink = new Writable({
    write(chunk, _enc, cb) {
      chunks.push(chunk as Buffer)
      cb()
    },
  })

  await pipeline(source, brotli, sink)
  return Buffer.concat(chunks).toString('base64')
}

export async function base64ToText(base64: string): Promise<string> {
  const source = Readable.from([Buffer.from(base64, 'base64')])
  const unbrot = createBrotliDecompress()

  const chunks: Buffer[] = []
  const sink = new Writable({
    write(chunk, _enc, cb) {
      chunks.push(chunk as Buffer)
      cb()
    },
  })

  await pipeline(source, unbrot, sink)
  return Buffer.concat(chunks).toString('utf8')
}
