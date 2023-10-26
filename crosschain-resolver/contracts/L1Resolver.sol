// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import {EVMFetcher} from '@ensdomains/evm-verifier/contracts/EVMFetcher.sol';
import {EVMFetchTarget} from '@ensdomains/evm-verifier/contracts/EVMFetchTarget.sol';
import {IEVMVerifier} from '@ensdomains/evm-verifier/contracts/IEVMVerifier.sol';

contract L1Resolver is EVMFetchTarget {
    using EVMFetcher for EVMFetcher.EVMFetchRequest;
    uint256 private constant COIN_TYPE_ETH = 60;
    IEVMVerifier immutable verifier;
    address target;
    uint256 constant RECORD_VERSIONS_SLOT = 1;
    uint256 constant VERSINABLE_ADDRESSES_SLOT = 3;
    uint256 constant VERSINABLE_HASHES_SLOT = 4;
    uint256 constant VERSINABLE_TEXTS_SLOT = 11;
    uint8 constant RECORD_VERSIONS_REF = 0;

    constructor(IEVMVerifier _verifier, address _target) {
        verifier = _verifier;
        target = _target;
    }

    /**
     * Returns the address associated with an ENS node.
     * @param node The ENS node to query.
     * @return The associated address.
     */
    function addr(bytes32 node) public view returns (address) {
        EVMFetcher.newFetchRequest(verifier, target)
            .getStatic(RECORD_VERSIONS_SLOT)
              .element(node)
            .getDynamic(VERSINABLE_ADDRESSES_SLOT)
              .ref(RECORD_VERSIONS_REF)
              .element(node)
              .element(COIN_TYPE_ETH)
            .fetch(this.addrCallback.selector, ''); // recordVersions
    }

    function addrCallback(
        bytes[] memory values,
        bytes memory
    ) public pure returns (address) {
        return bytesToAddress(values[1]);
    }

    /**
     * Returns the address associated with an ENS node.
     * @param node The ENS node to query.
     * @param coinType The cointype to query
     * @return The associated address.
     */
    function addr(
        bytes32 node,
        uint256 coinType
    ) public view returns (bytes memory) {
        EVMFetcher.newFetchRequest(verifier, target)
            .getStatic(RECORD_VERSIONS_SLOT)
              .element(node)
            .getDynamic(VERSINABLE_ADDRESSES_SLOT)
              .ref(RECORD_VERSIONS_REF)
              .element(node)
              .element(coinType)
            .fetch(this.addrCoinTypeCallback.selector, '');
    }

    function addrCoinTypeCallback(
        bytes[] memory values,
        bytes memory
    ) public pure returns (bytes memory) {
        return values[1];
    }

    /**
     * Returns the text data associated with an ENS node and key.
     * @param node The ENS node to query.
     * @param key The text data key to query.
     * @return The associated text data.
     */
    function text(
        bytes32 node,
        string calldata key
    ) public view returns (string memory) {
        EVMFetcher.newFetchRequest(verifier, target)
            .getStatic(RECORD_VERSIONS_SLOT)
              .element(node)
            .getDynamic(VERSINABLE_TEXTS_SLOT)
              .ref(RECORD_VERSIONS_REF)
              .element(node)
              .element(key)
            .fetch(this.textCallback.selector, '');
    }

    function textCallback(
        bytes[] memory values,
        bytes memory
    ) public pure returns (string memory) {
        return string(values[1]);
    }

    /**
     * Returns the contenthash associated with an ENS node.
     * @param node The ENS node to query.
     * @return The associated contenthash.
     */
    function contenthash(bytes32 node) public view returns (bytes memory) {
        EVMFetcher.newFetchRequest(verifier, target)
            .getStatic(RECORD_VERSIONS_SLOT)
              .element(node)
            .getDynamic(VERSINABLE_HASHES_SLOT)
              .ref(RECORD_VERSIONS_REF)
              .element(node)
            .fetch(this.contenthashCallback.selector, '');
    }

    function contenthashCallback(
        bytes[] memory values,
        bytes memory
    ) public pure returns (bytes memory) {
        return values[1];
    }

    function bytesToAddress(
        bytes memory b
    ) internal pure returns (address payable a) {
        require(b.length == 20);
        assembly {
            a := div(mload(add(b, 32)), exp(256, 12))
        }
    }
}