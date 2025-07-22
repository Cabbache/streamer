import { SubscribeUpdate } from "@triton-one/yellowstone-grpc";
import {
  matchesInstructionDiscriminator,
  isSubscribeUpdateTransaction,
} from "../utils/transaction";
import { PublicKey } from "@solana/web3.js";
import { Message, FormattedTransactionData } from "../types/transaction";
import bs58 from "bs58";

export default function PumpFunDecoder(
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

  const formattedSignature = convertSignature(transaction.signature);
  const formattedData = formatData(
    message,
    formattedSignature.base58,
    data.transaction.slot,
    discriminator,
  );

  return formattedData;
}

export function formatData(
  message: Message,
  signature: string,
  slot: string,
  discriminator: Buffer,
): FormattedTransactionData | undefined {
  const matchingInstruction = message.instructions.find((ix) =>
    matchesInstructionDiscriminator(ix, discriminator),
  );

  if (!matchingInstruction) {
    return undefined;
  }

  const accountKeys = message.accountKeys;
  const ACCOUNTS_TO_INCLUDE = [
    {
      name: "mint",
      index: 0,
    },
  ];
  const includedAccounts = ACCOUNTS_TO_INCLUDE.reduce<Record<string, string>>(
    (acc, { name, index }) => {
      const accountIndex = matchingInstruction.accounts[index];
      const publicKey = accountKeys[accountIndex];
      acc[name] = new PublicKey(publicKey).toBase58();
      return acc;
    },
    {},
  );

  return {
    signature,
    slot,
    ...includedAccounts,
  };
}

function convertSignature(signature: Uint8Array): { base58: string } {
  return { base58: bs58.encode(Buffer.from(signature)) };
}
