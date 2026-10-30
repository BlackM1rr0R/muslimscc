// Server testləri üçün köməkçi: express tətbiqini təsadüfi portda qaldır, fetch ilə soruş.
// (Fayl adı *.test.js deyil — vitest onu ayrıca test kimi işlətmir.)
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
export const express = require('express')

/** app → { url, close } */
export function listen(app) {
  return new Promise((resolve) => {
    const srv = app.listen(0, '127.0.0.1', () => {
      const { port } = srv.address()
      resolve({ url: `http://127.0.0.1:${port}`, close: () => new Promise((r) => srv.close(r)) })
    })
  })
}

export { require }
