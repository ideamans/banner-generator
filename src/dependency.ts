import Crypto from 'crypto'
import Fs from 'fs'
import Fsp from 'fs/promises'
import Os from 'os'
import Path from 'path'

import Axios from 'axios'
import Pino from 'pino'

import { DependencyInterface } from './types.js'

function sha1(str: string): string {
  const hash = Crypto.createHash('sha1')
  hash.update(str)
  return hash.digest('hex')
}

export class Dependency implements DependencyInterface {
  logger?: Pino.Logger

  loggerOptions(): Pino.LoggerOptions {
    return {
      level: process.env.LOG_LEVEL || 'info',
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          ignore: 'pid,hostname',
          hideObject: !process.env.LOG_OBJECTS,
        },
      },
    }
  }

  imageCache: {
    dir: string
    expiresSec: number
    maxSize: number
  }

  constructor() {
    this.logger = Pino(this.loggerOptions())

    this.imageCache = {
      dir: process.env.IMAGE_CACHE_DIR || Os.tmpdir(),
      expiresSec: parseInt(process.env.IMAGE_CACHE_EXPIRES_SEC || '86400', 10),
      maxSize: parseInt(process.env.IMAGE_MAX_SIZE || '1048576', 10),
    }
  }

  async httpGetImage(url: string): Promise<Buffer> {
    const cachePath = Path.join(this.imageCache.dir, sha1(url))

    if (Fs.existsSync(cachePath)) {
      const stat = await Fsp.stat(cachePath)
      if (Date.now() - stat.mtimeMs < this.imageCache.expiresSec * 1000) {
        return await Fsp.readFile(cachePath)
      }
    }

    const headRes = await Axios.head(url)
    const contentLength = parseInt(headRes.headers['content-length'] || '0', 10)
    if (contentLength < 1) {
      throw new Error(`Invalid content-length of ${url}: ${headRes.headers['content-length']}`)
    }
    if (contentLength > this.imageCache.maxSize) {
      throw new Error(`Image too large of ${url}: ${contentLength} > ${this.imageCache.maxSize}`)
    }

    const getRes = await Axios.get<Buffer>(url, { responseType: 'arraybuffer' })
    const buffer = getRes.data

    await Fsp.writeFile(cachePath, buffer)

    return buffer
  }
}
