import { toHex, type Address, type Client, type Hex } from 'viem';
import { getProof, getStorageAt } from 'viem/actions';

export interface StateProof {
  stateTrieWitness: Hex[];
  storageProofs: Hex[][];
  stateRoot: Hex;
}

/**
 * The proofService class can be used to calculate proofs for a given target and slot on the Optimism Bedrock network.
 * It's also capable of proofing long types such as mappings or string by using all included slots in the proof.
 *
 */
export class EVMProofHelper {
  private readonly client: Client;

  constructor(client: Client) {
    this.client = client;
  }

  /**
   * @dev Returns the value of a contract state slot at the specified block
   * @param block A `ProvableBlock` returned by `getProvableBlock`.
   * @param address The address of the contract to fetch data from.
   * @param slot The slot to fetch.
   * @returns The value in `slot` of `address` at block `block`
   */
  async getStorageAt({
    blockNumber,
    address,
    slot,
  }: {
    blockNumber: number;
    address: Address;
    slot: bigint;
  }): Promise<Hex> {
    return getStorageAt(this.client, {
      address,
      blockNumber: BigInt(blockNumber),
      slot: toHex(slot),
    }).then((v) => v ?? '0x');
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
    blockNumber,
    address,
    slots,
  }: {
    blockNumber: number;
    address: Address;
    slots: bigint[];
  }): Promise<StateProof> {
    const proofs = await getProof(this.client, {
      address,
      blockNumber: BigInt(blockNumber),
      storageKeys: slots.map((s) => toHex(s, { size: 32 })),
    });
    return {
      stateTrieWitness: proofs.accountProof,
      storageProofs: proofs.storageProof.map((proof) => proof.proof),
      stateRoot: proofs.storageHash,
    };
  }
}
