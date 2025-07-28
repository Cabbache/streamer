use super::LaunchPad;

pub struct Meteora;

impl LaunchPad for Meteora {
	fn account_include(&self) -> Vec<String> {
		vec!["cpamdpZCGKUy5JxQXB4dcpGPiikHawvSWAd6mEn1sGG".to_string()]
	}

	fn discriminator(&self) -> Vec<u8> {
		vec![95, 180, 10, 172, 84, 174, 232, 40]
	}

	fn name(&self) -> String {
		"meteora".to_string()
	}
}
