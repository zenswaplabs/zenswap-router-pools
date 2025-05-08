import { ChainId } from '@uniswap/sdk-core';

import { gql, GraphQLClient } from 'graphql-request';

// only necessary fields
export type Pool = {
  id: string;
  token0: {
    id: string;
  };
  token1: {
    id: string;
  };
  createdAtBlockNumber: number;
};

export type RawPool = {
  id: string;
  token0: {
    id: string;
  };
  token1: {
    id: string;
  };
  createdAtBlockNumber: string;
};

export type FlatPool = string[];

export type RawPoolV2 = RawPool & {
  totalSupply: string;
  trackedReserveETH: string;
  reserveUSD: string;
};

export type PoolV2 = Pool & {
  supply: number;
  reserve: number;
  reserveUSD: number;
};

export type FlatPoolV2 = [
  PoolV2['id'],
  PoolV2['token0']['id'],
  PoolV2['token1']['id'],
  PoolV2['createdAtBlockNumber'],
  PoolV2['supply'],
  PoolV2['reserve'],
  PoolV2['reserveUSD'],
];

export type RawPoolV3 = RawPool & {
  feeTier: string;
  liquidity: string;
  totalValueLockedUSD: string;
  totalValueLockedETH: string;
};

export type PoolV3 = Pool & {
  feeTier: string;
  liquidity: string;
  tvlETH: number;
  tvlUSD: number;
};

export type FlatPoolV3 = [
  PoolV3['id'],
  PoolV3['token0']['id'],
  PoolV3['token1']['id'],
  PoolV3['createdAtBlockNumber'],
  PoolV3['feeTier'],
  PoolV3['liquidity'],
  PoolV3['tvlETH'],
  PoolV3['tvlUSD'],
];

export type RawPoolV4 = RawPool & {
  feeTier: string;
  tickSpacing: string;
  hooks: string;
  liquidity: string;
  totalValueLockedUSD: string;
  totalValueLockedETH: string;
};

export type PoolV4 = Pool & {
  feeTier: string;
  tickSpacing: string;
  hooks: string;
  liquidity: string;
  tvlETH: number;
  tvlUSD: number;
};

export type FlatPoolV4 = [
  PoolV4['id'],
  PoolV4['token0']['id'],
  PoolV4['token1']['id'],
  PoolV4['createdAtBlockNumber'],
  PoolV4['feeTier'],
  PoolV4['tickSpacing'],
  PoolV4['hooks'],
  PoolV4['liquidity'],
  PoolV4['tvlETH'],
  PoolV4['tvlUSD'],
];

export type FilterVariables = {
  blockNumber?: number;
  trackedReserveETH?: number;
  tokens?: string[];
};

export type QueryVariables = {
  pageSize: number;
  filter: any;
};

export abstract class SubgraphProvider<TRawPool extends RawPool, TPool extends Pool, TFlatPool> {
  protected apiKey!: string;
  protected chainId!: ChainId;
  protected client!: GraphQLClient;

  constructor(apiKey: string, chainId: ChainId) {
    this.apiKey = apiKey;
    this.chainId = chainId;
    this.client = new GraphQLClient(this.getUrl());
  }

  protected abstract getUrl(): string;

  protected abstract poolsQuery(): string;

  protected abstract poolFilter(variables: FilterVariables): any;

  public abstract fromRaw(rawPool: TRawPool): TPool;

  public abstract fromFlat(flatPool: FlatPool): TPool;

  public abstract toFlat(pool: TPool): TFlatPool;

  public async getPools(variables: QueryVariables): Promise<TPool[]> {
    const query = this.poolsQuery();
    const { items } = await this.client.request<{
      items: TRawPool[];
    }>(query, variables);

    const pools = items.map((pool) => this.fromRaw(pool));

    return pools;
  }

  public async getAllPools(
    {
      pageSize = 100,
      trackedReserveETH = 0,
      blockNumber = 0,
      tokens = [],
    }: {
      pageSize?: number;
      trackedReserveETH?: number;
      blockNumber?: number;
      tokens?: string[];
    },
    callback?: (poolsPage: TPool[]) => void
  ): Promise<TPool[]> {
    let pools: TPool[] = [];
    let poolsPage: TPool[] = [];

    let lastBlockNumber = blockNumber;
    let lastIds = new Set<string>();
    let total = 0;

    do {
      lastBlockNumber = poolsPage.length > 0 ? poolsPage[poolsPage.length - 1].createdAtBlockNumber : lastBlockNumber;

      poolsPage.forEach((pool) => lastIds.add(pool.id));

      const filter = this.poolFilter({ blockNumber: lastBlockNumber, trackedReserveETH, tokens });
      const variables = { pageSize, filter };

      const response = await this.getPools(variables);

      poolsPage = response.reduce<TPool[]>((acc, pool) => {
        if (!lastIds.has(pool.id)) {
          acc.push(pool);
          total += 1;
        }
        return acc;
      }, []);

      lastIds.clear();

      console.info(
        `[${this.chainId}] Fetched ${poolsPage.length} pools; from block: ${lastBlockNumber}; total: ${total}`
      );

      if (callback) {
        callback(poolsPage);
      } else {
        pools = pools.concat(poolsPage);
      }
    } while (poolsPage.length > 0);

    return pools;
  }
}

