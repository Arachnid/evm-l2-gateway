/* eslint-disable prettier/prettier */
import { EVMProofHelper, type IProofService } from '@ensdomains/evm-gateway';
import { AbiCoder, Contract, ethers, type AddressLike, } from 'ethers';
import { concat } from "ethers";

import rollupAbi from "./abi/rollupABI.js";
import type { IBlockCache } from './blockCache/IBlockCache.js';
export interface ScrollProvableBlock {
    number: number
}

/**
 * The proofService class can be used to calculate proofs for a given target and slot on the Scroll network.
 * It's also capable of proofing long types such as mappings or string by using all included slots in the proof.
 *
 */
export class ScrollProofService implements IProofService<ScrollProvableBlock> {
    private readonly l2Provider: ethers.JsonRpcProvider;
    private readonly rollup: Contract;
    private readonly helper: EVMProofHelper;
    private readonly cache: IBlockCache;


    constructor(
        l1Provider: ethers.JsonRpcProvider,
        l2Provider: ethers.JsonRpcProvider,
        l2RollupAddress: string,
        cache: IBlockCache
    ) {
        this.l2Provider = l2Provider;
        this.rollup = new Contract(
            l2RollupAddress,
            rollupAbi,
            l1Provider
        );
        this.helper = new EVMProofHelper(l2Provider);
        this.cache = cache
    }

    async getStorageAt(block: ScrollProvableBlock, address: AddressLike, slot: bigint): Promise<string> {
        console.log(typeof(this.cache))
        console.log(typeof(this.rollup))
        return this.helper.getStorageAt(block.number, address, slot);
    }


    /**
     * @dev Fetches a set of proofs for the requested state slots.
     * @param block A `ProvableBlock` returned by `getProvableBlock`.
     * @param address The address of the contract to fetch data from.
     * @param slots An array of slots to fetch data for.
     * @returns A proof of the given slots, encoded in a manner that this service's
     *   corresponding decoding library will understand.
     */
    async getProofs(
        block: ScrollProvableBlock,
        address: AddressLike,
        slots: bigint[]
    ): Promise<string> {
        const searchUrl = 'https://sepolia-api-re.scroll.io/api/search';
        const resp:any = await fetch(`${searchUrl}?keyword=${Number(block.number)}`)
        const obj:any = await resp.json()
        const batchIndex = obj.batch_index
        const proof = await this.helper.getProofs(Number(block.number), address, slots)
        const accountProof: Array<string> = proof.stateTrieWitness;
        const storageProof: Array<string> = proof.storageProofs[0];

        const compressedProof = concat([
            `0x${accountProof.length.toString(16).padStart(2, "0")}`,
            ...accountProof,
            `0x${storageProof.length.toString(16).padStart(2, "0")}`,
            ...storageProof,
        ]);
        const res:any =  AbiCoder.defaultAbiCoder().encode(
            [
                'tuple(uint256 batchIndex, uint256 storageKey, bytes compressedProof)',
                'tuple(bytes[] stateTrieWitness, bytes[][] storageProofs)',
            ],
            [
                {
                    batchIndex,
                    storageKey:slots[0], // Check how to handle multiple storage
                    compressedProof
                },
                proof,
            ]
        );
        console.log({
            blockNumber:Number(block.number), address,
            batchIndex, slots, compressedProof, proof,
            res
        })
        return res;
    }
  /**
   * @dev Returns an object representing a block whose state can be proven on L1.
   */
  public async getProvableBlock(): Promise<ScrollProvableBlock> {
        const block = await this.l2Provider.send("eth_getBlockByNumber", ["finalized", false]);
        console.log('***getProvableBlock', block)
        if (!block) throw new Error('No block found');
        return {
            number: block.number
        };
    }
}
