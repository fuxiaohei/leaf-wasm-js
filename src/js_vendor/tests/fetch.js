/* eslint-disable camelcase */
/* eslint-disable no-lone-blocks */
import { assert_equals } from './assert'

async function test_fetch_get () {
  const response = await fetch('https://www.rust-lang.org', {
    method: 'GET',
    headers: {
      'X-Test': 'test'
    }
  })
  assert_equals(response.status, 200, 'response status is 200')

  const value = await response.arrayBuffer()
  const text = (new TextDecoder()).decode(value)
  assert_equals(text, 'hello world', "Retrieve and verify response's body")
  return true
}

export { test_fetch_get }
