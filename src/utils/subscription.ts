import {
  CommitmentLevel,
  SubscribeRequest,
} from "@triton-one/yellowstone-grpc";
import { Launchpads } from "../types/launchpads";

export function createSubscribeRequest(
  launchpads: Launchpads,
): SubscribeRequest {
  const filterObj = Object.fromEntries(
    Object.entries(launchpads).map(([name, data]) => [name, data.filter]),
  );
  console.log(filterObj);
  return {
    accounts: {},
    slots: {},
    transactions: filterObj,
    transactionsStatus: {},
    entry: {},
    blocks: {},
    blocksMeta: {},
    commitment: CommitmentLevel.CONFIRMED,
    accountsDataSlice: [],
    ping: undefined,
  };
}
