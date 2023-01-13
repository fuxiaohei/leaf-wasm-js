async function fetch (resource, options) {
  // convert request to JsRequest for deserializer
  const request = new Request(resource, options)
  const headers = {}
  for (const entry of request.headers.entries()) {
    headers[entry[0]] = entry[1]
  }
  const input = {
    id: 1,
    uri: request.url,
    headers,
    method: request.method,
    body: await request.arrayBuffer()
  }

  // return promise
  return new Promise(function (resolve, reject) {
    try {
      const leaf = globalThis.leaf
      const result = leaf.fetch(input)
      const response = new Response(result.body, {
        status: result.status,
        headers: result.headers
      })
      resolve(response)
    } catch (error) {
      reject(error)
    }
  })
}

export default fetch
