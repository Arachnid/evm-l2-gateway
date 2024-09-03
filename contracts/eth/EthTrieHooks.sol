// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {NOT_A_CONTRACT, NULL_CODE_HASH} from "../ProofUtils.sol";
import {SecureMerkleTrie} from "./SecureMerkleTrie.sol";
import {RLPReader, RLPReaderExt} from "../RLPReaderExt.sol";

library EthTrieHooks {

	// accountState structure:
	// standard: [nonce, balance, storageRoot, codeHash]
	// blast: [nonce, flags, fixed, shares, remainder, storageRoot, codeHash]
	// generalization: index from the end 
	function proveAccountState(bytes32 stateRoot, address target, bytes memory proof) internal pure returns (bytes32 storageRoot) {
		(bool exists, bytes memory value) = SecureMerkleTrie.get(abi.encodePacked(target), abi.decode(proof, (bytes[])), stateRoot);
		if (!exists) return NOT_A_CONTRACT;
		RLPReader.RLPItem[] memory v = RLPReader.readList(value);
		bytes32 codeHash = RLPReaderExt.strictBytes32FromRLP(v[v.length - 1]);
		return codeHash == NULL_CODE_HASH ? NOT_A_CONTRACT : RLPReaderExt.strictBytes32FromRLP(v[v.length - 2]);
	}

	function proveStorageValue(bytes32 storageRoot, address, uint256 slot, bytes memory proof) internal pure returns (bytes32) {
		(bool exists, bytes memory v) = SecureMerkleTrie.get(abi.encodePacked(slot), abi.decode(proof, (bytes[])), storageRoot);
		return exists ? RLPReaderExt.bytes32FromRLP(RLPReader.readBytes(v)) : bytes32(0);
	}

}