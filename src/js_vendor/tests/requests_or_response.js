/* eslint-disable no-lone-blocks */
/* eslint-disable camelcase */
import { assert_equals, assert_true, assert_false, assert_throws_js } from './assert'

function checkRequest (request, ExpectedValuesDict) {
  for (const attribute in ExpectedValuesDict) {
    switch (attribute) {
      case 'headers':
        for (const key in ExpectedValuesDict.headers.keys()) {
          assert_equals(request.headers.get(key), ExpectedValuesDict.headers.get(key),
            'Check headers attribute has ' + key + ':' + ExpectedValuesDict.headers.get(key))
        }
        break
      case 'body':
        assert_true(request.headers.has('name'), 'Check request has name header')
        break

      case 'method':
      case 'redirect':
      case 'url':
        assert_equals(request[attribute], ExpectedValuesDict[attribute], 'Check ' + attribute + ' attribute')
        break
      default:
        break
    }
  }
}

async function test_requests () {
  {
    // test invalid methods
    for (const method of [
      'CONNECT', 'TRACE', 'TRACK',
      'connect', 'trace', 'track'
    ]) {
      assert_throws_js(TypeError,
        function () { Request('./', { method }) }
      )
    }
  }
  {
    // test clone
    const headers = new Headers({ name: 'value' })
    const initValuesDict = {
      method: 'POST',
      redirect: 'error',
      headers,
      body: "Request's body"
    }

    const expectedInitialized = {
      method: 'POST',
      redirect: 'error',
      headers,
      body: "Request's body"
    }
    const RequestInitialized = new Request('', initValuesDict)
    const requestToCheck = RequestInitialized.clone()
    checkRequest(requestToCheck, expectedInitialized)
  }
  {
    // test request body
    {
      const request = new Request('', { method: 'POST', body: 'String', headers: [['Content-Type', 'text/PLAIN']] })
      assert_false(request.bodyUsed, 'bodyUsed is false at init')
      assert_equals(await request.text(), 'String', "Retrieve and verify request's body")
      assert_true(request.bodyUsed, 'bodyUsed is true after used')
    }
    // test json
    {
      const request = new Request('', { method: 'POST', body: '{"name":"value"}', headers: [['Content-Type', 'application/json']] })
      assert_false(request.bodyUsed, 'bodyUsed is false at init')
      const value = await request.json()
      assert_equals(value.name, 'value', "Retrieve and verify request's body")
      assert_true(request.bodyUsed, 'bodyUsed is true after used')
    }
    // test arraybuffer
    {
      const request = new Request('', { method: 'POST', body: 'String', headers: [['Content-Type', 'text/PLAIN']] })
      assert_false(request.bodyUsed, 'bodyUsed is false at init')
      const value = await request.arrayBuffer()
      const text = (new TextDecoder()).decode(value)
      assert_equals(text, 'String', "Retrieve and verify request's body")
      assert_true(request.bodyUsed, 'bodyUsed is true after used')
    }
  }
  return true
}

async function test_response () {
  {
    // test default values
    const defaultValues = {
      type: 'default',
      url: '',
      ok: true,
      status: 200,
      statusText: ''
    }
    const response = new Response()
    for (const attributeName in defaultValues) {
      const expectedValue = defaultValues[attributeName]
      assert_equals(response[attributeName], expectedValue,
        'Expect default response.' + attributeName + ' is ' + expectedValue)
    }
  }
  {
    // test clone
    const body = 'This is response body'
    const headersInit = { name: 'value' }
    const responseInit = {
      status: 200,
      statusText: 'GOOD',
      headers: headersInit
    }
    const response = new Response(body, responseInit)
    const clonedResponse = response.clone()
    assert_equals(clonedResponse.status, responseInit.status,
      'Expect response.status is ' + responseInit.status)
    assert_equals(clonedResponse.statusText, responseInit.statusText,
      'Expect response.statusText is ' + responseInit.statusText)
    assert_equals(clonedResponse.headers.get('name'), 'value',
      'Expect response.headers has name:value header')
  }
  {
    // test response.text()
    const response = new Response('This is response body', {})
    assert_equals(await response.text(), 'This is response body', "Retrieve and verify response's body")
  }
  {
    // test response.json()
    const response = new Response('{"name":"value"}', {})
    const value = await response.json()
    assert_equals(value.name, 'value', "Retrieve and verify response's body")
  }
  {
    // test response.arrayBuffer()
    const response = new Response('This is response body', {})
    const value = await response.arrayBuffer()
    const text = (new TextDecoder()).decode(value)
    assert_equals(text, 'This is response body', "Retrieve and verify response's body")
  }
  return true
}

export { test_requests, test_response }
