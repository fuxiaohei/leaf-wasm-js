use anyhow::Result;
use bytes::Bytes;
use leaf_sdk::http::{Request, Response};
use leaf_sdk_macro::http_main;
use once_cell::sync::OnceCell;
use quickjs_wasm_rs::Context;
use send_wrapper::SendWrapper;
use std::str::FromStr;

static JS_CONTEXT: OnceCell<SendWrapper<Context>> = OnceCell::new();

fn init_js_context() -> Result<()> {
    let context = Context::default();
    JS_CONTEXT.set(SendWrapper::new(context)).unwrap();
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
    let input_script = String::from("let a = 1;a + 2");

    let context = JS_CONTEXT.get().unwrap();
    let eval_result = context.eval_global("index.js", input_script.as_str());

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
