export type Launchpad = {
  filter: {
    accountInclude: string[];
    accountExclude: string[];
    accountRequired: string[];
  };
  discriminator: Buffer;
  decoder: (...args: any[]) => any;
};

export type Launchpads = Record<string, Launchpad>;
