/// This code is mostly copied from vite as it's not publicly exposed via their API

import path from 'path'
import fs, { promises as fsp } from 'fs'
import type {
  Server as HttpServer,
  OutgoingHttpHeaders as HttpServerHeaders
} from 'http'
import type { ServerOptions as HttpsServerOptions } from 'https'

export function isObject(value: unknown): value is Record<string, any> {
  return Object.prototype.toString.call(value) === '[object Object]'
}

export async function resolveHttpsConfig(
    https: boolean | HttpsServerOptions | undefined,
    cacheDir?: string
  ): Promise<HttpsServerOptions | undefined> {
    if (!https) return undefined

    const httpsOption = isObject(https) ? { ...https } : {}

    const { ca, cert, key, pfx } = httpsOption
    Object.assign(httpsOption, {
        ca: readFileIfExists(ca),
        cert: readFileIfExists(cert),
        key: readFileIfExists(key),
        pfx: readFileIfExists(pfx)
    })
    if (!httpsOption.key || !httpsOption.cert) {
        httpsOption.cert = httpsOption.key = await getCertificate(cacheDir||path.join(path.dirname("test"), `node_modules/.vite`))
    }
    return httpsOption
}

  function readFileIfExists(value?: string | Buffer | any[]) {
  if (typeof value === 'string') {
    try {
      return fs.readFileSync(path.resolve(value))
    } catch (e) {
      return value
    }
  }
  return value
}

async function getCertificate(cacheDir: string) {
  const cachePath = path.join(cacheDir, '_cert.pem')

  try {
    const [stat, content] = await Promise.all([
      fsp.stat(cachePath),
      fsp.readFile(cachePath, 'utf8')
    ])

    if (Date.now() - stat.ctime.valueOf() > 30 * 24 * 60 * 60 * 1000) {
      throw new Error('cache is outdated.')
    }

    return content
  } catch {
      // TODO: Add certificate generation
      console.error("Certificate generation unsupported. Please provide a valid certificate in the config")
      process.exit(1)
    // const content = createCertificate()
    // fsp
    //   .mkdir(cacheDir, { recursive: true })
    //   .then(() => fsp.writeFile(cachePath, content))
    //   .catch(() => {})
    // return content
  }
}