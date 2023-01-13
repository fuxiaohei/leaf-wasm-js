/* eslint-disable camelcase */
import test_headers from './headers'
import { test_requests, test_response } from './requests_or_response'
// import { test_fetch_get } from './fetch'

test_headers()
console.log('test_headers ok')

console.log('test_requests', test_requests().then(() => {
  console.log('test_requests ok')
}).catch((e) => {
  console.log('test_requests error', e)
}))

console.log('test_response', test_response().then(() => {
  console.log('test_response ok')
}).catch((e) => {
  console.log('test_response error', e)
}))

/*
console.log('test_fetch', test_fetch_get().then(() => {
  console.log('test_fetch ok')
}).catch((e) => {
  console.log('test_fetch error', e)
}))
*/
