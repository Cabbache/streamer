use lapin::{
	BasicProperties, Connection, ConnectionProperties,
	options::{BasicPublishOptions, QueueDeclareOptions},
	types::FieldTable,
};
const QUEUE: &'static str = "launchpads";

pub struct RabbitWrapper {
	channel: lapin::Channel,
}

impl RabbitWrapper {
	pub async fn new() -> Self {
		// Connect to RabbitMQ
		let addr = "amqp://127.0.0.1:5672/%2f";
		let conn = Connection::connect(addr, ConnectionProperties::default())
			.await
			.expect("connection error");

		println!("connected to rabbitmq");
		// Create a channel
		let channel = conn.create_channel().await.expect("create_channel");

		// Declare a queue
		let queue = channel
			.queue_declare(QUEUE, QueueDeclareOptions::default(), FieldTable::default())
			.await
			.expect("queue_declare");

		println!("Declared queue {:?}", queue);
		Self { channel }
	}

	pub async fn push(&self, data: String) {
		self.channel
			.basic_publish(
				"",
				QUEUE,
				BasicPublishOptions::default(),
				data.as_bytes(),
				BasicProperties::default(),
			)
			.await
			.expect("basic_publish")
			.await
			.expect("publisher confirm");
	}
}
