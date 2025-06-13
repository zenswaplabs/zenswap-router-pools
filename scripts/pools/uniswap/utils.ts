export enum ChainId {
  // Ethereum
  EthereumMainnet = 1,
  EthereumSepolia = 11155111,
  // Binance Smart Chain
  BnbMainnet = 56,
  BnbTestnet = 97,
  // Polygon
  PolygonMainnet = 137,
  PolygonAmoy = 80002,
  // Avalanche
  AvalancheMainnet = 43114,
  AvalancheFuji = 43113,
  // Arbitrum
  ArbitrumMainnet = 42161,
  ArbitrumSepolia = 421614,
  // Base
  BaseMainnet = 8453,
  BaseSepolia = 84532,
  // Optimism
  OptimismMainnet = 10,
  OptimismSepolia = 11155420,
  // Blast
  BlastMainnet = 81457,
  BlastSepolia = 168587773,
  // Celo
  CeloMainnet = 42220,
  CeloAlfajores = 44787,
  // Unichain
  UnichainMainnet = 130,
  UnichainSepolia = 1301,
  // Worldchain
  WorldchainMainnet = 480,
  WorldchainSepolia = 4801,
}

export enum NetworkId {
  EthereumMainnet = "mainnet",
  EthereumSepolia = "sepolia",
  BnbMainnet = "bnb-mainnet",
  BnbTestnet = "bnb-testnet",
  PolygonMainnet = "polygon-mainnet",
  PolygonAmoy = "polygon-amoy",
  AvalancheMainnet = "avalanche-mainnet",
  AvalancheFuji = "avalanche-fuji",
  ArbitrumMainnet = "arbitrum-mainnet",
  ArbitrumSepolia = "arbitrum-sepolia",
  BaseMainnet = "base-mainnet",
  BaseSepolia = "base-sepolia",
  OptimismMainnet = "optimism-mainnet",
  OptimismSepolia = "optimism-sepolia",
  BlastMainnet = "blast-mainnet",
  BlastSepolia = "blast-sepolia",
  CeloMainnet = "celo-mainnet",
  CeloAlfajores = "celo-alfajores",
  UnichainMainnet = "unichain-mainnet",
  UnichainSepolia = "unichain-sepolia",
  WorldchainMainnet = "worldchain-mainnet",
  WorldchainSepolia = "worldchain-sepolia",
}

export function getNetworkId(chainId: number): NetworkId {
  switch (chainId) {
    case ChainId.EthereumMainnet:
      return NetworkId.EthereumMainnet;
    case ChainId.EthereumSepolia:
      return NetworkId.EthereumSepolia;
    case ChainId.BnbMainnet:
      return NetworkId.BnbMainnet;
    case ChainId.BnbTestnet:
      return NetworkId.BnbTestnet;
    case ChainId.PolygonMainnet:
      return NetworkId.PolygonMainnet;
    case ChainId.PolygonAmoy:
      return NetworkId.PolygonAmoy;
    case ChainId.AvalancheMainnet:
      return NetworkId.AvalancheMainnet;
    case ChainId.AvalancheFuji:
      return NetworkId.AvalancheFuji;
    case ChainId.ArbitrumMainnet:
      return NetworkId.ArbitrumMainnet;
    case ChainId.ArbitrumSepolia:
      return NetworkId.ArbitrumSepolia;
    case ChainId.OptimismMainnet:
      return NetworkId.OptimismMainnet;
    case ChainId.OptimismSepolia:
      return NetworkId.OptimismSepolia;
    case ChainId.BaseMainnet:
      return NetworkId.BaseMainnet;
    case ChainId.BaseSepolia:
      return NetworkId.BaseSepolia;
    case ChainId.BlastMainnet:
      return NetworkId.BlastMainnet;
    case ChainId.BlastSepolia:
      return NetworkId.BlastSepolia;
    case ChainId.CeloMainnet:
      return NetworkId.CeloMainnet;
    case ChainId.CeloAlfajores:
      return NetworkId.CeloAlfajores;
    case ChainId.UnichainMainnet:
      return NetworkId.UnichainMainnet;
    case ChainId.UnichainSepolia:
      return NetworkId.UnichainSepolia;
    case ChainId.WorldchainMainnet:
      return NetworkId.WorldchainMainnet;
    case ChainId.WorldchainSepolia:
      return NetworkId.WorldchainSepolia;
    default:
      throw new Error(`Network id is not defined for chain id ${chainId}`);
  }
}