export class SubgraphProviderV2 extends SubgraphProvider<RawPoolV2, PoolV2, FlatPoolV2> {
  protected override getUrl(): string {
    const base = `https://gateway.thegraph.com/api/${this.apiKey}/subgraphs/id`;
    switch (this.chainId) {
      case ChainId.MAINNET:
        return `${base}/A3Np3RQbaBA6oKJgiwDJeo5T3zrYfGHPWFYayMwtNDum`;
      case ChainId.POLYGON:
        return `${base}/EXBcAqmvQi6VAnE9X4MNK83LPeA6c1PsGskffbmThoeK`;
      case ChainId.ARBITRUM_ONE:
        return `${base}/CStW6CSQbHoXsgKuVCrk3uShGA4JX3CAzzv2x9zaGf8w`;
      case ChainId.UNICHAIN:
        return `${base}/8vvhJXc9Fi2xpc3wXtRpYrWVYfcxThU973HhBukmFh83`;
      default:
        throw new Error(`v2 subgraph endpoint for chainId ${this.chainId} is not set`);
    }
  }

  public override fromRaw(rawPool: RawPoolV2): PoolV2 {
    return {
      id: rawPool.id.toLowerCase(),
      createdAtBlockNumber: parseInt(rawPool.createdAtBlockNumber),
      token0: {
        id: rawPool.token0.id.toLowerCase(),
      },
      token1: {
        id: rawPool.token1.id.toLowerCase(),
      },
      supply: parseFloat(rawPool.totalSupply),
      reserve: parseFloat(rawPool.trackedReserveETH),
      reserveUSD: parseFloat(rawPool.reserveUSD),
    };
  }

  public override fromFlat(flatPool: FlatPool): PoolV2 {
    const [id, token0, token1, createdAtBlockNumber, supply, reserve, reserveUSD] = flatPool;

    return {
      id: id,
      token0: {
        id: token0,
      },
      token1: {
        id: token1,
      },
      createdAtBlockNumber: Number(createdAtBlockNumber),
      supply: Number(supply),
      reserve: Number(reserve),
      reserveUSD: Number(reserveUSD),
    };
  }

  public override toFlat(pool: PoolV2): FlatPoolV2 {
    return [
      pool.id,
      pool.token0.id,
      pool.token1.id,
      pool.createdAtBlockNumber,
      pool.supply,
      pool.reserve,
      pool.reserveUSD,
    ];
  }

  protected override poolFilter(variables: FilterVariables) {
    const { blockNumber, trackedReserveETH, tokens } = variables;
    const filter = {};

    if (Number.isFinite(blockNumber)) {
      filter['createdAtBlockNumber_gte'] = blockNumber;
    }
    if (Number.isFinite(trackedReserveETH)) {
      filter['trackedReserveETH_gte'] = trackedReserveETH;
    }
    if (Array.isArray(tokens) && tokens.length) {
      filter['token0_in'] = tokens;
      filter['token1_in'] = tokens;
    }

    return filter;
  }

  protected override poolsQuery(): string {
    return gql`
      query getPools($pageSize: Int!, $filter: Pair_filter) {
        items: pairs(first: $pageSize, orderBy: createdAtBlockNumber, orderDirection: asc, where: $filter) {
          id
          createdAtBlockNumber
          token0 {
            id
          }
          token1 {
            id
          }
          totalSupply
          trackedReserveETH
          reserveUSD
        }
      }
    `;
  }
}

