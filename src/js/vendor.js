let globalFetchHandler = null;

function addEventListener(name, handler) {
    // only support fetch event, save handler to global variable
    // if global variable is set, throw error
    if (globalFetchHandler) {
        throw new Error("addEventListener has already been set");
    }
    if (name === "fetch") {
        globalFetchHandler = handler;
    }
    throw new Error("addEventListener only support fetch event");
}