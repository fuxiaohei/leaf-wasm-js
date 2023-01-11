use anyhow::Result;
use bytes::Bytes;
use leaf_sdk::http::{Request, Response};
use leaf_sdk_macro::http_main;
use once_cell::sync::OnceCell;
use quickjs_wasm_rs::{Context, Serializer, Value};
use send_wrapper::SendWrapper;
use serde::{Deserialize, Serialize};
use serde_bytes::ByteBuf;
use std::collections::HashMap;
use std::io::{self, Read};
use std::ops::Deref;
use std::str::FromStr;

static JS_VENDOR: &str = include_str!("./js_vendor/dist/main.js");
static JS_CONTEXT: OnceCell<SendWrapper<Context>> = OnceCell::new();
static JS_GLOBAL: OnceCell<SendWrapper<Value>> = OnceCell::new();
static JS_HANDLER: OnceCell<SendWrapper<Value>> = OnceCell::new();
static JS_RESPONSE_PROMISE_RESOLVE: OnceCell<SendWrapper<Value>> = OnceCell::new();
static JS_RESPONSE_PROMISE_REJECT: OnceCell<SendWrapper<Value>> = OnceCell::new();
static JS_EVENT_RESPOND_WITH: OnceCell<SendWrapper<Value>> = OnceCell::new();

#[derive(Debug, Serialize, Deserialize)]
pub struct JsFetchEvent {
    name: String,
    request: JsRequest,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct JsRequest {
    id: u64,
    method: String,
    uri: String,
    #[serde(default)]
    headers: HashMap<String, String>,
    body: Option<ByteBuf>,
}

#[derive(Serialize, Deserialize, Debug)]
struct JsResponse {
    status: u16,
    #[serde(default)]
    headers: HashMap<String, String>,
    body: Option<ByteBuf>,
}

fn on_resolve(context: &Context, _this: &Value, args: &[Value]) -> Result<Value> {
    println!("on_resolve {:?}", args);
    context.undefined_value()
}

fn on_reject(context: &Context, _this: &Value, args: &[Value]) -> Result<Value> {
    println!("on_reject {:?}", args);
    context.undefined_value()
}

fn event_respond_with(context: &Context, _this: &Value, args: &[Value]) -> Result<Value> {
    println!("event_respond_with {:?}", args);
    context.undefined_value()
}

fn console_log(context: &Context, _this: &Value, args: &[Value]) -> Result<Value> {
    let mut spaced = false;
    for arg in args {
        if spaced {
            print!(" ");
        } else {
            spaced = true;
        }
        print!("{}", arg.as_str()?);
    }
    println!();
    context.undefined_value()
}

fn init_js_context() -> Result<()> {
    let mut script = String::new();
    io::stdin().read_to_string(&mut script)?;

    let context = Context::default();

    let global = context.global_object()?;
    // add console.log()
    let console = context.object_value()?;
    console.set_property("log", context.wrap_callback(console_log)?)?;
    global.set_property("console", console)?;

    // load vendor
    let _ = context.eval_global("vendor.js", JS_VENDOR)?;
    // load source
    let _ = context.eval_global("index.js", &script)?;

    // set global variables
    let handler = global.get_property("callglobalFetchHandler")?;
    let on_resolve = context.wrap_callback(on_resolve)?;
    let on_reject = context.wrap_callback(on_reject)?;
    let respond_with = context.wrap_callback(event_respond_with)?;

    JS_CONTEXT.set(SendWrapper::new(context)).unwrap();
    JS_GLOBAL.set(SendWrapper::new(global)).unwrap();
    JS_HANDLER.set(SendWrapper::new(handler)).unwrap();
    JS_RESPONSE_PROMISE_RESOLVE
        .set(SendWrapper::new(on_resolve))
        .unwrap();
    JS_RESPONSE_PROMISE_REJECT
        .set(SendWrapper::new(on_reject))
        .unwrap();
    JS_EVENT_RESPOND_WITH
        .set(SendWrapper::new(respond_with))
        .unwrap();

    Ok(())
}

#[export_name = "wizer.initialize"]
pub extern "C" fn init() {
    init_js_context().unwrap();
}

#[http_main]
pub fn handle_sdk_http(req: Request) -> Response {
    handle_request(req).unwrap()
}

pub fn handle_request(_req: Request) -> Result<Response> {
    let context = JS_CONTEXT.get().unwrap();
    let global = JS_GLOBAL.get().unwrap();
    let handler = JS_HANDLER.get().unwrap();

    // create FetchEvent object
    let request = JsRequest {
        id: 1,
        method: "GET".to_string(),
        uri: "https://www.baidu.com".to_string(),
        headers: HashMap::new(),
        body: None,
    };
    let event = JsFetchEvent {
        name: "fetch".to_string(),
        request,
    };
    let mut serializer = Serializer::from_context(context)?;
    event.serialize(&mut serializer)?;
    let event_value = serializer.value;
    // set respondWith function
    let respond_with = JS_EVENT_RESPOND_WITH.get().unwrap();
    event_value.set_property("respondWith", respond_with.deref().clone())?;

    match handler.call(&global, &[event_value]) {
        Ok(result) => {
            println!("result: {:?}", result.as_str().unwrap());
            let body = result.as_str().unwrap().to_string();
            let resp = http::Response::builder()
                .status(200)
                .body(Some(Bytes::from(body)))
                .unwrap();
            Ok(resp)
        }
        Err(e) => {
            println!("e: {:?}", e);
            Ok(http::Response::builder()
                .status(500)
                .body(Some(Bytes::from(e.to_string())))
                .unwrap())
        }
    }
}
