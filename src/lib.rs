use anyhow::Result;
use bytes::Bytes;
use leaf_sdk::http::{Request, Response};
use leaf_sdk_macro::http_main;
use once_cell::sync::OnceCell;
use quickjs_wasm_rs::{Context, Value};
use send_wrapper::SendWrapper;
use serde::{Deserialize, Serialize};
use serde_bytes::ByteBuf;
use std::collections::HashMap;
use std::io::{self, Read};
use std::str::FromStr;

static JS_VENDOR: &str = include_str!("./js/vendor.js");
static JS_CONTEXT: OnceCell<SendWrapper<Context>> = OnceCell::new();
static JS_GLOBAL: OnceCell<SendWrapper<Value>> = OnceCell::new();
static JS_HANDLER: OnceCell<SendWrapper<Value>> = OnceCell::new();

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

fn init_js_context() -> Result<()> {
    let mut script = String::new();
    io::stdin().read_to_string(&mut script)?;

    let context = Context::default();

    // load vendor
    let _ = context.eval_global("vendor.js", JS_VENDOR)?;
    // load source
    let _ = context.eval_global("script.js", &script)?;

    let global = context.global_object()?;
    let handler = global.get_property("globalFetchHandler")?;

    JS_CONTEXT.set(SendWrapper::new(context)).unwrap();
    JS_GLOBAL.set(SendWrapper::new(global)).unwrap();
    JS_HANDLER.set(SendWrapper::new(handler)).unwrap();

    Ok(())
}

#[export_name = "wizer.initialize"]
pub extern "C" fn init() {
    println!("js context initialize");
    init_js_context().unwrap();
}

#[http_main]
pub fn handle_sdk_http(req: Request) -> Response {
    handle_request(req)
}

pub fn handle_request(_req: Request) -> Response {
    let context = JS_CONTEXT.get().unwrap();
    let global = JS_GLOBAL.get().unwrap();
    let handler = JS_HANDLER.get().unwrap();

    let arg = context.value_from_str("testing").unwrap();
    let eval_result = handler.call(&global, &[arg]);
    if eval_result.is_err() {
        return http::Response::builder()
            .status(500)
            .body(Some(Bytes::from(eval_result.err().unwrap().to_string())))
            .unwrap();
    }

    let body = eval_result.unwrap().as_str().unwrap().to_string();
    let resp = http::Response::builder()
        .status(200)
        .body(Some(Bytes::from(body)))
        .unwrap();
    resp
}
