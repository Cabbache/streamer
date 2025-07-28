use futures_util::StreamExt;

use rabbit::RabbitWrapper;
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

	let sub_request = get_subscribe_request().await;
	let (mut sub_tx, mut stream) = client.subscribe_with_request(Some(sub_request)).await?;
	println!("stream opened");
	while let Some(msg) = stream.next().await {
		match msg {
			Ok(msg) => {
				println!("{:?}", msg.filters);
			}
			Err(e) => eprintln!("error: {:?}", e),
		}
	}
	Ok(())
}
