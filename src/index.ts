import Client, {
	SubscribeRequest,
	SubscribeUpdate,
} from "@triton-one/yellowstone-grpc";
import { ClientDuplexStream } from "@grpc/grpc-js";

import { publishToQueue, connectRabbitMQ } from "./utils/rabbitmq";
import PumpFunDecoder from "./decoders/pumpfun";
import { Launchpads, Launchpad } from "./types/launchpads";

import { createSubscribeRequest } from "./utils/subscription";

const RABBIT_URI =
	process.env.RABBIT_URI || "amqp://guest:guest@localhost:5672";
const QUEUE_NAME = "mints";
const GRPC_ENDPOINT = "http://78.138.105.2:9547";

const launchpads: Launchpads = {
	pumpFun: {
		filter: {
			accountInclude: ["6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P"],
			accountExclude: [],
			accountRequired: [],
		},
		discriminator: Buffer.from([24, 30, 200, 40, 5, 28, 7, 119]),
		decoder: PumpFunDecoder,
	},
	/*
	raydium: {
		filter: {
			accountInclude: ["DRay6fNdQ5J82H7xV6uq2aV3mNrUZ1J4PgSKsWgptcm6", "DRaycpLY18LhpbydsBWbVJtxpNv9oXPgjRSfpF2bWpYb", "DRaya7Kj3aMWQSy19kSjvmuwq9docCHofyP9kanQGaav", "DRayDdXc1NZQ9C3hRWmoSf8zK4iapgMnjdNZWrfwsP8m", "DRayAUgENGQBKVaX8owNhgzkEDyoHTGVEGHVJT1E9pfH", "DRay25Usp3YJAi7beckgpGUC7mGJ2cR1AVPxhYfwVCUX", "DRaybByLpbUL57LJARs3j8BitTxVfzBg351EaMr5UTCd", "DRayWyrLmEW5KEeqs8kdTMMaBabapqagaBC7KWpGtJeZ", "DRayiCGSZgku1GTK6rXD6mVDdingXy6APAH1R6R5L2LC", "DRayzbYakXs45ELHkzH6vC3fuhQqTAnv5A68gdFuvZyZ"],
			accountExclude: [],
			accountRequired: []
		},
		discriminator: Buffer.from([]),
		decoder: () => { }
	},
	meteora: {
		filter: {
			accountInclude: ["LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo", "Eo7WjKq67rjJQSZxS6z3YkapzY3eMj6Xy8X5EQVn5UaB", "cpamdpZCGKUy5JxQXB4dcpGPiikHawvSWAd6mEn1sGG", "dbcij3LWUppWqq96dh6gJWwBifmcGfLSB5D4DuSMaqN", "vaU6kP7iNEGkbmPkLmZfGwiGxd4Mob24QQCie5R9kd2"],
			accountExclude: [],
			accountRequired: []
		},
		discriminator: Buffer.from([]),
		decoder: () => { }
	},
	*/
};

function sendSubscribeRequest(
	stream: ClientDuplexStream<SubscribeRequest, SubscribeUpdate>,
	request: SubscribeRequest,
): Promise<void> {
	return new Promise<void>((resolve, reject) => {
		stream.write(request, (err: Error | null) => {
			if (err) {
				reject(err);
			} else {
				resolve();
			}
		});
	});
}

function handleStreamEvents(
	stream: ClientDuplexStream<SubscribeRequest, SubscribeUpdate>,
): Promise<void> {
	return new Promise<void>((resolve, reject) => {
		stream.on("data", handleData);
		stream.on("error", (error: Error) => {
			console.error("Stream error:", error);
			reject(error);
			stream.end();
		});
		stream.on("end", () => {
			console.log("Stream ended");
			resolve();
		});
		stream.on("close", () => {
			console.log("Stream closed");
			resolve();
		});
	});
}

function handleData(data: SubscribeUpdate): void {
	if (data.filters.length === 0) {
		return;
	}
	if (data.filters.length > 1)
		throw new Error(`unexpected: hit more than 1 filter: ${data.filters}`);

	const filter_launchpad = data.filters[0];
	if (!(filter_launchpad in launchpads))
		throw new Error(`unexpected: unknown launchpad: ${filter_launchpad}`);

	const launchpad: Launchpad = launchpads[filter_launchpad];
	let formattedData = launchpad.decoder(data, launchpad.discriminator);
	if (!formattedData) {
		return;
	}
	formattedData = { ...formattedData, launchpad: filter_launchpad };

	console.table(formattedData);
	publishToQueue(QUEUE_NAME, formattedData);
}

// Main function
async function main(): Promise<void> {
	try {
		await connectRabbitMQ(RABBIT_URI, QUEUE_NAME);
		console.log("Connected to RabbitMQ");
		// ... start streamer logic here
	} catch (error) {
		console.error("Failed to connect to RabbitMQ", error);
		process.exit(1);
	}

	const client = new Client(GRPC_ENDPOINT, "some auth token", {});
	const stream = await client.subscribe();
	const request = createSubscribeRequest(launchpads);

	try {
		await sendSubscribeRequest(stream, request);
		console.log("Geyser connection established.\n");
		await handleStreamEvents(stream);
	} catch (error) {
		console.error("Error in subscription process:", error);
		stream.end();
	}
}

main().catch((err) => {
	console.error("Unhandled error in main:", err);
	process.exit(1);
});
