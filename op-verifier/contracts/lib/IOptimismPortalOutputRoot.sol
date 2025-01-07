// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { IDisputeGameFactory, GameType } from "./dispute/interfaces/IDisputeGameFactory.sol";
import { Types } from '@eth-optimism/contracts-bedrock/src/libraries/Types.sol';

interface IL2OutputOracle {
    function getL2Output(
        uint256 _l2OutputIndex
    ) external view returns (Types.OutputProposal memory);

    function latestOutputIndex() external view returns (uint256);
}

interface IOptimismPortalOutputRoot {
    function l2Oracle() external view returns (IL2OutputOracle);

    function disputeGameFactory() external view returns (IDisputeGameFactory);

    function respectedGameType() external view returns (GameType);
}