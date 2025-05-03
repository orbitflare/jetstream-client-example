use clap::Parser;
use env_logger::Env;

use jetstream_client_example::config::ClientConfig;
use jetstream_client_example::jetstream_connector;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // Set up simple logging
    env_logger::Builder::from_env(Env::default().default_filter_or("info"))
        .format_timestamp_secs()
        .init();

    // Parse command-line arguments
    let config = ClientConfig::parse();

    log::info!("Starting JetStream Example Client");

    // Connect to JetStream and process transactions
    jetstream_connector(config).await?;

    Ok(())
}
