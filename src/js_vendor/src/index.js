import Headers from './headers'
import { Request, Response } from './request_or_response'
import fetch from './fetch'

class FormData {}

require('fast-text-encoding')
require('url-polyfill')

globalThis.Headers = Headers
globalThis.Request = Request
globalThis.Response = Response
globalThis.FormData = FormData
globalThis.fetch = fetch

// addEventListener callback
let globalFetchHandler = null

// eslint-disable-next-line no-unused-vars
function addEventListener (name, handler) {
  // if handler is not function, throw error
  if (typeof handler !== 'function') {
    throw new Error('addEventListener handler must be function')
  }
  // only support fetch event, save handler to global variable
  // if global variable is set, throw error
  if (globalFetchHandler) {
    throw new Error('addEventListener has already been set')
  }
  if (name === 'fetch') {
    globalFetchHandler = handler
    return
  }
  throw new Error('addEventListener only support fetch event')
}
globalThis.addEventListener = addEventListener
globalThis.globalFetchHandler = globalFetchHandler

// eslint-disable-next-line no-unused-vars
function callGlobalFetchHandler (input) {
  if (!globalFetchHandler) {
    throw new Error('callGlobalFetchHandler has not been set')
  }
  const event = {
    name: 'fetch',
    request: new Request(input.uri, {
      method: input.method,
      headers: new Headers(input.headers || {}),
      body: input.body
    }),
    respondWith: async (result) => {
      globalThis.globalResponse = result // notify the result to the caller, it maybe a promise
      const response = await result
      const headers = {}
      for (const entry in response.headers.entries()) {
        headers[entry[0]] = entry[1]
      }
      globalThis.globalResponse = {
        status: response.status,
        headers,
        body: await response.arrayBuffer()
      }
    }
  }
  return globalFetchHandler(event)
}
globalThis.globalResponse = null
globalThis.callGlobalFetchHandler = callGlobalFetchHandler
