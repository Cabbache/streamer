import Client, {
  SubscribeRequest,
  SubscribeUpdate,
} from "@triton-one/yellowstone-grpc";
import { ClientDuplexStream } from "@grpc/grpc-js";

import { publishToQueue, connectRabbitMQ } from "./utils/rabbitmq";
import PumpFunDecoder from "./decoders/pumpfun";
import MeteoraDecoder from "./decoders/meteora";
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
  meteora: {
    filter: {
      accountInclude: ["cpamdpZCGKUy5JxQXB4dcpGPiikHawvSWAd6mEn1sGG"],
      accountExclude: [],
      accountRequired: [],
    },
    discriminator: Buffer.from([95, 180, 10, 172, 84, 174, 232, 40]), //initialize_pool
    decoder: MeteoraDecoder,
  },
  /*
	raydium: {
		filter: {
			accountInclude: ["DRay6fNdQ5J82H7xV6uq2aV3mNrUZ1J4PgSKsWgptcm6"],
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
  if (data.filters.length > 1) {
    console.log(`unexpected: hit more than 1 filter: ${data.filters}`);
    return;
  }

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

async function main(): Promise<void> {
  try {
    await connectRabbitMQ(RABBIT_URI, QUEUE_NAME);
    console.log("Connected to RabbitMQ");
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