export class SubgraphProviderV3 extends SubgraphProvider<RawPoolV3, PoolV3, FlatPoolV3> {
  protected override getUrl(): string {
    const base = `https://gateway.thegraph.com/api/${this.apiKey}/subgraphs/id`;
    switch (this.chainId) {
      case ChainId.SEPOLIA:
        return `${base}/B4QeFHkfWXjKCDzNn3BJtDRDfG6VeHzGXgkf4Jt3fRn5`;
      case ChainId.MAINNET:
        return `${base}/8e4dRt4P4WHXnKbEq7STaQfU2g99WZ5S4w39f2PcUTjD`;
      case ChainId.OPTIMISM:
        return `${base}/Cghf4LfVqPiFw6fp6Y5X5Ubc8UpmUhSfJL82zwiBFLaj`;
      case ChainId.BNB:
        return `${base}/G5MUbSBM7Nsrm9tH2tGQUiAF4SZDGf2qeo1xPLYjKr7K`;
      case ChainId.POLYGON:
        return `${base}/EsLGwxyeMMeJuhqWvuLmJEiDKXJ4Z6YsoJreUnyeozco`;
      case ChainId.BASE:
        return `${base}/GqzP4Xaehti8KSfQmv3ZctFSjnSUYZ4En5NRsiTbvZpz`;
      case ChainId.BASE_SEPOLIA:
        return `${base}/4xPAdAuU9HfbQhNdGCfZYBw45Ey6KB71R3dc4qCD5XhQ`;
      case ChainId.AVALANCHE:
        return `${base}/GVH9h9KZ9CqheUEL93qMbq7QwgoBu32QXQDPR6bev4Eo`;
      case ChainId.ARBITRUM_ONE:
        return `${base}/FbCGRftH4a3yZugY7TnbYgPJVEv2LvMT6oF1fxPe9aJM`;
      case ChainId.ARBITRUM_SEPOLIA:
        return `${base}/FQQKpdTVHPQtjDwNKpTLrtx8fSeYhHAmvb69UiSHig59`;
      case ChainId.CELO:
        return `${base}/ESdrTJ3twMwWVoQ1hUE2u7PugEHX3QkenudD6aXCkDQ4`;
      case ChainId.BLAST:
        return `${base}/2LHovKznvo8YmKC9ZprPjsYAZDCc4K5q4AYz8s3cnQn1`;
      case ChainId.UNICHAIN:
        return `${base}/GZWDNw5b7XH2iqnmG91FLDDkfEVEDQotfPv4GMdraEKY`;
      case ChainId.UNICHAIN_SEPOLIA:
        return `${base}/5Tf9s7syYLHQzhmtjukjTjmhFwx7c3hrdVxy4jo3TgCC`;
      default:
        throw new Error(`v3 subgraph endpoint for chainId ${this.chainId} is not set`);
    }
  }

  public override fromRaw(rawPool: RawPoolV3): PoolV3 {
    return {
      id: rawPool.id.toLowerCase(),
      token0: {
        id: rawPool.token0.id.toLowerCase(),
      },
      token1: {
        id: rawPool.token1.id.toLowerCase(),
      },
      createdAtBlockNumber: parseInt(rawPool.createdAtBlockNumber),
      feeTier: rawPool.feeTier,
      liquidity: rawPool.liquidity,
      tvlETH: parseFloat(rawPool.totalValueLockedETH),
      tvlUSD: parseFloat(rawPool.totalValueLockedUSD),
    };
  }

  public override fromFlat(flatPool: FlatPool): PoolV3 {
    const [id, token0, token1, createdAtBlockNumber, feeTier, liquidity, tvlETH, tvlUSD] = flatPool;

    return {
      id: id,
      token0: {
        id: token0,
      },
      token1: {
        id: token1,
      },
      createdAtBlockNumber: Number(createdAtBlockNumber),
      feeTier,
      liquidity,
      tvlETH: Number(tvlETH),
      tvlUSD: Number(tvlUSD),
    };
  }

  public override toFlat(pool: PoolV3): FlatPoolV3 {
    return [
      pool.id,
      pool.token0.id,
      pool.token1.id,
      pool.createdAtBlockNumber,
      pool.feeTier,
      pool.liquidity,
      pool.tvlETH,
      pool.tvlUSD,
    ];
  }

  protected override poolFilter(variables: FilterVariables) {
    const { blockNumber, trackedReserveETH, tokens } = variables;
    const filter = {
      liquidity_gt: 0,
    };

    if (Number.isFinite(blockNumber)) {
      filter['createdAtBlockNumber_gte'] = blockNumber;
    }
    if (Number.isFinite(trackedReserveETH)) {
      filter[`${this.getTVLNativeName()}_gte`] = trackedReserveETH;
    }
    if (Array.isArray(tokens) && tokens.length) {
      filter['token0_in'] = tokens;
      filter['token1_in'] = tokens;
    }

    return filter;
  }

  private getTVLNativeName(): string {
    // only for this founded subgraph
    if (this.chainId === ChainId.UNICHAIN_SEPOLIA) {
      return 'totalValueLockedNative';
    }
    return 'totalValueLockedETH';
  }

