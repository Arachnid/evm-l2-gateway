// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import './dispute/interfaces/IFaultDisputeGame.sol';
import {IOptimismPortalOutputRoot, IDisputeGameFactory} from './IOptimismPortalOutputRoot.sol';
import { GameStatus, Timestamp } from "./dispute/lib/Types.sol";

interface IChallengingDisputeGame is IFaultDisputeGame {
    function claimData(
        uint256 index
    )
        external
        view
        returns (
            uint32 parentIndex,
            address counteredBy,
            address claimant,
            uint128 bond,
            Claim claim,
            Position position,
            Clock clock
        );

    function claimDataLen() external view returns (uint256 len_);
}

/**
 * @title DisputeGameLookup
 * @dev Library for querying dispute games in the Optimism portal.
 */
library DisputeGameLookup {
    /**
     * @dev Emitted when the game type does not match the expected type.
     * @param disputeGameIndex Index of the dispute game.
     * @param expected Expected game type.
     * @param actual Actual game type.
     */
    error GameTypeMismatch(
        uint256 disputeGameIndex,
        GameType expected,
        GameType actual
    );

    /**
     * @dev Emitted when the dispute game is already challenged or challenging.
     * @param disputeGameIndex Index of the dispute game.
     */
    error GameInvalid(uint256 disputeGameIndex);

    /**
     * @dev Emitted when the dispute game is too early to be challenged.
     * @param disputeGameIndex Index of the dispute game.
     * @param age Current age of the game.
     * @param minAge Minimum age required to challenge the game.
     */
    error GameTooEarly(uint256 disputeGameIndex, uint256 age, uint256 minAge);

    /**
     * @dev Emitted when the dispute game is expired.
     * @param disputeGameIndex Index of the dispute game.
     * @param age Current age of the game.
     * @param maxAge Maximum age allowed to challenge the game.
     */
    error GameExpired(uint256 disputeGameIndex, uint256 age, uint256 maxAge);

    /**
     * @dev Emitted when no dispute game is found within the specified minimum age.
     * @param minAge Minimum age required.
     */
    error GameNotFound(uint256 minAge);

    /**
     * @dev Emitted when the dispute game is not enabled.
     */
    error DisputeGameNotEnabled();

    /**
     * @notice Internal function to get the dispute game factory from the optimism portal.
     * @param optimismPortal The Optimism portal output root contract.
     * @return factory The dispute game factory.
     */
    function _disputeGameFactory(
        IOptimismPortalOutputRoot optimismPortal
    ) internal view returns (IDisputeGameFactory) {
        try optimismPortal.disputeGameFactory() returns (
            IDisputeGameFactory factory
        ) {
            if (address(factory) == address(0)) {
                revert DisputeGameNotEnabled();
            }

            return factory;
        } catch {
            revert DisputeGameNotEnabled();
        }
    }

    /**
     * @notice Internal function to check if the dispute game is challenging.
     * @param proxy Dispute Game Proxy to check
     * @return invalid Is the game being challenged?
     */
    function _isGameChallenging(
        IChallengingDisputeGame proxy
    ) internal view returns (bool) {
        // If the game is finalized, we ignore the challenging status
        if (proxy.status() == GameStatus.DEFENDER_WINS) return false;

        // If claimData length is greater than 1, the game is challenging
        if (proxy.claimDataLen() > 1) {
            return true;
        }

        // If root claim is countered by someone then the game is challenging
        (, address counteredBy, , , , , ) = proxy.claimData(0);
        if (counteredBy != address(0)) return true;

        return false;
    }

    /**
     * @notice Internal function to check if the dispute game has already been challenged or is challenging.
     * @param proxy Dispute Game Proxy to check
     * @return invalid Has the game already been challenged or is it still challenging?
     */
    function _isGameInvalid(IDisputeGame proxy) internal view returns (bool) {
        return
            proxy.status() == GameStatus.CHALLENGER_WINS ||
            _isGameChallenging(IChallengingDisputeGame(address(proxy)));
    }

    /**
     * @notice Retrieves the dispute game at the specified index.
     * @param optimismPortal The Optimism portal output root contract.
     * @param index The index of the dispute game.
     * @param minAge The minimum age required to challenge the game.
     * @param maxAge The maximum age allowed to challenge the game.
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
        internal
        view
        returns (
            bytes32 outputRoot,
            GameType gameType,
            uint64 gameCreationTime,
            IDisputeGame proxy
        )
    {
        IDisputeGameFactory disputeGameFactory = _disputeGameFactory(
            optimismPortal
        );

        // Get dispute game at index
        Timestamp gameCreationTimeRaw;
        (gameType, gameCreationTimeRaw, proxy) = disputeGameFactory.gameAtIndex(
            index
        );
        outputRoot = proxy.rootClaim().raw();

        // Unwrap gameCreationTime to uint64
        gameCreationTime = gameCreationTimeRaw.raw();

        // Wait for challenger to challenge the dispute game
        if (block.timestamp - gameCreationTime < minAge) {
            revert GameTooEarly(
                index,
                block.timestamp - gameCreationTime,
                minAge
            );
        }

        // Reject dispute game that has been expired
        if (maxAge > 0 && block.timestamp - gameCreationTime > maxAge) {
            revert GameExpired(
                index,
                block.timestamp - gameCreationTime,
                maxAge
            );
        }

        // Revert if the game is challenged or challenging
        if (_isGameInvalid(proxy)) {
            revert GameInvalid(index);
        }
    }

    /**
     * @notice Retrieves the dispute game that is respected for L2 withdrawal.
     * @param optimismPortal The Optimism portal output root contract.
     * @param index The index of the dispute game.
     * @param minAge The minimum age required to challenge the game.
     * @param maxAge The maximum age allowed to challenge the game.
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
        internal
        view
        returns (
            bytes32 outputRoot,
            GameType gameType,
            uint64 gameCreationTime,
            IDisputeGame proxy
        )
    {
        // Get gameType used for L2 withdrawal
        GameType respectedGameType = optimismPortal.respectedGameType();

        // Get dispute game output and game type
        (outputRoot, gameType, gameCreationTime, proxy) = getDisputeGame(
            optimismPortal,
            index,
            minAge,
            maxAge
        );

        // Revert if gameType is not the one used for L2 withdrawal
        if (gameType.raw() != respectedGameType.raw()) {
            revert GameTypeMismatch(index, respectedGameType, gameType);
        }
    }

    /**
     * @notice Finds the start index for searching based on the maximum timestamp.
     * @param disputeGameFactory The dispute game factory.
     * @param maxTimestamp The maximum timestamp to search.
     * @return The start index.
     */
    function _findSearchStart(
        IDisputeGameFactory disputeGameFactory,
        uint256 maxTimestamp
    ) internal view returns (uint256) {
        uint256 lo = 0;
        uint256 hi = disputeGameFactory.gameCount() - 1;

        while (lo <= hi) {
            (, Timestamp _timestampLo, ) = disputeGameFactory.gameAtIndex(lo);
            (, Timestamp _timestampHi, ) = disputeGameFactory.gameAtIndex(hi);

            // If lower bound exceed max timestamp, return previous mid (lo - 1)
            if (_timestampLo.raw() > maxTimestamp) return lo - 1;

            // Interpolation search
            uint256 mid = _timestampHi.raw() <= _timestampLo.raw()
                ? lo
                : lo +
                    ((maxTimestamp - _timestampLo.raw()) * (hi - lo)) /
                    (_timestampHi.raw() - _timestampLo.raw());

            // Rounding error
            if (mid > hi) {
                mid = hi;
            }

            (, Timestamp _timestampRaw, ) = disputeGameFactory.gameAtIndex(mid);

            // Unwrap gameCreationTime to uint64
            uint64 _timestamp = _timestampRaw.raw();

            if (_timestamp <= maxTimestamp) {
                lo = mid + 1;
            } else {
                hi = mid - 1;
            }
        }

        return hi;
    }

    /**
     * @notice Retrieves the latest dispute game of a specific type.
     * @param optimismPortal The Optimism portal output root contract.
     * @param gameType The type of the dispute game.
     * @param minAge The minimum age required to challenge the game.
     * @param maxAge The maximum age allowed to challenge the game.
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
        internal
        view
        returns (
            uint256 disputeGameIndex,
            bytes32 outputRoot,
            uint64 gameCreationTime,
            uint256 blockNumber,
            IDisputeGame proxy
        )
    {
        uint256 maxTimestamp = block.timestamp - minAge;

        IDisputeGameFactory disputeGameFactory = _disputeGameFactory(
            optimismPortal
        );

        uint256 start = _findSearchStart(disputeGameFactory, maxTimestamp);

        IDisputeGameFactory.GameSearchResult[] memory games = disputeGameFactory
            .findLatestGames(gameType, start, 1);

        if (games.length == 0) {
            revert GameNotFound(minAge);
        }

        // In case of an invalid game is found
        while (true) {
            (, , address p) = games[0].metadata.unpack();
            if (_isGameInvalid(IDisputeGame(p))) {
                if (games[0].index == 0) {
                    revert GameNotFound(minAge);
                }
                games = disputeGameFactory.findLatestGames(
                    gameType,
                    games[0].index - 1,
                    1
                );
            } else {
                break;
            }
        }

        disputeGameIndex = games[0].index;
        outputRoot = games[0].rootClaim.raw();
        gameCreationTime = games[0].timestamp.raw();

        if (maxAge > 0 && gameCreationTime + maxAge < block.timestamp) {
            revert GameExpired(
                disputeGameIndex,
                block.timestamp - gameCreationTime,
                maxAge
            );
        }

        (, , proxy) = disputeGameFactory.gameAtIndex(disputeGameIndex);

        try IFaultDisputeGame(address(proxy)).l2BlockNumber() returns (
            uint256 l2BlockNumber
        ) {
            blockNumber = l2BlockNumber;
        } catch {}
    }

    /**
     * @notice Retrieves the latest respected dispute game for L2 withdrawal.
     * @param optimismPortal The Optimism portal output root contract.
     * @param minAge The minimum age required to challenge the game.
     * @param maxAge The maximum age allowed to challenge the game.
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
        internal
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
        // Get gameType used for L2 withdrawal
        gameType = optimismPortal.respectedGameType();

        (
            disputeGameIndex,
            outputRoot,
            gameCreationTime,
            blockNumber,
            proxy
        ) = getLatestDisputeGame(optimismPortal, gameType, minAge, maxAge);
    }
}
