use bytes::Bytes;
use leaf_sdk::http::{Request, Response};
use leaf_sdk_macro::http_main;
use quickjs_wasm_rs::Context;
use std::str::FromStr;

#[export_name = "wizer.initialize"]
pub extern "C" fn init() {
    println!("wizer initialize");
}

#[http_main]
pub fn handle_sdk_http(req: Request) -> Response {
    handle_request(req)
}

pub fn handle_request(_req: Request) -> Response {
    let input_script = String::from("let a = 1;a + 2");

    let context = Context::default();
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
