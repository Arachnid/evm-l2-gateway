// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {GatewayRequest, GatewayProver, ProofSequence} from "../GatewayProver.sol";
import {LineaTrieHooks} from "./LineaTrieHooks.sol";

contract LineaSelfVerifier {

	function verify(GatewayRequest memory req, bytes32 stateRoot, bytes[] memory proofs, bytes memory order) external view returns (bytes[] memory outputs, uint8 exitCode) {
		return GatewayProver.evalRequest(req, ProofSequence(0, 
			stateRoot,
			proofs, order,
			LineaTrieHooks.proveAccountState,
			LineaTrieHooks.proveStorageValue
		));
	}

	function proveAccountState(bytes32 stateRoot, address target, bytes memory encodedProof) external pure returns (bytes32) {
		return LineaTrieHooks.proveAccountState(stateRoot, target, encodedProof);
	}

	function proveStorageValue(bytes32 storageRoot, address target, uint256 slot, bytes memory encodedProof) external pure returns (bytes32) {
		return LineaTrieHooks.proveStorageValue(storageRoot, target, slot, encodedProof);
	}

}
