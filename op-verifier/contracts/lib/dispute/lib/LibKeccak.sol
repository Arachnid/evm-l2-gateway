// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/// @title LibKeccak
/// @notice An EVM implementation of the Keccak-f[1600] permutation.
/// @author clabby <https://github.com/clabby>
/// @custom:attribution geohot <https://github.com/geohot>
library LibKeccak {
    /// @notice The block size of the Keccak-f[1600] permutation, 1088 bits (136 bytes).
    uint256 internal constant BLOCK_SIZE_BYTES = 136;

    /// @notice The round constants for the keccak256 hash function. Packed in memory for efficient reading during the
    ///         permutation.
    bytes internal constant ROUND_CONSTANTS = abi.encode(
        0x00000000000000010000000000008082800000000000808a8000000080008000, // r1,r2,r3,r4
        0x000000000000808b000000008000000180000000800080818000000000008009, // r5,r6,r7,r8
        0x000000000000008a00000000000000880000000080008009000000008000000a, // r9,r10,r11,r12
        0x000000008000808b800000000000008b80000000000080898000000000008003, // r13,r14,r15,r16
        0x80000000000080028000000000000080000000000000800a800000008000000a, // r17,r18,r19,r20
        0x8000000080008081800000000000808000000000800000018000000080008008 // r21,r22,r23,r24
    );

    /// @notice A mask for 64-bit values.
    uint64 private constant U64_MASK = 0xFFFFFFFFFFFFFFFF;

    /// @notice The 5x5 state matrix for the keccak-f[1600] permutation.
    struct StateMatrix {
        uint64[25] state;
    }

    /// @notice Performs the Keccak-f[1600] permutation on the given 5x5 state matrix.
    function permutation(StateMatrix memory _stateMatrix) internal pure {
        // Pull the round constants into memory to avoid reallocation in the unrolled permutation loop.
        bytes memory roundConstants = ROUND_CONSTANTS;

        assembly {
            // Add 32 to the state matrix pointer to skip the data location field.
            let stateMatrixPtr := add(_stateMatrix, 0x20)
            let rcPtr := add(roundConstants, 0x20)

            // set a state element in the passed `StateMatrix` struct memory ptr.
            function setStateElem(ptr, idx, data) {
                mstore(add(ptr, shl(0x05, idx)), and(data, U64_MASK))
            }

            // fetch a state element from the passed `StateMatrix` struct memory ptr.
            function stateElem(ptr, idx) -> elem {
                elem := mload(add(ptr, shl(0x05, idx)))
            }

            // 64 bit logical shift
            function shl64(a, b) -> val {
                val := and(shl(a, b), U64_MASK)
            }

            // Performs an indivudual rho + pi computation, to be used in the full `thetaRhoPi` chain.
            function rhoPi(ptr, destIdx, srcIdx, fact, dt) {
                let xs1 := xor(stateElem(ptr, srcIdx), dt)
                let res := xor(shl(fact, xs1), shr(sub(64, fact), xs1))
                setStateElem(ptr, destIdx, res)
            }

            // xor a column in the state matrix
            function xorColumn(ptr, col) -> val {
                val :=
                    xor(
                        xor(xor(stateElem(ptr, col), stateElem(ptr, add(col, 5))), stateElem(ptr, add(col, 10))),
                        xor(stateElem(ptr, add(col, 15)), stateElem(ptr, add(col, 20)))
                    )
            }

            // Performs the `theta`, `rho`, and `pi` steps of the Keccak-f[1600] permutation on
            // the passed `StateMatrix` struct memory ptr.
            function thetaRhoPi(ptr) {
                // Theta
                let C0 := xorColumn(ptr, 0)
                let C1 := xorColumn(ptr, 1)
                let C2 := xorColumn(ptr, 2)
                let C3 := xorColumn(ptr, 3)
                let C4 := xorColumn(ptr, 4)
                let D0 := xor(xor(shl64(1, C1), shr(63, C1)), C4)
                let D1 := xor(xor(shl64(1, C2), shr(63, C2)), C0)
                let D2 := xor(xor(shl64(1, C3), shr(63, C3)), C1)
                let D3 := xor(xor(shl64(1, C4), shr(63, C4)), C2)
                let D4 := xor(xor(shl64(1, C0), shr(63, C0)), C3)

                let xs1 := xor(stateElem(ptr, 1), D1)
                let A1 := xor(shl(1, xs1), shr(63, xs1))

                let _ptr := ptr
                setStateElem(_ptr, 0, xor(stateElem(_ptr, 0), D0))
                rhoPi(_ptr, 1, 6, 44, D1)
                rhoPi(_ptr, 6, 9, 20, D4)
                rhoPi(_ptr, 9, 22, 61, D2)
                rhoPi(_ptr, 22, 14, 39, D4)
                rhoPi(_ptr, 14, 20, 18, D0)
                rhoPi(_ptr, 20, 2, 62, D2)
                rhoPi(_ptr, 2, 12, 43, D2)
                rhoPi(_ptr, 12, 13, 25, D3)
                rhoPi(_ptr, 13, 19, 8, D4)
                rhoPi(_ptr, 19, 23, 56, D3)
                rhoPi(_ptr, 23, 15, 41, D0)
                rhoPi(_ptr, 15, 4, 27, D4)
                rhoPi(_ptr, 4, 24, 14, D4)
                rhoPi(_ptr, 24, 21, 2, D1)
                rhoPi(_ptr, 21, 8, 55, D3)
                rhoPi(_ptr, 8, 16, 45, D1)
                rhoPi(_ptr, 16, 5, 36, D0)
                rhoPi(_ptr, 5, 3, 28, D3)
                rhoPi(_ptr, 3, 18, 21, D3)
                rhoPi(_ptr, 18, 17, 15, D2)
                rhoPi(_ptr, 17, 11, 10, D1)
                rhoPi(_ptr, 11, 7, 6, D2)
                rhoPi(_ptr, 7, 10, 3, D0)
                setStateElem(_ptr, 10, A1)
            }

            // Inner `chi` function, unrolled in `chi` for performance.
            function innerChi(ptr, start) {
                let A0 := stateElem(ptr, start)
                let A1 := stateElem(ptr, add(start, 1))
                let A2 := stateElem(ptr, add(start, 2))
                let A3 := stateElem(ptr, add(start, 3))
                let A4 := stateElem(ptr, add(start, 4))

                setStateElem(ptr, start, xor(A0, and(not(A1), A2)))
                setStateElem(ptr, add(start, 1), xor(A1, and(not(A2), A3)))
                setStateElem(ptr, add(start, 2), xor(A2, and(not(A3), A4)))
                setStateElem(ptr, add(start, 3), xor(A3, and(not(A4), A0)))
                setStateElem(ptr, add(start, 4), xor(A4, and(not(A0), A1)))
            }

            // Performs the `chi` step of the Keccak-f[1600] permutation on the passed `StateMatrix` struct memory ptr
            function chi(ptr) {
                innerChi(ptr, 0)
                innerChi(ptr, 5)
                innerChi(ptr, 10)
                innerChi(ptr, 15)
                innerChi(ptr, 20)
            }

            // Perform the full Keccak-f[1600] permutation on a `StateMatrix` struct memory ptr for a given round.
            function permute(ptr, roundsPtr, round) {
                // Theta, Rho, Pi, Chi
                thetaRhoPi(ptr)
                chi(ptr)
                // Iota
                let roundConst := shr(192, mload(add(roundsPtr, shl(0x03, round))))
                setStateElem(ptr, 0, xor(stateElem(ptr, 0), roundConst))
            }

            // Unroll the permutation loop.
            permute(stateMatrixPtr, rcPtr, 0)
            permute(stateMatrixPtr, rcPtr, 1)
            permute(stateMatrixPtr, rcPtr, 2)
            permute(stateMatrixPtr, rcPtr, 3)
            permute(stateMatrixPtr, rcPtr, 4)
            permute(stateMatrixPtr, rcPtr, 5)
            permute(stateMatrixPtr, rcPtr, 6)
            permute(stateMatrixPtr, rcPtr, 7)
            permute(stateMatrixPtr, rcPtr, 8)
            permute(stateMatrixPtr, rcPtr, 9)
            permute(stateMatrixPtr, rcPtr, 10)
            permute(stateMatrixPtr, rcPtr, 11)
            permute(stateMatrixPtr, rcPtr, 12)
            permute(stateMatrixPtr, rcPtr, 13)
            permute(stateMatrixPtr, rcPtr, 14)
            permute(stateMatrixPtr, rcPtr, 15)
            permute(stateMatrixPtr, rcPtr, 16)
            permute(stateMatrixPtr, rcPtr, 17)
            permute(stateMatrixPtr, rcPtr, 18)
            permute(stateMatrixPtr, rcPtr, 19)
            permute(stateMatrixPtr, rcPtr, 20)
            permute(stateMatrixPtr, rcPtr, 21)
            permute(stateMatrixPtr, rcPtr, 22)
            permute(stateMatrixPtr, rcPtr, 23)
        }
    }

    /// @notice Absorb a fixed-sized block into the sponge.
    function absorb(StateMatrix memory _stateMatrix, bytes memory _input) internal pure {
        assembly {
            // The input must be 1088 bits long.
            if iszero(eq(mload(_input), BLOCK_SIZE_BYTES)) { revert(0, 0) }

            let dataPtr := add(_input, 0x20)
            let statePtr := add(_stateMatrix, 0x20)

            // set a state element in the passed `StateMatrix` struct memory ptr.
            function setStateElem(ptr, idx, data) {
                mstore(add(ptr, shl(0x05, idx)), and(data, U64_MASK))
            }

            // fetch a state element from the passed `StateMatrix` struct memory ptr.
            function stateElem(ptr, idx) -> elem {
                elem := mload(add(ptr, shl(0x05, idx)))
            }

            // Inner sha3 absorb XOR function
            function absorbInner(stateMatrixPtr, inputPtr, idx) {
                let boWord := mload(add(inputPtr, shl(3, idx)))

                let res :=
                    or(
                        or(
                            or(shl(56, byte(7, boWord)), shl(48, byte(6, boWord))),
                            or(shl(40, byte(5, boWord)), shl(32, byte(4, boWord)))
                        ),
                        or(
                            or(shl(24, byte(3, boWord)), shl(16, byte(2, boWord))),
                            or(shl(8, byte(1, boWord)), byte(0, boWord))
                        )
                    )
                setStateElem(stateMatrixPtr, idx, xor(stateElem(stateMatrixPtr, idx), res))
            }

            // Unroll the input XOR loop.
            absorbInner(statePtr, dataPtr, 0)
            absorbInner(statePtr, dataPtr, 1)
            absorbInner(statePtr, dataPtr, 2)
            absorbInner(statePtr, dataPtr, 3)
            absorbInner(statePtr, dataPtr, 4)
            absorbInner(statePtr, dataPtr, 5)
            absorbInner(statePtr, dataPtr, 6)
            absorbInner(statePtr, dataPtr, 7)
            absorbInner(statePtr, dataPtr, 8)
            absorbInner(statePtr, dataPtr, 9)
            absorbInner(statePtr, dataPtr, 10)
            absorbInner(statePtr, dataPtr, 11)
            absorbInner(statePtr, dataPtr, 12)
            absorbInner(statePtr, dataPtr, 13)
            absorbInner(statePtr, dataPtr, 14)
            absorbInner(statePtr, dataPtr, 15)
            absorbInner(statePtr, dataPtr, 16)
        }
    }

    /// @notice Squeezes the final keccak256 digest from the passed `StateMatrix`.
    function squeeze(StateMatrix memory _stateMatrix) internal pure returns (bytes32 hash_) {
        assembly {
            // 64 bit logical shift
            function shl64(a, b) -> val {
                val := and(shl(a, b), U64_MASK)
            }

            // convert a big endian 64-bit value to a little endian 64-bit value.
            function toLE(beVal) -> leVal {
                beVal := or(and(shl64(8, beVal), 0xFF00FF00FF00FF00), and(shr(8, beVal), 0x00FF00FF00FF00FF))
                beVal := or(and(shl64(16, beVal), 0xFFFF0000FFFF0000), and(shr(16, beVal), 0x0000FFFF0000FFFF))
                leVal := or(shl64(32, beVal), shr(32, beVal))
            }

            // fetch a state element from the passed `StateMatrix` struct memory ptr.
            function stateElem(ptr, idx) -> elem {
                elem := mload(add(ptr, shl(0x05, idx)))
            }

            let stateMatrixPtr := add(_stateMatrix, 0x20)
            hash_ :=
                or(
                    or(shl(192, toLE(stateElem(stateMatrixPtr, 0))), shl(128, toLE(stateElem(stateMatrixPtr, 1)))),
                    or(shl(64, toLE(stateElem(stateMatrixPtr, 2))), toLE(stateElem(stateMatrixPtr, 3)))
                )
        }
    }

    /// @notice Pads input data to an even multiple of the Keccak-f[1600] permutation block size, 1088 bits (136 bytes).
    function pad(bytes calldata _data) internal pure returns (bytes memory padded_) {
        assembly {
            padded_ := mload(0x40)

            // Grab the original length of `_data`
            let len := _data.length

            let dataPtr := add(padded_, 0x20)
            let endPtr := add(dataPtr, len)

            // Copy the data into memory.
            calldatacopy(dataPtr, _data.offset, len)

            let modBlockSize := mod(len, BLOCK_SIZE_BYTES)
            switch modBlockSize
            case false {
                // Clean the full padding block. It is possible that this memory is dirty, since solidity sometimes does
                // not update the free memory pointer when allocating memory, for example with external calls. To do
                // this, we read out-of-bounds from the calldata, which will always return 0 bytes.
                calldatacopy(endPtr, calldatasize(), BLOCK_SIZE_BYTES)

                // If the input is a perfect multiple of the block size, then we add a full extra block of padding.
                mstore8(endPtr, 0x01)
                mstore8(sub(add(endPtr, BLOCK_SIZE_BYTES), 0x01), 0x80)

                // Update the length of the data to include the padding.
                mstore(padded_, add(len, BLOCK_SIZE_BYTES))
            }
            default {
                // If the input is not a perfect multiple of the block size, then we add a partial block of padding.
                // This should entail a set bit after the input, followed by as many zero bits as necessary to fill
                // the block, followed by a single 1 bit in the lowest-order bit of the final block.

                let remaining := sub(BLOCK_SIZE_BYTES, modBlockSize)
                let newLen := add(len, remaining)
                let paddedEndPtr := add(dataPtr, newLen)

                // Clean the remainder to ensure that the intermediate data between the padding bits is 0. It is
                // possible that this memory is dirty, since solidity sometimes does not update the free memory pointer
                // when allocating memory, for example with external calls. To do this, we read out-of-bounds from the
                // calldata, which will always return 0 bytes.
                let partialRemainder := sub(paddedEndPtr, endPtr)
                calldatacopy(endPtr, calldatasize(), partialRemainder)

                // Store the padding bits.
                mstore8(sub(paddedEndPtr, 0x01), 0x80)
                mstore8(endPtr, or(byte(0x00, mload(endPtr)), 0x01))

                // Update the length of the data to include the padding. The length should be a multiple of the
                // block size after this.
                mstore(padded_, newLen)
            }

            // Update the free memory pointer.
            mstore(0x40, add(padded_, and(add(mload(padded_), 0x3F), not(0x1F))))
        }
    }

    /// @notice Pads input data to an even multiple of the Keccak-f[1600] permutation block size, 1088 bits (136 bytes).
    function padMemory(bytes memory _data) internal pure returns (bytes memory padded_) {
        assembly {
            padded_ := mload(0x40)

            // Grab the original length of `_data`
            let len := mload(_data)

            let dataPtr := add(padded_, 0x20)
            let endPtr := add(dataPtr, len)

            // Copy the data.
            let originalDataPtr := add(_data, 0x20)
            for { let i := 0x00 } lt(i, len) { i := add(i, 0x20) } {
                mstore(add(dataPtr, i), mload(add(originalDataPtr, i)))
            }

            let modBlockSize := mod(len, BLOCK_SIZE_BYTES)
            switch modBlockSize
            case false {
                // Clean the full padding block. It is possible that this memory is dirty, since solidity sometimes does
                // not update the free memory pointer when allocating memory, for example with external calls. To do
                // this, we read out-of-bounds from the calldata, which will always return 0 bytes.
                calldatacopy(endPtr, calldatasize(), BLOCK_SIZE_BYTES)

                // If the input is a perfect multiple of the block size, then we add a full extra block of padding.
                mstore8(sub(add(endPtr, BLOCK_SIZE_BYTES), 0x01), 0x80)
                mstore8(endPtr, 0x01)

                // Update the length of the data to include the padding.
                mstore(padded_, add(len, BLOCK_SIZE_BYTES))
            }
            default {
                // If the input is not a perfect multiple of the block size, then we add a partial block of padding.
                // This should entail a set bit after the input, followed by as many zero bits as necessary to fill
                // the block, followed by a single 1 bit in the lowest-order bit of the final block.

                let remaining := sub(BLOCK_SIZE_BYTES, modBlockSize)
                let newLen := add(len, remaining)
                let paddedEndPtr := add(dataPtr, newLen)

                // Clean the remainder to ensure that the intermediate data between the padding bits is 0. It is
                // possible that this memory is dirty, since solidity sometimes does not update the free memory pointer
                // when allocating memory, for example with external calls. To do this, we read out-of-bounds from the
                // calldata, which will always return 0 bytes.
                let partialRemainder := sub(paddedEndPtr, endPtr)
                calldatacopy(endPtr, calldatasize(), partialRemainder)

                // Store the padding bits.
                mstore8(sub(paddedEndPtr, 0x01), 0x80)
                mstore8(endPtr, or(byte(0x00, mload(endPtr)), 0x01))

                // Update the length of the data to include the padding. The length should be a multiple of the
                // block size after this.
                mstore(padded_, newLen)
            }

            // Update the free memory pointer.
            mstore(0x40, add(padded_, and(add(mload(padded_), 0x3F), not(0x1F))))
        }
    }
}