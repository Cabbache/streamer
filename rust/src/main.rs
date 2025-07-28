use futures_util::StreamExt;
use subscribe::get_subscribe_request;
use yellowstone_grpc_client::{GeyserGrpcClient, Interceptor};

mod subscribe;

async fn connect() -> anyhow::Result<GeyserGrpcClient<impl Interceptor>> {
    let mut builder = GeyserGrpcClient::build_from_shared("http://134.119.192.123:10000")?;
    builder.connect().await.map_err(Into::into)
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    println!("Connecting");
    let mut client = connect().await?;
    println!("connected");

    let sub_request = get_subscribe_request().await;

    let (mut sub_tx, mut stream) = client.subscribe_with_request(Some(sub_request)).await?;
    while let Some(msg) = stream.next().await {
        match msg {
            Ok(msg) => {
                println!("{:?}", msg);
            }
            Err(e) => eprintln!("{:?}", e),
        }
    }
    println!("stream opened");
    Ok(())
}
