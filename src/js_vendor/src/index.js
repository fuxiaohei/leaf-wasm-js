import Headers from "./headers";


globalThis.Headers = Headers;

function hello() {
    return new Headers({})
}

hello();