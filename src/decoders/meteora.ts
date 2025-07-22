import { SubscribeUpdate } from "@triton-one/yellowstone-grpc";
import {
  matchesInstructionDiscriminator,
  isSubscribeUpdateTransaction,
} from "../utils/transaction";
import { PublicKey } from "@solana/web3.js";
import { Message, FormattedTransactionData } from "../types/transaction";
import bs58 from "bs58";

export default function MeteoraDecoder(
  data: SubscribeUpdate,
  discriminator: Buffer,
) {
  const transaction = data.transaction?.transaction;
  const message = transaction?.transaction?.message;

  if (!transaction || !message || !data.transaction) {
    console.log("no transaction or message");
    return;
  }

  const matchingInstruction = message.instructions.find((ix) =>
    matchesInstructionDiscriminator(ix, discriminator),
  );
  if (!matchingInstruction) {
    return;
  }

  return {
    slot: data.transaction.slot,
  };
}
