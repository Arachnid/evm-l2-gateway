import {
  EVMProofHelper,
  convertIntoMerkleTrieProof,
  type IProofService,
} from '@ensdomains/evm-gateway';

import {
  encodeAbiParameters,
  parseAbiParameters,
  toRlp,
  type Address,
  type Client,
  type Hex,
} from 'viem';
import { getBlock } from 'viem/actions';

export type L1ProvableBlock = number;

const toIdkHex = (val: bigint): Hex => {
  if (val === 0n) return '0x';
  const hexxed = val.toString(16);
  return `0x${hexxed.length % 2 === 0 ? hexxed : `0${hexxed}`}`;
};

/**
 * The proofService class can be used to calculate proofs for a given target and slot on the Optimism Bedrock network.
 * It's also capable of proofing long types such as mappings or string by using all included slots in the proof.
 *
 */
export class L1ProofService implements IProofService<L1ProvableBlock> {
  private readonly client: Client;
  private readonly helper: EVMProofHelper;

  constructor(client: Client) {
    this.client = client;
    this.helper = new EVMProofHelper(client);
  }

  /**
   * @dev Returns an object representing a block whose state can be proven on L1.
   */
  async getProvableBlock(): Promise<L1ProvableBlock> {
    const block = await getBlock(this.client, { blockTag: 'latest' });
    if (!block) throw new Error('No block found');
    return Number(block.number) - 1;
  }

  /**
   * @dev Returns the value of a contract state slot at the specified block
   * @param block A `ProvableBlock` returned by `getProvableBlock`.
   * @param address The address of the contract to fetch data from.
   * @param slot The slot to fetch.
   * @returns The value in `slot` of `address` at block `block`
   */
  getStorageAt({
    block,
    address,
    slot,
  }: {
    block: L1ProvableBlock;
    address: Address;
    slot: bigint;
  }): Promise<Hex> {
    return this.helper.getStorageAt({ blockNumber: block, address, slot });
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
    block: L1ProvableBlock;
    address: Address;
    slots: bigint[];
  }): Promise<Hex> {
    const proof = await this.helper.getProofs({
      blockNumber: block,
      address,
      slots,
    });
    const comparisonBlock = await getBlock(this.client, {
      blockNumber: BigInt(block),
      includeTransactions: false,
    });

    if (!comparisonBlock) throw new Error('Block not found');

    const headerArray = [
      comparisonBlock.parentHash,
      comparisonBlock.sha3Uncles,
      comparisonBlock.miner,
      comparisonBlock.stateRoot,
      comparisonBlock.transactionsRoot,
      comparisonBlock.receiptsRoot,
      comparisonBlock.logsBloom!,
      toIdkHex(comparisonBlock.difficulty),
      toIdkHex(comparisonBlock.number!),
      toIdkHex(comparisonBlock.gasLimit),
      toIdkHex(comparisonBlock.gasUsed), // 10
      toIdkHex(comparisonBlock.timestamp),
      comparisonBlock.extraData,
      comparisonBlock.mixHash,
      comparisonBlock.nonce!,
      toIdkHex(comparisonBlock.baseFeePerGas!), // 15
      ...(comparisonBlock.withdrawalsRoot
        ? [comparisonBlock.withdrawalsRoot]
        : (['0x'] as const)), // anvil ???
      ...(typeof comparisonBlock.blobGasUsed === 'bigint'
        ? [
            toIdkHex(comparisonBlock.blobGasUsed),
            toIdkHex(comparisonBlock.excessBlobGas),
          ]
        : []),
    ];

    const blockHeader = toRlp(headerArray) as Hex;
    return encodeAbiParameters(
      parseAbiParameters([
        '(uint256 blockNumber, bytes blockHeader)',
        '(bytes stateTrieWitness, bytes[] storageProofs)',
      ]),
      [
        { blockNumber: BigInt(block), blockHeader },
        convertIntoMerkleTrieProof(proof),
      ]
    );
  }
}
