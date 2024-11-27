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
    neptune_client: &aws_sdk_neptune::Client,
) -> Result<(), Error> {
    let db_cluster_identifier = std::env::var("DB_CLUSTER_IDENTIFIER")
        .expect("Expected DB_CLUSTER_IDENTIFIER env to be defined");

    let (event_payload, _) = event.into_parts();
    let event_action: ActionEvent = serde_json::from_value(event_payload.detail)
        .expect("Expected deserialization of event detail into ActionEvent to succeed");

    tracing::info!("DB_CLUSTER_IDENTIFIER: {}", db_cluster_identifier);
    tracing::info!("ACTION: {}", event_action.action);

    match event_action.action.as_str() {
        "START" => start_db_cluster(neptune_client, db_cluster_identifier).await?,
        "STOP" => stop_db_cluster(neptune_client, db_cluster_identifier).await?,
        _ => {
            tracing::warn!("Unknown action: {}", event_action.action);
        }
    }

    Ok(())
}

async fn start_db_cluster(
    neptune_client: &aws_sdk_neptune::Client,
    db_cluster_identifier: impl Into<String>,
) -> Result<(), Error> {
    neptune_client
    .start_db_cluster()
    .db_cluster_identifier(db_cluster_identifier.into())
    .send()
    .await?;

    Ok(())
}

async fn stop_db_cluster(
    neptune_client: &aws_sdk_neptune::Client,
    db_cluster_identifier: impl Into<String>,
) -> Result<(), Error> {
    neptune_client
        .stop_db_cluster()
        .db_cluster_identifier(db_cluster_identifier.into())
        .send()
        .await?;

    Ok(())
}

#[tokio::main]
async fn main() -> Result<(), Error> {
    tracing::init_default_subscriber();

    let shared_config = aws_config::load_defaults(aws_config::BehaviorVersion::latest()).await;
    let neptune_client = aws_sdk_neptune::Client::new(&shared_config);
    let func = service_fn(|event| function_handler(event, &neptune_client));

    run(func).await?;

    Ok(())
}
