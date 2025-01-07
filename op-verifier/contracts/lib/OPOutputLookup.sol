// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import "./dispute/interfaces/IFaultDisputeGame.sol";
import "./DisputeGameLookup.sol";
import "./L2OutputOracleLookup.sol";
import "./IOptimismPortalOutputRoot.sol";

// For OPVerifier ENS Gateway
enum OPWitnessProofType {
    L2OutputOracle,
    DisputeGame
}

// For OPVerifier ENS Gateway
struct OPProvableBlock {
    OPWitnessProofType proofType;
    uint256 index;
    uint256 blockNumber;
    bytes32 outputRoot;
}

/**
 * @title OPOutputLookup
 * @dev Contract for querying dispute games and L2 output oracles in the Optimism portal.
 */
contract OPOutputLookup {
    // ========================
    // Dispute Game
    // ========================

    /**
     * @notice Retrieves the dispute game at the specified index.
     * @param optimismPortal The Optimism portal output root contract.
     * @param index The index of the dispute game.
     * @param minAge The minimum age required for the game.
     * @param maxAge The maximum age allowed for the game.
     * @return outputRoot The root claim of the dispute game.
     * @return gameType The type of the dispute game.
     * @return gameCreationTime The creation time of the dispute game.
     * @return proxy The dispute game proxy.
     */
    function getDisputeGame(
        IOptimismPortalOutputRoot optimismPortal,
        uint256 index,
        uint256 minAge,
        uint256 maxAge
    )
        public
        view
        returns (
            bytes32 outputRoot,
            GameType gameType,
            uint64 gameCreationTime,
            IDisputeGame proxy
        )
    {
        return
            DisputeGameLookup.getDisputeGame(
                optimismPortal,
                index,
                minAge,
                maxAge
            );
    }

    /**
     * @notice Retrieves the respected dispute game at the specified index.
     * @param optimismPortal The Optimism portal output root contract.
     * @param index The index of the dispute game.
     * @param minAge The minimum age required for the game.
     * @param maxAge The maximum age allowed for the game.
     * @return outputRoot The root claim of the dispute game.
     * @return gameType The type of the respected dispute game.
     * @return gameCreationTime The creation time of the dispute game.
     * @return proxy The dispute game proxy.
     */
    function getRespectedDisputeGame(
        IOptimismPortalOutputRoot optimismPortal,
        uint256 index,
        uint256 minAge,
        uint256 maxAge
    )
        public
        view
        returns (
            bytes32 outputRoot,
            GameType gameType,
            uint64 gameCreationTime,
            IDisputeGame proxy
        )
    {
        return
            DisputeGameLookup.getRespectedDisputeGame(
                optimismPortal,
                index,
                minAge,
                maxAge
            );
    }

    /**
     * @notice Retrieves the latest dispute game of a specific type.
     * @param optimismPortal The Optimism portal output root contract.
     * @param gameType The type of the dispute game.
     * @param minAge The minimum age required for the game.
     * @param maxAge The maximum age allowed for the game.
     * @return disputeGameIndex The index of the dispute game.
     * @return outputRoot The root claim of the dispute game.
     * @return gameCreationTime The creation time of the dispute game.
     * @return blockNumber The block number of the L2 state.
     * @return proxy The dispute game proxy.
     */
    function getLatestDisputeGame(
        IOptimismPortalOutputRoot optimismPortal,
        GameType gameType,
        uint256 minAge,
        uint256 maxAge
    )
        public
        view
        returns (
            uint256 disputeGameIndex,
            bytes32 outputRoot,
            uint64 gameCreationTime,
            uint256 blockNumber,
            IDisputeGame proxy
        )
    {
        return
            DisputeGameLookup.getLatestDisputeGame(
                optimismPortal,
                gameType,
                minAge,
                maxAge
            );
    }

    /**
     * @notice Retrieves the latest respected dispute game for L2 withdrawal.
     * @param optimismPortal The Optimism portal output root contract.
     * @param minAge The minimum age required for the game.
     * @param maxAge The maximum age allowed for the game.
     * @return disputeGameIndex The index of the dispute game.
     * @return outputRoot The root claim of the dispute game.
     * @return gameCreationTime The creation time of the dispute game.
     * @return blockNumber The block number of the L2 state.
     * @return proxy The dispute game proxy.
     * @return gameType The type of the respected dispute game.
     */
    function getLatestRespectedDisputeGame(
        IOptimismPortalOutputRoot optimismPortal,
        uint256 minAge,
        uint256 maxAge
    )
        public
        view
        returns (
            uint256 disputeGameIndex,
            bytes32 outputRoot,
            uint64 gameCreationTime,
            uint256 blockNumber,
            IDisputeGame proxy,
            GameType gameType
        )
    {
        return
            DisputeGameLookup.getLatestRespectedDisputeGame(
                optimismPortal,
                minAge,
                maxAge
            );
    }

    // ========================
    // L2 Output Oracle
    // ========================

    /**
     * @notice Retrieves the latest L2 output that meets the specified age criteria.
     * @param optimismPortal The Optimism portal output root contract.
     * @param minAge The minimum age required for the output.
     * @param maxAge The maximum age allowed for the output.
     * @return index The index of the latest L2 output.
     * @return The latest L2 output proposal.
     */
    function getLatestL2Output(
        IOptimismPortalOutputRoot optimismPortal,
        uint256 minAge,
        uint256 maxAge
    ) public view returns (uint256 index, Types.OutputProposal memory) {
        return
            L2OutputOracleLookup.getLatestL2Output(
                optimismPortal,
                minAge,
                maxAge
            );
    }

    /**
     * @notice Retrieves the L2 output at the specified index that meets the specified age criteria.
     * @param optimismPortal The Optimism portal output root contract.
     * @param index The index of the L2 output.
     * @param minAge The minimum age required for the output.
     * @param maxAge The maximum age allowed for the output.
     * @return The L2 output proposal.
     */
    function getL2Output(
        IOptimismPortalOutputRoot optimismPortal,
        uint256 index,
        uint256 minAge,
        uint256 maxAge
    ) public view returns (Types.OutputProposal memory) {
        return
            L2OutputOracleLookup.getL2Output(
                optimismPortal,
                index,
                minAge,
                maxAge
            );
    }

    // ========================
    // ENS Gateway
    // ========================

    /**
     * @dev Emitted when the proof type is unknown.
     */
    error UnknownProofType();

    /**
     * @notice Retrieves the proof type used by the Optimism portal.
     * @param optimismPortal The Optimism portal output root contract.
     * @return The proof type used by the Optimism portal.
     */
    function getProofType(
        IOptimismPortalOutputRoot optimismPortal
    ) public view returns (OPWitnessProofType) {
        try optimismPortal.disputeGameFactory() returns (
            IDisputeGameFactory factory
        ) {
            if (address(factory) != address(0)) {
                return OPWitnessProofType.DisputeGame;
            }
        } catch {}

        try optimismPortal.l2Oracle() returns (IL2OutputOracle oracle) {
            if (address(oracle) != address(0)) {
                return OPWitnessProofType.L2OutputOracle;
            }
        } catch {}

        revert UnknownProofType();
    }

    /**
     * @notice Retrieves the OP provable block that meets the specified age criteria.
     * @param optimismPortal The Optimism portal output root contract.
     * @param minAge The minimum age required for the proof.
     * @param maxAge The maximum age allowed for the proof.
     * @return result The OP provable block for ENS OP Gateway.
     */
    function getOPProvableBlock(
        IOptimismPortalOutputRoot optimismPortal,
        uint256 minAge,
        uint256 maxAge
    ) public view returns (OPProvableBlock memory result) {
        result.proofType = getProofType(optimismPortal);

        if (result.proofType == OPWitnessProofType.DisputeGame) {
            (
                uint256 disputeGameIndex,
                bytes32 outputRoot,
                ,
                uint256 blockNumber,
                ,

            ) = getLatestRespectedDisputeGame(optimismPortal, minAge, maxAge);

            result.index = disputeGameIndex;
            result.outputRoot = outputRoot;
            result.blockNumber = blockNumber;

            return result;
        } else if (result.proofType == OPWitnessProofType.L2OutputOracle) {
            (
                uint256 index,
                Types.OutputProposal memory output
            ) = getLatestL2Output(optimismPortal, minAge, maxAge);

            result.index = index;
            result.outputRoot = output.outputRoot;
            result.blockNumber = output.l2BlockNumber;

            return result;
        }

        revert UnknownProofType();
    }
}
