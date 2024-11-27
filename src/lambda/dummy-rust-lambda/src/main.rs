use aws_lambda_events::event::eventbridge::EventBridgeEvent;
use lambda_runtime::{run, service_fn, tracing, Error, LambdaEvent};
use serde::Deserialize;

#[derive(Deserialize, Debug)]
struct ActionEvent {
    #[serde(rename = "ACTION")]
    action: String,
}

async fn function_handler(
    event: LambdaEvent<EventBridgeEvent>,
) -> Result<(), Error> {
    let db_cluster_identifier = std::env::var("DB_CLUSTER_IDENTIFIER")
        .expect("Expected DB_CLUSTER_IDENTIFIER env to be defined")?;

    let (event_payload, _) = event.into_parts();
    let event_action: ActionEvent = serde_json::from_value(event_payload.detail)
        .expect("Expected deserialization of event detail into ActionEvent to succeed")?;

    tracing::info!("ACTION: {}", event_action.action);

    match event_action.action.as_str() {
        "FOO" => do_foo().await,
        "BAR" => do_bar().await,
        _ => {
            tracing::warn!("Unknown action: {}", event_action.action);
        }
    }

    Ok(())
}

async fn do_foo() {
    println!("Do FOO");
}

async fn do_bar() {
    println!("Do BAR");
}

#[tokio::main]
async fn main() -> Result<(), Error> {
    tracing::init_default_subscriber();

    let shared_config = aws_config::load_defaults(aws_config::BehaviorVersion::latest()).await;
    let func = service_fn(|event| function_handler(event));

    run(func).await?;

    Ok(())
}
