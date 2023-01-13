/* eslint-disable camelcase */
/* eslint-disable no-lone-blocks */
import { assert_equals, assert_true, assert_false } from './assert'

export default
function test_headers () {
  const headerDict = {
    name1: 'value1',
    name2: 'value2',
    name3: 'value3',
    name4: null,
    name5: undefined,
    name6: 1,
    'Content-Type': 'value4'
  }
  const headerSeq = []
  const headerKeysSeq = []
  const headerValuesSeq = []
  for (const name in headerDict) {
    headerSeq.push([name, headerDict[name]])
    headerKeysSeq.push(name)
    headerValuesSeq.push(headerDict[name])
  }

  {
    // init headers with object
    const headers = new Headers(headerDict)
    for (const name in headerDict) {
      assert_equals(headers.get(name), String(headerDict[name]),
        'name: ' + name + ' has value: ' + headerDict[name])
    }
  }
  {
    // append
    const headers = new Headers()
    for (const name in headerDict) {
      headers.append(name, headerDict[name])
      assert_equals(headers.get(name), String(headerDict[name]),
        'name: ' + name + ' has value: ' + headerDict[name])
    }
  }
  {
    // set
    const headers = new Headers()
    for (const name in headerDict) {
      headers.set(name, headerDict[name])
      assert_equals(headers.get(name), String(headerDict[name]),
        'name: ' + name + ' has value: ' + headerDict[name])
    }
  }
  {
    // has
    const headers = new Headers(headerDict)
    for (const name in headerDict) { assert_true(headers.has(name), 'headers has name ' + name) }
    assert_false(headers.has('nameNotInHeaders'), 'headers do not have header: nameNotInHeaders')
  }
  {
    // delete
    const headers = new Headers(headerDict)
    for (const name in headerDict) {
      assert_true(headers.has(name), 'headers have a header: ' + name)
      headers.delete(name)
      assert_true(!headers.has(name), 'headers do not have anymore a header: ' + name)
    }
  }
  {
    // keys
    const headers = new Headers(headerDict)
    const actual = headers.keys()
    headerKeysSeq.forEach(function (key) {
      const entry = actual.next()
      assert_false(entry.done)
      assert_equals(entry.value, key)
    })
    assert_true(actual.next().done)
    assert_true(actual.next().done)
  }
  {
    // values
    const headers = new Headers(headerDict)
    const actual = headers.values()
    headerValuesSeq.forEach(function (key) {
      const entry = actual.next()
      assert_false(entry.done)
      assert_equals(entry.value, String(key))
    })
    assert_true(actual.next().done)
    assert_true(actual.next().done)
  }
  {
    // entries
    const headers = new Headers(headerDict)
    const actual = headers.entries()
    headerSeq.forEach(function (key) {
      const entry = actual.next()
      assert_false(entry.done)
      assert_equals(entry.value[0], key[0])
      assert_equals(entry.value[1], String(key[1]))
    })
    assert_true(actual.next().done)
    assert_true(actual.next().done)
  }
  return true
}
