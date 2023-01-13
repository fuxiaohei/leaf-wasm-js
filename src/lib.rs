use anyhow::Result;
use bytes::Bytes;
use http::header::{HeaderName, HeaderValue};
use http::Request as httpRequest;
use leaf_sdk::http::{fetch, FetchOptions, Request, Response};
use leaf_sdk_macro::http_main;
use once_cell::sync::OnceCell;
use quickjs_wasm_rs::{Context, Deserializer, Serializer, Value};
use send_wrapper::SendWrapper;
use serde::{Deserialize, Serialize};
use serde_bytes::ByteBuf;
use std::time::Instant;
use std::{
    collections::HashMap,
    io::{self, Read},
    ops::Deref,
    str::FromStr,
};

static JS_VENDOR: &str = include_str!("./js_vendor/dist/main.js");
static JS_CONTEXT: OnceCell<SendWrapper<Context>> = OnceCell::new();
static JS_GLOBAL: OnceCell<SendWrapper<Value>> = OnceCell::new();
static JS_HANDLER: OnceCell<SendWrapper<Value>> = OnceCell::new();
static JS_RESPONSE_PROMISE_RESOLVE: OnceCell<SendWrapper<Value>> = OnceCell::new();
static JS_RESPONSE_PROMISE_REJECT: OnceCell<SendWrapper<Value>> = OnceCell::new();
static JS_EVENT_RESPOND_WITH: OnceCell<SendWrapper<Value>> = OnceCell::new();

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

fn leaf_fetch(context: &Context, _this: &Value, args: &[Value]) -> Result<Value> {
    match args {
        [value] => {
            let deserializer = &mut Deserializer::from(value.clone());
            let request = JsRequest::deserialize(deserializer)?;

            // build request from JsRequest
            let builder = httpRequest::builder()
                .method(request.method.as_str())
                .uri(&request.uri);
            let fetch_request: Request =
                builder.body(request.body.map(|buffer| buffer.to_vec().into()))?;

            // call fetch by host function from sdk
            let fetch_response = fetch(fetch_request, FetchOptions::default()).unwrap();

            // build JsResponse
            let mut headers = HashMap::new();
            fetch_response.headers().iter().for_each(|(key, value)| {
                headers.insert(
                    key.as_str().to_string(),
                    value.to_str().unwrap().to_string(),
                );
            });
            let body = match fetch_response.body() {
                Some(body) => Some(ByteBuf::from(body.to_vec())),
                None => None,
            };
            let response = JsResponse {
                status: fetch_response.status().into(),
                headers,
                body,
            };

            // serialize JsResponse to Value
            let mut serializer = Serializer::from_context(context)?;
            response.serialize(&mut serializer)?;
            Ok(serializer.value)
        }
        _ => Err(anyhow::anyhow!(
            "fetch expected 1 argument, got {}",
            args.len()
        )),
    }
}

fn init_js_context() -> Result<()> {
    let st = Instant::now();
    let mut script = String::new();
    io::stdin().read_to_string(&mut script)?;

    let context = Context::default();

    let global = context.global_object()?;

    // add console.log()
    let console = context.object_value()?;
    console.set_property("log", context.wrap_callback(console_log)?)?;
    global.set_property("console", console)?;

    // add leaf bindings
    let leaf = context.object_value()?;
    leaf.set_property("fetch", context.wrap_callback(leaf_fetch)?)?;
    global.set_property("leaf", leaf)?;

    // load vendor
    let _ = context.eval_global("vendor.js", JS_VENDOR)?;
    // load source
    let _ = context.eval_global("index.js", &script)?;

    context.execute_pending()?;

    // set global variables
    let handler = global.get_property("callGlobalFetchHandler")?;
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

    println!("init_js_context ok, cost {:?}", st.elapsed());
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

    // create input request object
    let request = JsRequest {
        id: 1,
        method: "GET".to_string(),
        uri: "https://www.baidu.com".to_string(),
        headers: HashMap::new(),
        body: Some(ByteBuf::from(bytes::Bytes::from("hello world"))),
    };
    let mut serializer = Serializer::from_context(context)?;
    request.serialize(&mut serializer)?;
    let request_value = serializer.value;

    match handler.call(&global, &[request_value]) {
        Ok(_) => {
            // it needs read body to response for Deserializer,
            // so we need to wait for the promise from response.arrayBuffer()
            context.execute_pending()?;

            let global = context.global_object()?;
            let response = global.get_property("globalResponse")?;
            let deserializer = &mut Deserializer::from(response);
            let response = JsResponse::deserialize(deserializer)?;

            let mut builder = http::Response::builder().status(response.status);
            if let Some(headers) = builder.headers_mut() {
                for (key, value) in &response.headers {
                    headers.insert(
                        HeaderName::try_from(key.deref())?,
                        HeaderValue::from_bytes(value.as_bytes())?,
                    );
                }
            }

            Ok(builder.body(response.body.map(|buffer| buffer.to_vec().into()))?)
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
