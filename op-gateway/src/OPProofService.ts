import {
  EVMProofHelper,
  convertIntoMerkleTrieProof,
  type IProofService,
} from '@ensdomains/evm-gateway';
import { type JsonRpcBlock } from '@ethereumjs/block';
import { AbiCoder, Contract, JsonRpcProvider, type AddressLike } from 'ethers';
import OPOutputLookupABI from './OPOutputLookup.js'

export class InvalidOptimismPortalError extends Error {
  constructor() {
    super('OptimismPortal is invalid');
  }
}

export class DisputeGameChallengedError extends Error {
  constructor() {
    super('Dispute game is challenged');
  }
}

export enum OPWitnessProofType {
  L2OutputOracle = 0,
  DisputeGame = 1,
}

export interface OPProvableBlock {
  number: number;
  proofType: OPWitnessProofType;
  index: number;
}

// OPOutputLookup contract is deployed with deterministic deployment
// As a result, OPOutputLookup is always deployed to the same address
// See OPOutputLookup.sol on op-verifier/contracts/OPOutputLookup.sol
const OP_OUTPUT_LOOKUP = "0x475dc200b71dbd9776518C299e281766FaDf4A30"

const L2_TO_L1_MESSAGE_PASSER_ADDRESS =
  '0x4200000000000000000000000000000000000016';

const OPTIMISM_PORTAL_ABI = [
  'function l2Oracle() external view returns (address)',
  'function disputeGameFactory() external view returns (address)',
  'function respectedGameType() external view returns (uint32)',
];

/**
 * The proofService class can be used to calculate proofs for a given target and slot on the Optimism Bedrock network.
 * It's also capable of proofing long types such as mappings or string by using all included slots in the proof.
 *
 */
export class OPProofService implements IProofService<OPProvableBlock> {
  private readonly l1Provider: JsonRpcProvider;
  private readonly l2Provider: JsonRpcProvider;
  private readonly helper: EVMProofHelper;
  private readonly minAge: number;

  private readonly optimismPortal: Contract;
  private opOutputLookup: Contract;

  constructor(
    l1Provider: JsonRpcProvider,
    l2Provider: JsonRpcProvider,
    optimismPortalAddress: string,
    minAge: number
  ) {
    this.l1Provider = l1Provider;
    this.l2Provider = l2Provider;
    this.helper = new EVMProofHelper(l2Provider);
    this.minAge = minAge;

    this.optimismPortal = new Contract(
      optimismPortalAddress,
      OPTIMISM_PORTAL_ABI,
      this.l1Provider
    );

    this.opOutputLookup = new Contract(
      OP_OUTPUT_LOOKUP,
      OPOutputLookupABI,
      this.l1Provider,
    )
  }

  /**
   * @dev Returns an object representing a block whose state can be proven on L1.
   */
  async getProvableBlock(): Promise<OPProvableBlock> {
    const block = await this.opOutputLookup.getOPProvableBlock(
      await this.optimismPortal.getAddress(),
      this.minAge,
      1000000000 // Unlimited maximum age
    )

    console.log(block)

    return {
      number: block.blockNumber,
      proofType: block.proofType,
      index: block.index,
    }
  }

  /**
   * @dev Returns the value of a contract state slot at the specified block
   * @param block A `ProvableBlock` returned by `getProvableBlock`.
   * @param address The address of the contract to fetch data from.
   * @param slot The slot to fetch.
   * @returns The value in `slot` of `address` at block `block`
   */
  getStorageAt(
    block: OPProvableBlock,
    address: AddressLike,
    slot: bigint
  ): Promise<string> {
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
    block: OPProvableBlock,
    address: AddressLike,
    slots: bigint[]
  ): Promise<string> {
    const proof = await this.helper.getProofs(block.number, address, slots);
    const rpcBlock: JsonRpcBlock = await this.l2Provider.send(
      'eth_getBlockByNumber',
      ['0x' + block.number.toString(16), false]
    );
    const messagePasserStorageRoot = await this.getMessagePasserStorageRoot(
      block.number
    );

    return AbiCoder.defaultAbiCoder().encode(
      [
        'tuple(uint8 proofType, uint256 index, tuple(bytes32 version, bytes32 stateRoot, bytes32 messagePasserStorageRoot, bytes32 latestBlockhash) outputRootProof)',
        'tuple(bytes stateTrieWitness, bytes[] storageProofs)',
      ],
      [
        {
          blockNo: block.number,
          proofType: block.proofType,
          index: block.index,
          outputRootProof: {
            version:
              '0x0000000000000000000000000000000000000000000000000000000000000000',
            stateRoot: rpcBlock.stateRoot,
            messagePasserStorageRoot,
            latestBlockhash: rpcBlock.hash,
          },
        },
        convertIntoMerkleTrieProof(proof),
      ]
    );
  }

  private async getMessagePasserStorageRoot(blockNo: number) {
    const { stateRoot } = await this.helper.getProofs(
      blockNo,
      L2_TO_L1_MESSAGE_PASSER_ADDRESS,
      []
    );
    return stateRoot;
  }
}
