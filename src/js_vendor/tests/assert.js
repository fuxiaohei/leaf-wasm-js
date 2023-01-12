/* eslint-disable camelcase */
function assert_equals (actual, expected, message) {
  if (!Object.is(actual, expected)) { throw Error(message + ': expected: ' + expected + ', actual: ' + actual) }
}

function assert_true (actual, message) {
  assert_equals(actual, true, message)
}

function assert_false (actual, message) {
  assert_equals(actual, false, message)
}

function assert_throws_js (exp_type, fn) {
  try {
    fn()
  } catch (ex) {
    assert_true(ex instanceof exp_type, 'Expected exception of type ' + exp_type.name + ', got ' + ex)
  }
}

export { assert_equals, assert_true, assert_false, assert_throws_js }
