use std::collections::HashMap;
use yellowstone_grpc_proto::{
    geyser::{CommitmentLevel, SubscribeRequestFilterTransactions},
    prelude::SubscribeRequest,
};

pub async fn get_subscribe_request() -> SubscribeRequest {
    let mut transactions = HashMap::new();
    transactions.insert(
        "lp1".to_string(),
        SubscribeRequestFilterTransactions {
            vote: None,
            failed: None,
            account_include: vec!["6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P".to_string()],
            account_exclude: vec![],
            account_required: vec![],
            signature: None,
        },
    );

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
