import Headers from "./headers";

let valid_methods = ["GET", "POST", "PUT", "DELETE", "HEAD", "OPTIONS"];

function validate_request(req) {
    if (valid_methods.indexOf(req.method) === -1) {
        throw new TypeError("Request() with invalid method: " + req.method);
    }
}

export default class Request {
    constructor(url, options) {
        options = options ?? {};
        this.url = url;
        this.method = options.method ? String(options.method).toUpperCase() : "GET";
        this.redirect = options.redirect ?? "follow";
        this.headers = new Headers(options.headers ?? {});
        this.bodyUsed = false;
        validate_request(this);
    }
}