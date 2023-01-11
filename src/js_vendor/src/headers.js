
export default class Headers {
    constructor(input) {
        if (!input) {
            this.headers = {}
            return;
        }
        // if input is not object ,unsupport now
        if (typeof input !== "object") {
            throw new Error("Headers only support object");
        }
        let headers = {}
        for (const key in input) {
            headers[key] = String(input[key]);
        }
        this.headers = headers;
    }

    append(key, value) {
        this.headers[key] = String(value);
        return value;
    }

    set(key, value) {
        this.append(key, value);
        return value;
    }

    has(key) {
        return key in this.headers;
    }

    delete(key) {
        let dropValue = delete this.headers[key];
        return dropValue;
    }

    get(key) {
        return this.headers[key];
    }

    *keys() {
        for (const name of Object.keys(this.headers)) {
            yield name
        }
    }
    *values() {
        for (const name of Object.keys(this.headers)) {
            yield this.headers[name]
        }
    }
    *entries() {
        for (const name of Object.keys(this.headers)) {
            yield [name, this.headers[name]]
        }
    }

}