// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {GatewayRequest, GatewayProver, ProofSequence} from "../GatewayProver.sol";
import {EthTrieHooks} from "./EthTrieHooks.sol";

contract EthSelfVerifier {

	function verify(GatewayRequest memory req, bytes32 stateRoot, bytes[] memory proofs, bytes memory order) external view returns (bytes[] memory outputs, uint8 exitCode) {
		return GatewayProver.evalRequest(req, ProofSequence(0,
			stateRoot,
			proofs, order,
			EthTrieHooks.proveAccountState, 
			EthTrieHooks.proveStorageValue
		));
	}

	function proveAccountState(bytes32 stateRoot, address target, bytes memory encodedProof) external pure returns (bytes32) {
		return EthTrieHooks.proveAccountState(stateRoot, target, encodedProof);
	}

	function proveStorageValue(bytes32 storageRoot, address target, uint256 slot, bytes memory encodedProof) external pure returns (bytes32) {
		return EthTrieHooks.proveStorageValue(storageRoot, target, slot, encodedProof);
	}

}
