import type { Block, Hex } from 'viem';
import type { IBlockCache } from './IBlockCache.js';

//Dummy in memory cache for storing block data. Replace with something more sophisticated like redis in the future
export class InMemoryBlockCache implements IBlockCache {
  private block: Block | null;
  private nodeIndex: bigint;
  private sendRoot: Hex;

  constructor() {
    this.block = null;
    this.nodeIndex = 0n;
    this.sendRoot = '0x';
  }

  public async getBlock(nodeIndex: bigint): Promise<{
    nodeIndex: bigint;
    block: Block;
    sendRoot: Hex;
  } | null> {
    //Cache miss
    if (nodeIndex !== this.nodeIndex || this.block === null) {
      console.log('Cache miss for nodeIndex: ', nodeIndex);
      return null;
    }
    //Cache hit
    return {
      nodeIndex: this.nodeIndex,
      block: this.block,
      sendRoot: this.sendRoot,
    };
  }

  public async setBlock({
    nodeIndex,
    block,
    sendRoot,
  }: {
    nodeIndex: bigint;
    block: Block;
    sendRoot: Hex;
  }) {
    console.log('Setting new block for nodeIndex: ', nodeIndex);

    this.nodeIndex = nodeIndex;
    this.block = block;
    this.sendRoot = sendRoot;
  }
}
