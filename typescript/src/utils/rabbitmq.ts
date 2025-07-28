import amqp from "amqplib";
let channel: amqp.Channel;

export async function connectRabbitMQ(uri: string, queue: string) {
  const connection = await amqp.connect(uri);
  channel = await connection.createChannel();
  await channel.assertQueue(queue, { durable: true });
}

export function publishToQueue(queue: string, data: any) {
  if (!channel) {
    console.error("RabbitMQ channel not initialized.");
    return;
  }

  const message = Buffer.from(JSON.stringify(data));
  channel.sendToQueue(queue, message, { persistent: true });
}
