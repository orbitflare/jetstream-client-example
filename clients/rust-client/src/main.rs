mod connector;
use clap::Parser;
use env_logger::Env;
pub mod decoder;

use connector::config::ClientConfig;
use tokio::sync::watch;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    env_logger::Builder::from_env(Env::default().default_filter_or("info"))
        .format_timestamp_secs()
        .init();

    let config = ClientConfig::parse();

    log::info!("Starting JetStream Example Client");

    let (shutdown_tx, shutdown_rx) = watch::channel(false);

    if config.parsed_enabled {
        connector::parsed::jetstream_parsed_connector(config, shutdown_rx).await?;
    } else {
        connector::connector::jetstream_connector(config).await?;
    }

    tokio::spawn(async move {
        match tokio::signal::ctrl_c().await {
            Ok(()) => {
                log::info!("Received Ctrl+C signal, initiating shutdown...");
                let _ = shutdown_tx.send(true);
                Ok(())
            }
            Err(err) => {
                eprintln!("Error setting up Ctrl+C handler: {}", err);
                Err(())
            }
        }
    });

    Ok(())
}
