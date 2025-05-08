import { ChainId } from '@uniswap/sdk-core';

import { fetchPools } from './fetch';

import type { PoolsArgs } from './fetch';

const pools: PoolsArgs[] = [
  { chainId: ChainId.SEPOLIA, version: 3, whitelist: true, reserve: 0 },
  { chainId: ChainId.ARBITRUM_SEPOLIA, version: 3, whitelist: true, reserve: 0 },
  { chainId: ChainId.MAINNET, version: 2, whitelist: true },
  { chainId: ChainId.MAINNET, version: 3, whitelist: true },
  { chainId: ChainId.ARBITRUM_ONE, version: 2, whitelist: true },
  { chainId: ChainId.ARBITRUM_ONE, version: 3, whitelist: true },
];

async function main() {
  console.info('Fetching all uniswap pools...');

  for (const poolArgs of pools) {
    try {
      await fetchPools(poolArgs);
    } catch {
      console.info(`[${poolArgs.chainId}] Fetching error, skip;`);
    }
  }

  console.info('Fetching completed!');
}

await main();
