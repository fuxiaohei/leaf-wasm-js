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

function test_headers() {
    var headerDict = {
        "name1": "value1",
        "name2": "value2",
        "name3": "value3",
        "name4": null,
        "name5": undefined,
        "name6": 1,
        "Content-Type": "value4"
    };
    var headerSeq = [];
    var headerKeysSeq = [];
    var headerValuesSeq = [];
    for (var name in headerDict) {
        headerSeq.push([name, headerDict[name]]);
        headerKeysSeq.push(name);
        headerValuesSeq.push(headerDict[name]);
    }


    {
        // init headers with object
        var headers = new Headers(headerDict);
        for (key in headerDict) {
            assert_equals(headers.get(key), String(headerDict[key]),
                "name: " + key + " has value: " + headerDict[key]);
        }
    }
    {
        // append 
        var headers = new Headers();
        for (name in headerDict) {
            headers.append(name, headerDict[name]);
            assert_equals(headers.get(name), String(headerDict[name]),
                "name: " + name + " has value: " + headerDict[name]);
        }
    }
    {
        // set
        var headers = new Headers();
        for (name in headerDict) {
            headers.set(name, headerDict[name]);
            assert_equals(headers.get(name), String(headerDict[name]),
                "name: " + name + " has value: " + headerDict[name]);
        }
    }
    {
        // has
        var headers = new Headers(headerDict);
        for (name in headerDict)
            assert_true(headers.has(name), "headers has name " + name);

        assert_false(headers.has("nameNotInHeaders"), "headers do not have header: nameNotInHeaders");
    }
    {
        // delete
        var headers = new Headers(headerDict);
        for (name in headerDict) {
            assert_true(headers.has(name), "headers have a header: " + name);
            headers.delete(name)
            assert_true(!headers.has(name), "headers do not have anymore a header: " + name);
        }
    }
    {
        // keys
        var headers = new Headers(headerDict);
        var actual = headers.keys();
        headerKeysSeq.forEach(function (key) {
            const entry = actual.next();
            assert_false(entry.done);
            assert_equals(entry.value, key);
        });
        assert_true(actual.next().done);
        assert_true(actual.next().done);
    }
    {
        // values
        var headers = new Headers(headerDict);
        var actual = headers.values();
        headerValuesSeq.forEach(function (key) {
            const entry = actual.next();
            assert_false(entry.done);
            assert_equals(entry.value, String(key));
        });
        assert_true(actual.next().done);
        assert_true(actual.next().done);
    }
    {
        // entries
        var headers = new Headers(headerDict);
        var actual = headers.entries();
        headerSeq.forEach(function (key) {
            const entry = actual.next();
            assert_false(entry.done);
            assert_equals(entry.value[0], key[0]);
            assert_equals(entry.value[1], String(key[1]));
        });
        assert_true(actual.next().done);
        assert_true(actual.next().done);
    }
    return true;
}

console.log("test_headers", test_headers())