import type { Address, Hex } from 'viem';

export interface ProvableBlock {}

export interface IProofService<provableBlock extends ProvableBlock> {
  /**
   * @dev Returns an object representing a block whose state can be proven on L1.
   */
  getProvableBlock(): Promise<provableBlock>;

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
    block: provableBlock;
    address: Address;
    slot: bigint;
  }): Promise<Hex>;

  /**
   * @dev Fetches a set of proofs for the requested state slots.
   * @param block A `ProvableBlock` returned by `getProvableBlock`.
   * @param address The address of the contract to fetch data from.
   * @param slots An array of slots to fetch data for.
   * @returns A proof of the given slots, encoded in a manner that this service's
   *   corresponding decoding library will understand.
   */
  getProofs({
    block,
    address,
    slots,
  }: {
    block: provableBlock;
    address: Address;
    slots: bigint[];
  }): Promise<Hex>;
}
