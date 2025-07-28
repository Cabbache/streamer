use super::LaunchPad;

pub struct PumpFun;

impl LaunchPad for PumpFun {
	fn account_include(&self) -> Vec<String> {
		vec!["6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P".to_string()]
	}

	fn discriminator(&self) -> Vec<u8> {
		vec![24, 30, 200, 40, 5, 28, 7, 119]
	}

	fn name(&self) -> String {
		"pumpfun".to_string()
	}
}
