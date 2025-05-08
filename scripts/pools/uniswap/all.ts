import { ChainId } from '@uniswap/sdk-core';

import { fetchPools } from './fetch';

const mainnets = [
  ChainId.MAINNET,
  ChainId.ARBITRUM_ONE,
  ChainId.BASE,
  // ChainId.POLYGON,
  // ChainId.UNICHAIN,
  // ChainId.OPTIMISM,
];

const testnets = [
  ChainId.SEPOLIA,
  ChainId.ARBITRUM_SEPOLIA,
  ChainId.BASE_SEPOLIA,
  // ChainId.UNICHAIN_SEPOLIA
];

const versions = [2, 3, 4];

async function fetchChainsPools(chains: ChainId[], whitelist: boolean, reserve?: number): Promise<void> {
  for (const chainId of chains) {
    for (const version of versions) {
      try {
        await fetchPools({ chainId, version, reserve, whitelist });
      } catch {
        console.info(`[${chainId}] Fetching error, skip;`);
      }
    }
  }
}

async function main() {
  console.info('Fetching all uniswap pools...');

  await fetchChainsPools(testnets, false, 0);
  await fetchChainsPools(mainnets, true);

  console.info('Fetching completed!');
}

await main();
