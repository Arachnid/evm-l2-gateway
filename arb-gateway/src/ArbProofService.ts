/* eslint-disable prettier/prettier */
import {
  EVMProofHelper,
  convertIntoMerkleTrieProof,
  type IProofService,
} from '@ensdomains/evm-gateway';
import {
  encodeAbiParameters,
  getContract,
  parseAbiParameters,
  toHex,
  toRlp,
  zeroHash,
  type Address,
  type Block,
  type Client,
  type GetContractReturnType,
  type Hex,
} from 'viem';
import { getBlock } from 'viem/actions';

import { rollupAbi } from './abi/rollupAbi.js';
import type { IBlockCache } from './blockCache/IBlockCache.js';

export interface ArbProvableBlock {
  number: number;
  sendRoot: Hex;
  nodeIndex: bigint;
  rlpEncodedBlock: Hex;
}

/**
 * The proofService class can be used to calculate proofs for a given target and slot on the Arbitrum network.
 * It's also capable of proofing long types such as mappings or string by using all included slots in the proof.
 *
 */
export class ArbProofService implements IProofService<ArbProvableBlock> {
  private readonly l2Client: Client;
  private readonly rollup: GetContractReturnType<typeof rollupAbi, Client>;
  private readonly helper: EVMProofHelper;
  private readonly cache: IBlockCache;

  constructor({
    l1Client,
    l2Client,
    l2RollupAddress,
    cache,
  }: {
    l1Client: Client;
    l2Client: Client;
    l2RollupAddress: Address;
    cache: IBlockCache;
  }) {
    this.l2Client = l2Client;
    this.rollup = getContract({
      abi: rollupAbi,
      address: l2RollupAddress,
      client: l1Client,
    });
    this.helper = new EVMProofHelper(l2Client);
    this.cache = cache;
  }

  async getStorageAt({
    block,
    address,
    slot,
  }: {
    block: ArbProvableBlock;
    address: Address;
    slot: bigint;
  }): Promise<Hex> {
    return this.helper.getStorageAt({
      blockNumber: block.number,
      address,
      slot,
    });
  }

  /**
   * @dev Fetches a set of proofs for the requested state slots.
   * @param block A `ProvableBlock` returned by `getProvableBlock`.
   * @param address The address of the contract to fetch data from.
   * @param slots An array of slots to fetch data for.
   * @returns A proof of the given slots, encoded in a manner that this service's
   *   corresponding decoding library will understand.
   */
  async getProofs({
    block,
    address,
    slots,
  }: {
    block: ArbProvableBlock;
    address: Address;
    slots: bigint[];
  }): Promise<Hex> {
    const proof = await this.helper.getProofs({
      blockNumber: block.number,
      address,
      slots,
    });

    return encodeAbiParameters(
      parseAbiParameters([
        '(bytes32 version, bytes32 sendRoot, uint64 nodeIndex,bytes rlpEncodedBlock)',
        '(bytes stateTrieWitness, bytes[] storageProofs)',
      ]),
      [
        {
          version: zeroHash,
          sendRoot: block.sendRoot,
          nodeIndex: BigInt(block.nodeIndex),
          rlpEncodedBlock: block.rlpEncodedBlock,
        },
        convertIntoMerkleTrieProof(proof),
      ]
    );
  }
  /**
   * Retrieves information about the latest provable block in the Arbitrum Rollup.
   *
   * @returns { Promise<ArbProvableBlock> } A promise that resolves to an object containing information about the provable block.
   * @throws Throws an error if any of the underlying operations fail.
   *
   * @typedef { Object } ArbProvableBlock
   * @property { string } rlpEncodedBlock - The RLP - encoded block information.
   * @property { string } sendRoot - The send root of the provable block.
   * @property { string } blockHash - The hash of the provable block.
   * @property { number } nodeIndex - The index of the node corresponding to the provable block.
   * @property { number } number - The block number of the provable block.
   */
  public async getProvableBlock(): Promise<ArbProvableBlock> {
    //Retrieve the latest pending node that has been committed to the rollup.
    const nodeIndex = await this.rollup.read.latestNodeCreated();
    const [l2blockRaw, sendRoot] = await this.getL2BlockForNode(nodeIndex);

    const blockarray = [
      l2blockRaw.parentHash,
      l2blockRaw.sha3Uncles,
      l2blockRaw.miner,
      l2blockRaw.stateRoot,
      l2blockRaw.transactionsRoot,
      l2blockRaw.receiptsRoot,
      l2blockRaw.logsBloom!,
      toHex(l2blockRaw.difficulty),
      toHex(l2blockRaw.number!),
      toHex(l2blockRaw.gasLimit),
      toHex(l2blockRaw.gasUsed),
      toHex(l2blockRaw.timestamp),
      l2blockRaw.extraData,
      l2blockRaw.mixHash,
      l2blockRaw.nonce!,
      toHex(l2blockRaw.baseFeePerGas!),
    ];

    //Rlp encode the block to pass it as an argument
    const rlpEncodedBlock = toRlp(blockarray);

    return {
      rlpEncodedBlock,
      sendRoot,
      nodeIndex: nodeIndex,
      number: Number(l2blockRaw.number!),
    };
  }
  /**
   * Fetches the corrospending L2 block for a given node index and returns it along with the send root.
   * @param {bigint} nodeIndex - The index of the node for which to fetch the block.
   * @returns {Promise<[Record<string, string>, string]>} A promise that resolves to a tuple containing the fetched block and the send root.
   */
  private async getL2BlockForNode(nodeIndex: bigint): Promise<[Block, Hex]> {
    //We first check if we have the block cached
    const cachedBlock = await this.cache.getBlock(nodeIndex);
    if (cachedBlock) {
      return [cachedBlock.block, cachedBlock.sendRoot];
    }

    //We fetch the node created event for the node index we just retrieved.
    const nodeEvents = await this.rollup.getEvents.NodeCreated(
      {
        nodeNum: nodeIndex,
      },
      { fromBlock: 0n, toBlock: 'latest' }
    );
    const assertion = nodeEvents[0].args.assertion!;
    //Instead of using the AssertionHelper contract we can extract sendRoot from the assertion. Avoiding the deployment of the AssertionHelper contract and an additional RPC call.
    const [blockHash, sendRoot] = assertion.afterState.globalState.bytes32Vals;

    //The L1 rollup only provides us with the block hash. In order to ensure that the stateRoot we're using for the proof is indeed part of the block, we need to fetch the block. And provide it to the proof.
    const l2BlockRaw = await getBlock(this.l2Client, {
      blockHash,
      includeTransactions: false,
    });

    //Cache the block for future use
    await this.cache.setBlock({ nodeIndex, block: l2BlockRaw, sendRoot });

    return [l2BlockRaw, sendRoot];
  }
}
