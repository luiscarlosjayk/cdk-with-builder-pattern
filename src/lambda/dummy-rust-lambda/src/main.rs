use lambda_runtime::{run, service_fn, tracing, Error, LambdaEvent};
use serde_json::Value;

async fn function_handler(
    event: LambdaEvent<Value>,
) -> Result<(), Error> {
    let (event_payload, _) = event.into_parts();

    tracing::info!("Payload: {}", event_payload);

    Ok(())
}

#[tokio::main]
async fn main() -> Result<(), Error> {
    tracing::init_default_subscriber();

    let func = service_fn(function_handler);

    run(func).await?;

    Ok(())
}
