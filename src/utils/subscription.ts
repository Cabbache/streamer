import {
  CommitmentLevel,
  SubscribeRequest,
} from "@triton-one/yellowstone-grpc";
import { Launchpads } from "../types/launchpads";

export const createSubscribeRequest = (
  launchpads: Launchpads,
): SubscribeRequest => ({
  accounts: {},
  slots: {},
  transactions: Object.fromEntries(
    Object.entries(launchpads).map(([name, data]) => [name, data.filter]),
  ),
  transactionsStatus: {},
  entry: {},
  blocks: {},
  blocksMeta: {},
  commitment: CommitmentLevel.CONFIRMED,
  accountsDataSlice: [],
  ping: undefined,
});
