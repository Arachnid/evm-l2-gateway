// SPDX-License-Identifier: MIT
pragma solidity ^0.8.15;

import {IEVMVerifier} from '@ensdomains/evm-verifier/contracts/IEVMVerifier.sol';
import {StateProof, EVMProofHelper} from '@ensdomains/evm-verifier/contracts/EVMProofHelper.sol';
import {DisputeGameLookup, L2OutputOracleLookup, IOptimismPortalOutputRoot, OPWitnessProofType} from './lib/OPOutputLookup.sol';
import {MerkleTrieProofHelper} from '@ensdomains/evm-verifier/contracts/MerkleTrieProofHelper.sol';
import {Hashing} from '@eth-optimism/contracts-bedrock/src/libraries/Hashing.sol';
import {Types} from '@eth-optimism/contracts-bedrock/src/libraries/Types.sol';

struct OPWitnessData {
    OPWitnessProofType proofType;
    uint256 index;
    Types.OutputRootProof outputRootProof;
}

contract OPVerifier is IEVMVerifier {
    error OutputRootMismatch(
        OPWitnessProofType proofType,
        uint256 index,
        bytes32 expected,
        bytes32 actual
    );

    IOptimismPortalOutputRoot public immutable optimismPortal;
    uint256 public immutable minAge;
    uint256 public immutable maxAge;

    string[] _gatewayURLs;

    constructor(
        string[] memory urls,
        address optimismPortalAddress,
        uint256 minimumAge,
        uint256 maximumAge
    ) {
        _gatewayURLs = urls;
        optimismPortal = IOptimismPortalOutputRoot(optimismPortalAddress);
        minAge = minimumAge;
        maxAge = maximumAge;
    }

    function gatewayURLs() external view returns (string[] memory) {
        return _gatewayURLs;
    }

    function getL2OracleOutput(uint256 index) internal view returns (bytes32) {
        return
            L2OutputOracleLookup
                .getL2Output(optimismPortal, index, minAge, maxAge)
                .outputRoot;
    }

    function getDisputeGameOutput(
        uint256 index
    ) internal view returns (bytes32) {
        (bytes32 outputRoot, , , ) = DisputeGameLookup.getRespectedDisputeGame(
            optimismPortal,
            index,
            minAge,
            maxAge
        );

        return outputRoot;
    }

    function getStorageValues(
        address target,
        bytes32[] memory commands,
        bytes[] memory constants,
        bytes memory proof
    ) external view returns (bytes[] memory values) {
        (OPWitnessData memory opData, StateProof memory stateProof) = abi
            .decode(proof, (OPWitnessData, StateProof));
        bytes32 expectedRoot = Hashing.hashOutputRootProof(
            opData.outputRootProof
        );

        bytes32 outputRoot;

        if (opData.proofType == OPWitnessProofType.DisputeGame) {
            outputRoot = getDisputeGameOutput(opData.index);
        } else if (opData.proofType == OPWitnessProofType.L2OutputOracle) {
            outputRoot = getL2OracleOutput(opData.index);
        }

        if (outputRoot != expectedRoot) {
            revert OutputRootMismatch(
                opData.proofType,
                opData.index,
                expectedRoot,
                outputRoot
            );
        }

        bytes32 storageRoot = MerkleTrieProofHelper.getStorageRoot(opData.outputRootProof.stateRoot, target, stateProof.stateTrieWitness);
        return EVMProofHelper.getStorageValues(target, MerkleTrieProofHelper.getTrieProof, commands, constants, storageRoot, stateProof.storageProofs);
    }
}
