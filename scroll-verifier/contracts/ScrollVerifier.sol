//SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;
import {StateProof, EVMProofHelper} from '@ensdomains/evm-verifier/contracts/EVMProofHelper.sol';
import {IEVMVerifier} from '@ensdomains/evm-verifier/contracts/IEVMVerifier.sol';
import {RLPReader} from "@eth-optimism/contracts-bedrock/src/libraries/rlp/RLPReader.sol";


interface IScrollChain {
    /// @param batchIndex The index of the batch.
    /// @return The state root of a committed batch.
    function finalizedStateRoots(uint256 batchIndex) external view returns (bytes32);
}

interface IScrollChainCommitmentVerifier {
    function verifyZkTrieProof(
        address account,
        bytes32 storageKey,
        bytes calldata proof
    ) external view returns (bytes32 stateRoot, bytes32 storageValue);

    function rollup() external view returns (address);

    function verifyStateCommitment(
        uint256 batchIndex,
        address account,
        bytes32 storageKey,
        bytes calldata proof
    ) external view returns (bytes32 storageValue);
}

struct ScrollWitnessData {
    uint256 batchIndex;
    bytes32[] storageKeys;
}

contract ScrollVerifier is IEVMVerifier {
    error InvalidSlotSize(uint256 size);
    IScrollChainCommitmentVerifier public immutable verifier;
    string[] _gatewayURLs;

    constructor(string[] memory _urls, IScrollChainCommitmentVerifier _verifierAddress) {
        verifier = _verifierAddress;
        _gatewayURLs = _urls;
    }

    /*
     * Retrieves an array of gateway URLs used by the contract.
     * @returns {string[]} An array containing the gateway URLs.
     *     */
    function gatewayURLs() external view returns (string[] memory) {
        return _gatewayURLs;
    }

    function compressProof(
        bytes[] memory stateTrieWitness,
        bytes[][] memory storageProofs,
        uint256 storageIndex
    ) public pure returns (bytes memory output) {
        output = abi.encodePacked(uint8(stateTrieWitness.length));
        for (uint256 i = 0; i < stateTrieWitness.length; i++) {
            output = abi.encodePacked(output, stateTrieWitness[i]);
        }
        output = abi.encodePacked(output, uint8(storageProofs[storageIndex].length));
        for (uint256 i = 0; i < storageProofs[storageIndex].length; i++) {
            output = abi.encodePacked(output, storageProofs[storageIndex][i]);
        }
        return output;
    }

    function getTrieProof(address target, uint256 slot, bytes[] memory compressedProof, bytes32 root) internal view returns(bytes memory){
        (bytes32 stateRoot, bytes32 storageValue) = verifier.verifyZkTrieProof(target, bytes32(slot), compressedProof[0]);
        require(stateRoot == root, "stateRoot not matched");
        return abi.encodePacked(storageValue);
    }

    /*
     * Retrieves storage values from the specified target address
     *
     * @param {address} target - The target address from which storage values are to be retrieved.
     * @param {bytes32[]} commands - An array of storage keys (commands) to query.
     * @param {bytes[]} constants - An array of constant values corresponding to the storage keys.
     * @param {bytes} proof - The proof data containing Scroll witness data and state proof.
     */
    function getStorageValues(
        address target,
        bytes32[] memory commands,
        bytes[] memory constants,
        bytes memory proof
    ) external view returns (bytes[] memory values) {
        (ScrollWitnessData memory scrollData, StateProof memory stateProof) = abi.decode(proof, (ScrollWitnessData, StateProof));
        bytes[][] memory compressedProofs = new bytes[][](stateProof.storageProofs.length);
        for(uint256 i = 0; i < stateProof.storageProofs.length; i++) {
            compressedProofs[i] = new bytes[](1);
            compressedProofs[i][0] = compressProof(stateProof.stateTrieWitness, stateProof.storageProofs, i);
        }

        (bytes32 computedStateRoot, bytes32 storageValue) = verifier.verifyZkTrieProof(target, scrollData.storageKeys[0], compressedProofs[0][0]);
        bytes32 expectedStateRoot = IScrollChain(verifier.rollup()).finalizedStateRoots(scrollData.batchIndex);
        require(computedStateRoot == expectedStateRoot, "Invalid inclusion proof");

        return EVMProofHelper.getStorageValues(target, getTrieProof, commands, constants, expectedStateRoot, compressedProofs);
    }
}
