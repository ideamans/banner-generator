import Pino from 'pino'

export type Scale = string | number

export function parseScale(scale: Scale, reference: number): number {
  if (typeof scale === 'number') {
    return scale
  }

  if (scale.endsWith('%')) {
    return (parseInt(scale, 10) * reference) / 100
  }

  if (scale.endsWith('px')) {
    return parseInt(scale, 10)
  }

  return parseInt(scale, 10)
}

export interface DependencyInterface {
  logger?: Pino.Logger
  loggerOptions(): Pino.LoggerOptions
  httpGetImage(url: string): Promise<Buffer>
}