  protected override poolsQuery(): string {
    return `
      query getPools($pageSize: Int!, $filter: Pool_filter) {
        items: pools(first: $pageSize, orderBy: createdAtBlockNumber, orderDirection: asc, where: $filter) {
          id
          createdAtBlockNumber
          token0 {
            id
          }
          token1 {
            id
          }
          feeTier
          liquidity
          totalValueLockedETH: ${this.getTVLNativeName()}
          totalValueLockedUSD
        }
      }
    `;
  }
}

export class SubgraphProviderV4 extends SubgraphProvider<RawPoolV4, PoolV4, FlatPoolV4> {
  protected override getUrl(): string {
    const base = `https://gateway.thegraph.com/api/${this.apiKey}/subgraphs/id`;
    switch (this.chainId) {
      case ChainId.MAINNET:
        return `${base}/AdA6Ax3jtct69NnXfxNjWtPTe9gMtSEZx2tTQcT4VHu`;
      case ChainId.POLYGON:
        return `${base}/2UKncUpdgZeJVyh6Dv8ai2fTL2MQnig8ySh7YkYcHCsL`;
      case ChainId.ARBITRUM_ONE:
        return `${base}/655x11nEGRudi5Nh4attV1uMt2YnyFRMaSKRM5QndXLK`;
      case ChainId.UNICHAIN:
        return `${base}/EoCvJ5tyMLMJcTnLQwWpjAtPdn74PcrZgzfcT5bYxNBH`;
      default:
        throw new Error(`v4 subgraph endpoint for chainId ${this.chainId} is not set`);
    }
  }

  public override fromRaw(rawPool: RawPoolV4): PoolV4 {
    return {
      id: rawPool.id.toLowerCase(),
      token0: {
        id: rawPool.token0.id.toLowerCase(),
      },
      token1: {
        id: rawPool.token1.id.toLowerCase(),
      },
      createdAtBlockNumber: parseInt(rawPool.createdAtBlockNumber),
      feeTier: rawPool.feeTier,
      tickSpacing: rawPool.tickSpacing,
      hooks: rawPool.hooks,
      liquidity: rawPool.liquidity,
      tvlETH: parseFloat(rawPool.totalValueLockedETH),
      tvlUSD: parseFloat(rawPool.totalValueLockedUSD),
    };
  }

  public override fromFlat(flatPool: FlatPool): PoolV4 {
    const [id, token0, token1, createdAtBlockNumber, feeTier, tickSpacing, hooks, liquidity, tvlETH, tvlUSD] = flatPool;

    return {
      id: id,
      token0: {
        id: token0,
      },
      token1: {
        id: token1,
      },
      createdAtBlockNumber: Number(createdAtBlockNumber),
      feeTier,
      tickSpacing,
      hooks,
      liquidity,
      tvlETH: Number(tvlETH),
      tvlUSD: Number(tvlUSD),
    };
  }

  public override toFlat(pool: PoolV4): FlatPoolV4 {
    return [
      pool.id,
      pool.token0.id,
      pool.token1.id,
      pool.createdAtBlockNumber,
      pool.feeTier,
      pool.tickSpacing,
      pool.hooks,
      pool.liquidity,
      pool.tvlETH,
      pool.tvlUSD,
    ];
  }

  protected override poolFilter(variables: FilterVariables) {
    const { blockNumber, trackedReserveETH, tokens } = variables;
    const filter = {};

    if (Number.isFinite(blockNumber)) {
      filter['createdAtBlockNumber_gte'] = blockNumber;
    }
    if (Number.isFinite(trackedReserveETH)) {
      filter['totalValueLockedETH_gte'] = trackedReserveETH;
    }
    if (Array.isArray(tokens) && tokens.length) {
      filter['token0_in'] = tokens;
      filter['token1_in'] = tokens;
    }

    return filter;
  }

  protected override poolsQuery(): string {
    return gql`
      query getPools($pageSize: Int!, $filter: Pool_filter) {
        items: pools(first: $pageSize, orderBy: createdAtBlockNumber, orderDirection: asc, where: $filter) {
          id
          createdAtBlockNumber
          token0 {
            id
          }
          token1 {
            id
          }
          feeTier
          tickSpacing
          hooks
          liquidity
          totalValueLockedETH
          totalValueLockedUSD
        }
      }
    `;
  }
}

export function getProvider(apiKey: string, chainId: ChainId, version: number) {
  if (version === 2) {
    return new SubgraphProviderV2(apiKey, chainId);
  } else if (version === 3) {
    return new SubgraphProviderV3(apiKey, chainId);
  } else if (version === 4) {
    return new SubgraphProviderV4(apiKey, chainId);
  } else {
    throw new Error(`Version ${version} is not supported`);
  }
}
