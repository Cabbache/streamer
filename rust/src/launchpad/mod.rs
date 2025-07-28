mod meteora;
mod pumpfun;

pub trait LaunchPad {
	fn account_include(&self) -> Vec<String>;
	fn discriminator(&self) -> Vec<u8>;
	fn name(&self) -> String;
}

pub fn get_launchpads() -> Vec<Box<dyn LaunchPad>> {
	vec![Box::new(meteora::Meteora {}), Box::new(pumpfun::PumpFun {})]
}
