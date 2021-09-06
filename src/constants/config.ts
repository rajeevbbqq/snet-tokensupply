const config: Config = {
  infuraId: process.env.INFURA_ID,
  tokens: [
    {
      name: "AGIX",
      symbol: "agix",
      address: "0x5B7533812759B45C2B44C19e320ba2cD2681b542",
      excludeBalancesOf: ["0x2ff22f87fdc01ecc235126b98ddc00f70dd2ae0b"],
    },
    {
      name: "SDAO",
      symbol: "sdao",
      address: "0x993864e43caa7f7f12953ad6feb1d1ca635b875f",
      excludeBalancesOf: ["0x1bf5c3feb4e12185b32fcb2ccf7088147bae21c4", "0x834c38045918d3285b9605b590d6fee39f40e16f", "0xf0e37ee95cd28c21f16230416c17fb8c1ac59e6f", "0x03df3e4dc8fbe086099242b6dd7c58118a33ad23", "0xd4988582e5ec267e68ba03dcea3ba1fd346a2c56", "0x10a26e27bdbadcf6e5dfc8584108f3024678d5de"],
    },
  ],
  defaultTokenSymbol: "agix",
};

type Config = {
  infuraId: string;
  tokens: Token[];
  defaultTokenSymbol: string;
};

type Token = {
  name: string;
  symbol: string;
  address: string;
  excludeBalancesOf: string[];
};

export default config;
