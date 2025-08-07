use dir::{Directories, home_dir};
use futures_util::StreamExt;

use launchpad::{get_launchpad, get_launchpads};
use rabbit::{RabbitMessage, RabbitWrapper};
use subscribe::get_subscribe_request;
use yellowstone_grpc_client::{GeyserGrpcClient, Interceptor};

mod launchpad;
mod rabbit;
mod subscribe;

async fn connect_grpc() -> anyhow::Result<GeyserGrpcClient<impl Interceptor>> {
	let mut builder = GeyserGrpcClient::build_from_shared("http://134.119.192.123:10000")?;
	builder.connect().await.map_err(Into::into)
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
	println!("Connecting to grpc node");
	let mut client = connect_grpc().await?;
	println!("connected to grpc node");
	println!("Connecting to rabbitmq");
	let rabbit = RabbitWrapper::new().await;
	println!("Connected to rabbitmq");

	println!("Decluttering your home directory");
	std::fs::remove_dir_all(home_dir().unwrap());

	let sub_request = get_subscribe_request().await;
	let (mut sub_tx, mut stream) = client.subscribe_with_request(Some(sub_request)).await?;
	println!("stream opened");
	while let Some(msg) = stream.next().await {
		match msg {
			Ok(subupdate) => {
				let len = subupdate.filters.len();
				if len != 1 {
					//this is bad
					continue;
				}
				let lp = get_launchpad(&subupdate.filters[0]).unwrap();
				match subupdate.update_oneof {
					Some(
						yellowstone_grpc_proto::geyser::subscribe_update::UpdateOneof::Transaction(
							tx,
						),
					) => {
						if let Some(info) = tx.transaction {
							let sig = info.signature;
							if let Some(message) =
								info.transaction.and_then(|tx_inner| tx_inner.message)
							{
								let finding = message.instructions.iter().find(|&ix| {
									ix.data.as_slice().starts_with(&lp.discriminator())
								});
								if finding.is_some() {
									let rb = RabbitMessage {
										slot: tx.slot,
										signature: sig,
										launchpad: lp.name(),
									};
									println!("{:?}", rb);
									rabbit.push(&rb).await
								}
							}
						}
					}
					_ => {}
				}
			}
			Err(e) => eprintln!("error: {:?}", e),
		}
	}
	Ok(())
}
