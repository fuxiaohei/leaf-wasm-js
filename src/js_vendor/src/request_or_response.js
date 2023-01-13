/* eslint-disable camelcase */
import Headers from './headers'

const valid_methods = ['GET', 'POST', 'PUT', 'DELETE', 'HEAD', 'OPTIONS']

const viewClasses = [
  '[object Int8Array]',
  '[object Uint8Array]',
  '[object Uint8ClampedArray]',
  '[object Int16Array]',
  '[object Uint16Array]',
  '[object Int32Array]',
  '[object Uint32Array]',
  '[object Float32Array]',
  '[object Float64Array]'
]

const isArrayBufferView =
    ArrayBuffer.isView ||
    function (obj) {
      return obj && viewClasses.indexOf(Object.prototype.toString.call(obj)) > -1
    }

function readArrayBufferAsText (buf) {
  const view = new Uint8Array(buf)
  const chars = new Array(view.length)

  for (let i = 0; i < view.length; i++) {
    chars[i] = String.fromCharCode(view[i])
  }
  return chars.join('')
}

function bufferClone (buf) {
  if (buf.slice) {
    return buf.slice(0)
  } else {
    const view = new Uint8Array(buf.byteLength)
    view.set(new Uint8Array(buf))
    return view.buffer
  }
}

function validate_request (req) {
  if (valid_methods.indexOf(req.method) === -1) {
    throw new TypeError('Request() with invalid method: ' + req.method)
  }
}

export class Request {
  constructor (input, options) {
    options = options || {}

    if (input instanceof Request) {
      if (input.bodyUsed) {
        throw new TypeError('Request() with body already read')
      }
      this.url = String(input)
      this.redirect = input.redirect
      this.method = input.method
      if (!options.headers) {
        this.headers = new Headers(input.headers)
      } else {
        this.headers = new Headers(options.headers || {})
      }
      this._initBody(options.body)
      validate_request(this)
      return
    }

    this.url = String(input)
    this.method = options.method ? String(options.method).toUpperCase() : 'GET'
    this.redirect = options.redirect || 'follow'
    this.headers = new Headers(options.headers || {})

    this._bodyInit = options.body
    this._initBody(options.body)
    validate_request(this)
  }

  _initBody (body) {
    this.bodyUsed = false
    if (!body) {
      this._bodyText = ''
    } else if (typeof body === 'string') {
      this._bodyText = body
    } else if (body instanceof URLSearchParams) {
      this._bodyText = body.toString()
    } else if (body instanceof FormData) {
      this._bodyFormData = body
    } else if (body instanceof ArrayBuffer || isArrayBufferView(body)) {
      this._bodyArrayBuffer = bufferClone(body)
    } else {
      this._bodyText = String(body)
    }
  }

  async text () {
    this.bodyUsed = true
    if (this._bodyArrayBuffer) {
      return Promise.resolve(readArrayBufferAsText(this._bodyArrayBuffer))
    }
    if (this._bodyFormData) {
      return Promise.reject(new Error('FormData not support text()'))
    }
    return Promise.resolve(this._bodyText)
  }

  async json () {
    this.bodyUsed = true
    return this.text().then(JSON.parse)
  }

  async arrayBuffer () {
    this.bodyUsed = true
    if (this._bodyText) {
      const enc = new TextEncoder()
      const buff = enc.encode(this._bodyText)
      return Promise.resolve(buff.buffer)
    }
    return Promise.resolve(this._bodyArrayBuffer)
  }

  clone () {
    return new Request(this, { body: this._bodyInit })
  }
}

export class Response {
  constructor (bodyInit, options) {
    options = options || {}

    this.type = 'default'
    this.status = options.status === undefined ? 200 : options.status
    this.ok = this.status >= 200 && this.status < 300
    this.statusText = options.statusText === undefined ? '' : '' + options.statusText
    this.headers = new Headers(options.headers || {})
    this.url = options.url || ''
    this._bodyInit = bodyInit
    this.body = this._initBody(bodyInit)
  }

  _initBody (body) {
    this.bodyUsed = false
    if (!body) {
      this._bodyText = ''
    } else if (typeof body === 'string') {
      this._bodyText = body
    } else if (body instanceof URLSearchParams) {
      this._bodyText = body.toString()
    } else if (body instanceof FormData) {
      this._bodyFormData = body
    } else if (body instanceof ArrayBuffer || isArrayBufferView(body)) {
      this._bodyArrayBuffer = bufferClone(body)
    } else {
      this._bodyText = String(body)
    }
  }

  clone () {
    return new Response(this._bodyInit, {
      status: this.status,
      statusText: this.statusText,
      headers: new Headers(this.headers),
      url: this.url
    })
  }

  async text () {
    if (this._bodyArrayBuffer) {
      return Promise.resolve(readArrayBufferAsText(this._bodyArrayBuffer))
    }
    if (this._bodyFormData) {
      return Promise.reject(new Error('FormData not support text()'))
    }
    return Promise.resolve(this._bodyText)
  }

  async json () {
    return this.text().then(JSON.parse)
  }

  async arrayBuffer () {
    if (this._bodyText) {
      const enc = new TextEncoder()
      const buff = enc.encode(this._bodyText)
      return Promise.resolve(buff.buffer)
    }
    return Promise.resolve(this._bodyArrayBuffer)
  }
}
