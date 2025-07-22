import {
  SubscribeUpdate,
  SubscribeUpdateTransaction,
} from "@triton-one/yellowstone-grpc";
import { CompiledInstruction } from "../types/transaction";

export function isSubscribeUpdateTransaction(
  data: SubscribeUpdate,
): data is SubscribeUpdate & { transaction: SubscribeUpdateTransaction } {
  return (
    "transaction" in data &&
    typeof data.transaction === "object" &&
    data.transaction !== null &&
    "slot" in data.transaction &&
    "transaction" in data.transaction
  );
}

export function matchesInstructionDiscriminator(
  ix: CompiledInstruction,
  discriminator: Buffer,
): boolean {
  if (!ix?.data || !discriminator || discriminator.length === 0) return false;

  const ixBuffer = Buffer.from(ix.data);
  return ixBuffer.subarray(0, discriminator.length).equals(discriminator);
}
