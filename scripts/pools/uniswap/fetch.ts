import { ID_TO_NETWORK_NAME } from '@uniswap/smart-order-router';

import fs from 'fs';

import { getProvider } from './provider';

const apiKey = '606af22308a2e5690afe6ef924423911';

// query varibles
const pageSize = 100;
const TRACKED_RESERVE_ETH_DEFAULT = 0.1;

function readLocalFile(dir: string, filename: string): string | null {
  const path = `${dir}/${filename}`;

  if (fs.existsSync(path)) {
    return fs.readFileSync(path, { encoding: 'utf8', flag: 'r' });
  } else {
    return null;
  }
}

function writeLocalFile(dir: string, filename: string, data: string, append = false): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }

  const path = `${dir}/${filename}`;
  const method = append ? fs.appendFileSync : fs.writeFileSync;

  method(path, data, 'utf-8');

  if (!append) {
    console.info(`File updated: "${path}"`);
  }
}

function removeLocalFile(dir: string, filename: string): void {
  const path = `${dir}/${filename}`;

  if (fs.existsSync(path)) {
    fs.rmSync(path);
    console.info(`File removed: "${path}"`);
  }
}

const ROW_DELIMETER = '\r\n';
const CELL_DELIMETER = ';';

export type PoolsArgs = {
  chainId: number | null;
  version: number | null;
  whitelist: boolean;
  reserve?: number | null;
};

function findArg(args: string[], name: string) {
  const idx = args.findIndex((arg) => arg === name) + 1;
  const value = args[idx] ?? null;
  return value;
}

export function parseArgs(): PoolsArgs {
  const args = process.argv.slice(2);

  const chainIdArg = findArg(args, '--chainId');
  const chainId = chainIdArg ? +chainIdArg : null;

  const versionArg = findArg(args, '--version');
  const version = versionArg ? +versionArg : null;

  const whitelist = !!args.find((arg) => arg === '--whitelist');

  const reserveArg = findArg(args, '--reserve');
  const reserve = reserveArg ? +reserveArg : null;

  return {
    chainId,
    version,
    whitelist,
    reserve,
  };
}

export async function fetchPools(args: PoolsArgs): Promise<void> {
  const { chainId, version, whitelist, reserve } = args;
  console.info('\n');
  console.info(`[${chainId}] Fetch uniswap pools, version: ${version}, whitelist tokens: ${whitelist};`);

  if (!chainId) {
    console.info('`chainId` is not set! Set it using `--chainId` argument');
    process.exit();
  }

  if (!version) {
    console.info('`version` is not set! Set it using `--version` argument');
    process.exit();
  }

  const dirPath = `./public/pools/uniswap/v${version}`;
  const chainName = ID_TO_NETWORK_NAME(chainId);
  const json = `${chainName}.json`;
  const csv = `${chainName}.csv`;

  const provider = getProvider(apiKey, chainId, version);

  let blockNumber = 0;

  const existedData = readLocalFile(dirPath, csv);

  if (existedData) {
    const rows = existedData.split(ROW_DELIMETER);
    const lastRow = rows[rows.length - 2];

    if (lastRow) {
      const cells = lastRow.split(CELL_DELIMETER);
      const pool = provider.fromFlat(cells);
      blockNumber = pool.createdAtBlockNumber;
    }
  }

  const tokens = new Set<string>();

  if (whitelist) {
    const tokensList = readLocalFile('./public/tokens/lists', 'zenswap.json');

    if (tokensList) {
      const items = JSON.parse(tokensList).tokens;

      items.forEach((token) => {
        if (token.chainId === chainId) {
          tokens.add(token.address.toLowerCase());
        }
      });

      if (version === 4) {
        // native ETH
        tokens.add('0x0000000000000000000000000000000000000000');
      }
    }
  }

  const trackedReserveETH = reserve ?? TRACKED_RESERVE_ETH_DEFAULT;
  const variables = { blockNumber, pageSize, trackedReserveETH, tokens: [...tokens] };

  await provider.getAllPools(variables, (pagePools) => {
    pagePools.forEach((pool) => {
      const cells = provider.toFlat(pool);
      const formatted = cells.join(CELL_DELIMETER).concat(ROW_DELIMETER);
      writeLocalFile(dirPath, csv, formatted, true);
    });
  });

  const raw = readLocalFile(dirPath, csv) as string;

  if (raw) {
    const rows = raw.split(ROW_DELIMETER);

    const pools = rows.reduce<any[]>((acc, row) => {
      if (row) {
        const cells = row.split(CELL_DELIMETER);
        const pool = provider.fromFlat(cells);
        acc.push(pool);
      }
      return acc;
    }, []);

    const data = JSON.stringify(pools);

    writeLocalFile(dirPath, json, data);

    removeLocalFile(dirPath, csv);
  }
}
