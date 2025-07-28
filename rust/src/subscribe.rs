use std::collections::HashMap;
use yellowstone_grpc_proto::{
	geyser::{CommitmentLevel, SubscribeRequestFilterTransactions},
	prelude::SubscribeRequest,
};

use crate::launchpad::get_launchpads;

pub async fn get_subscribe_request() -> SubscribeRequest {
	let transactions = get_launchpads()
		.iter()
		.map(|lp| {
			(
				lp.name(),
				SubscribeRequestFilterTransactions {
					vote: None,
					failed: None,
					account_include: lp.account_include(),
					account_exclude: vec![],
					account_required: vec![], //I am aware this can be optimised
					signature: None,
				},
			)
		})
		.collect::<HashMap<String, SubscribeRequestFilterTransactions>>();

	SubscribeRequest {
		slots: HashMap::new(),
		accounts: HashMap::new(),
		transactions,
		transactions_status: HashMap::new(),
		entry: HashMap::new(),
		blocks: HashMap::new(),
		blocks_meta: HashMap::new(),
		commitment: Some(CommitmentLevel::Confirmed.into()),
		accounts_data_slice: vec![],
		ping: None,
		from_slot: None,
	}
}
