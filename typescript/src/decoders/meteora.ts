import { SubscribeUpdate } from "@triton-one/yellowstone-grpc";
import {
  matchesInstructionDiscriminator,
  convertSignature,
} from "../utils/transaction";

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

  const signature_buf = data.transaction?.transaction?.signature;
  let signature = null;
  if (signature_buf) signature = convertSignature(signature_buf);

  //console.log(matchingInstruction);

  return {
    slot: data.transaction.slot,
    signature: signature,
  };
}
