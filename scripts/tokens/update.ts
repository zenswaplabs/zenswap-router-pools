import { schema } from '@uniswap/token-lists';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import fs from 'fs';

import type { TokenList } from '@uniswap/token-lists';

enum ResponseType {
  Text = 'text',
  Json = 'json',
}

type TokenListDef = {
  fileName: string;
  url: string;
  responseType: ResponseType;
};

const ExternalLists: TokenListDef[] = [
  {
    fileName: 'uniswap.json',
    url: 'https://ipfs.io/ipns/tokens.uniswap.org',
    responseType: ResponseType.Text,
  },
];

const InternalLists: TokenListDef[] = [
  {
    fileName: 'testnet.json',
    url: '',
    responseType: ResponseType.Json,
  },
  {
    fileName: 'mainnet.json',
    url: '',
    responseType: ResponseType.Json,
  },
];

const AppListMerged = {
  fileName: 'zenswap.json',
  url: '',
  responseType: ResponseType.Json,
};

const writePath = './public/tokens/lists/';

async function updateExternalList(list: TokenListDef): Promise<void> {
  const { url, responseType } = list;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': `application/json`,
    },
  });
  const data = (await response[responseType]()) as string;

  const formatted = formatList(JSON.parse(data) as TokenList);

  writeLocalFile(list, JSON.stringify(formatted, null, 2));
}

function formatList(listJson: TokenList): TokenList {
  const tokens = listJson.tokens.map((token) => {
    const { tags: _tags, extensions: _extensions, ...rest } = token;
    return { ...rest };
  });

  const formatted: TokenList = { ...listJson, tokens };

  return formatted;
}

function readLocalList(list: TokenListDef): any {
  const { fileName } = list;
  const path = `${writePath}${fileName}`;
  const data = JSON.parse(fs.readFileSync(path, 'utf8'));

  return data;
}

function writeLocalFile(list: TokenListDef, data: string): void {
  if (!fs.existsSync(writePath)) {
    fs.mkdirSync(writePath);
  }

  const { fileName } = list;
  const path = `${writePath}${fileName}`;

  fs.writeFileSync(path, data, 'utf-8');

  console.info(`Token list saved: "${path}"`);
}

function validate(list: TokenListDef): boolean {
  const ajv = new Ajv({ allErrors: true, verbose: false });
  addFormats(ajv);
  const validator = ajv.compile(schema);
  const data = readLocalList(list);
  const valid = validator(data);

  if (!valid) {
    console.info(`Token list is INVALID: "${list.fileName}"`);
    if (validator.errors) {
      validator.errors.forEach((error) => {
        delete error.data;
        console.error(error);
      });
    }

    return false;
  }

  console.info(`Token list is VALID: "${list.fileName}"`);

  return true;
}

async function main(): Promise<void> {
  const validLists: TokenListDef[] = [...InternalLists];

  await Promise.all(
    ExternalLists.map(async (list) => {
      await updateExternalList(list);

      if (validate(list)) {
        validLists.push(list);
      }
    })
  );

  const appList = readLocalList(AppListMerged);

  const updates: any[] = [];

  for (const validList of validLists) {
    const { tokens } = readLocalList(validList);

    for (const token of tokens) {
      const exists = appList.tokens.find(
        (appToken) => appToken.chainId === token.chainId && appToken.address.toLowerCase() === token.address.toLowerCase()
      );

      if (exists) {
        continue;
      } else {
        updates.push(token);
      }
    }
  }

  if (updates.length) {
    updates.forEach((update) => {
      console.info(`[Update] ${update.symbol}; ${update.chainId}; ${update.address}`);
      appList.tokens.push(update);
    });

    appList.timestamp = new Date().toISOString();

    const formatted = formatList(appList);

    writeLocalFile(AppListMerged, JSON.stringify(formatted, null, 2));
  } else {
    console.info('No updates.');
  }
}

await main();
