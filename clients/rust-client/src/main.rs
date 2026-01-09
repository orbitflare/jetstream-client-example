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

    log::info!("Starting Jetstream Example Client");

    let (shutdown_tx, mut shutdown_rx) = watch::channel(false);

    let shutdown_tx_clone = shutdown_tx.clone();
    tokio::spawn(async move {
        match tokio::signal::ctrl_c().await {
            Ok(()) => {
                log::info!("Received Ctrl+C signal, initiating shutdown...");
                let _ = shutdown_tx_clone.send(true);
            }
            Err(err) => {
                eprintln!("Error setting up Ctrl+C handler: {}", err);
            }
        }
    });

    if config.parsed_enabled {
        connector::parsed::jetstream_parsed_connector(config, shutdown_rx).await?;
    } else {
        let mut connector_handle = tokio::spawn(async move {
            connector::connector::jetstream_connector(config).await
        });

        tokio::select! {
            result = &mut connector_handle => {
                match result {
                    Ok(Ok(())) => log::info!("Connector completed successfully"),
                    Ok(Err(e)) => return Err(e),
                    Err(e) => return Err(anyhow::anyhow!("Connector task panicked: {}", e)),
                }
            }
            Ok(()) = shutdown_rx.changed() => {
                if *shutdown_rx.borrow() {
                    log::info!("Shutdown signal received, aborting connector...");
                    connector_handle.abort();
                    let _ = connector_handle.await;
                }
            }
        }
    }

    Ok(())
}
