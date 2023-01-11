function assert_equals(actual, expected, message) {
    if (!Object.is(actual, expected))
        throw Error(message + ': expected: ' + expected + ', actual: ' + actual);
}

function assert_true(actual, message) {
    assert_equals(actual, true, message)
}

function assert_false(actual, message) {
    assert_equals(actual, false, message)
}

export { assert_equals, assert_true, assert_false };