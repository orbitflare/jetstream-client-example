mod connector;
use clap::Parser;
use env_logger::Env;

use connector::config::ClientConfig;
use connector::jetstream_connector;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    env_logger::Builder::from_env(Env::default().default_filter_or("info"))
        .format_timestamp_secs()
        .init();

    let config = ClientConfig::parse();

    log::info!("Starting JetStream Example Client");

    jetstream_connector(config).await?;

    Ok(())
}
