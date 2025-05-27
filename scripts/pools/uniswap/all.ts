import { ChainId } from '@uniswap/sdk-core';

import { fetchPools } from './fetch';

type ChainConfig = {
  chainId: number;
  whitelist: boolean;
  reserve?: number;
};

const mainnets: ChainConfig[] = [
  { chainId: ChainId.MAINNET, whitelist: true },
  { chainId: ChainId.ARBITRUM_ONE, whitelist: true },
  { chainId: ChainId.BASE, whitelist: true },
  { chainId: ChainId.AVALANCHE, whitelist: true },
];

const testnets: ChainConfig[] = [
  { chainId: ChainId.SEPOLIA, whitelist: true, reserve: 0 },
  { chainId: ChainId.ARBITRUM_SEPOLIA, whitelist: true, reserve: 0 },
  { chainId: ChainId.BASE_SEPOLIA, whitelist: true, reserve: 0 },
];

const versions = [2, 3];

async function fetchChainsPools(chainConfigs: ChainConfig[]): Promise<void> {
  for (const config of chainConfigs) {
    for (const version of versions) {
      try {
        await fetchPools({ ...config, version });
      } catch {
        console.info(`[${config.chainId}] Fetching error, skip;`);
      }
    }
  }
}

async function main() {
  console.info('Fetching all uniswap pools...');

  await fetchChainsPools(testnets);
  await fetchChainsPools(mainnets);

  console.info('Fetching completed!');
}

await main();
