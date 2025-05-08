import { fetchPools, parseArgs } from './fetch';

async function main() {
  const args = parseArgs();
  await fetchPools(args);
}

await main();
