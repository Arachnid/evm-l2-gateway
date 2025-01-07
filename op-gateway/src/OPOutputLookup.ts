export default [
  {
    "type": "function",
    "name": "getDisputeGame",
    "inputs": [
      {
        "name": "optimismPortal",
        "type": "address",
        "internalType": "contract IOptimismPortalOutputRoot"
      },
      { "name": "index", "type": "uint256", "internalType": "uint256" },
      { "name": "minAge", "type": "uint256", "internalType": "uint256" },
      { "name": "maxAge", "type": "uint256", "internalType": "uint256" }
    ],
    "outputs": [
      { "name": "outputRoot", "type": "bytes32", "internalType": "bytes32" },
      { "name": "gameType", "type": "uint32", "internalType": "GameType" },
      {
        "name": "gameCreationTime",
        "type": "uint64",
        "internalType": "uint64"
      },
      {
        "name": "proxy",
        "type": "address",
        "internalType": "contract IDisputeGame"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getL2Output",
    "inputs": [
      {
        "name": "optimismPortal",
        "type": "address",
        "internalType": "contract IOptimismPortalOutputRoot"
      },
      { "name": "index", "type": "uint256", "internalType": "uint256" },
      { "name": "minAge", "type": "uint256", "internalType": "uint256" },
      { "name": "maxAge", "type": "uint256", "internalType": "uint256" }
    ],
    "outputs": [
      {
        "name": "",
        "type": "tuple",
        "internalType": "struct Types.OutputProposal",
        "components": [
          {
            "name": "outputRoot",
            "type": "bytes32",
            "internalType": "bytes32"
          },
          { "name": "timestamp", "type": "uint128", "internalType": "uint128" },
          {
            "name": "l2BlockNumber",
            "type": "uint128",
            "internalType": "uint128"
          }
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getLatestDisputeGame",
    "inputs": [
      {
        "name": "optimismPortal",
        "type": "address",
        "internalType": "contract IOptimismPortalOutputRoot"
      },
      { "name": "gameType", "type": "uint32", "internalType": "GameType" },
      { "name": "minAge", "type": "uint256", "internalType": "uint256" },
      { "name": "maxAge", "type": "uint256", "internalType": "uint256" }
    ],
    "outputs": [
      {
        "name": "disputeGameIndex",
        "type": "uint256",
        "internalType": "uint256"
      },
      { "name": "outputRoot", "type": "bytes32", "internalType": "bytes32" },
      {
        "name": "gameCreationTime",
        "type": "uint64",
        "internalType": "uint64"
      },
      { "name": "blockNumber", "type": "uint256", "internalType": "uint256" },
      {
        "name": "proxy",
        "type": "address",
        "internalType": "contract IDisputeGame"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getLatestL2Output",
    "inputs": [
      {
        "name": "optimismPortal",
        "type": "address",
        "internalType": "contract IOptimismPortalOutputRoot"
      },
      { "name": "minAge", "type": "uint256", "internalType": "uint256" },
      { "name": "maxAge", "type": "uint256", "internalType": "uint256" }
    ],
    "outputs": [
      { "name": "index", "type": "uint256", "internalType": "uint256" },
      {
        "name": "",
        "type": "tuple",
        "internalType": "struct Types.OutputProposal",
        "components": [
          {
            "name": "outputRoot",
            "type": "bytes32",
            "internalType": "bytes32"
          },
          { "name": "timestamp", "type": "uint128", "internalType": "uint128" },
          {
            "name": "l2BlockNumber",
            "type": "uint128",
            "internalType": "uint128"
          }
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getLatestRespectedDisputeGame",
    "inputs": [
      {
        "name": "optimismPortal",
        "type": "address",
        "internalType": "contract IOptimismPortalOutputRoot"
      },
      { "name": "minAge", "type": "uint256", "internalType": "uint256" },
      { "name": "maxAge", "type": "uint256", "internalType": "uint256" }
    ],
    "outputs": [
      {
        "name": "disputeGameIndex",
        "type": "uint256",
        "internalType": "uint256"
      },
      { "name": "outputRoot", "type": "bytes32", "internalType": "bytes32" },
      {
        "name": "gameCreationTime",
        "type": "uint64",
        "internalType": "uint64"
      },
      { "name": "blockNumber", "type": "uint256", "internalType": "uint256" },
      {
        "name": "proxy",
        "type": "address",
        "internalType": "contract IDisputeGame"
      },
      { "name": "gameType", "type": "uint32", "internalType": "GameType" }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getOPProvableBlock",
    "inputs": [
      {
        "name": "optimismPortal",
        "type": "address",
        "internalType": "contract IOptimismPortalOutputRoot"
      },
      { "name": "minAge", "type": "uint256", "internalType": "uint256" },
      { "name": "maxAge", "type": "uint256", "internalType": "uint256" }
    ],
    "outputs": [
      {
        "name": "result",
        "type": "tuple",
        "internalType": "struct OPProvableBlock",
        "components": [
          {
            "name": "proofType",
            "type": "uint8",
            "internalType": "enum OPWitnessProofType"
          },
          { "name": "index", "type": "uint256", "internalType": "uint256" },
          {
            "name": "blockNumber",
            "type": "uint256",
            "internalType": "uint256"
          },
          { "name": "outputRoot", "type": "bytes32", "internalType": "bytes32" }
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getProofType",
    "inputs": [
      {
        "name": "optimismPortal",
        "type": "address",
        "internalType": "contract IOptimismPortalOutputRoot"
      }
    ],
    "outputs": [
      { "name": "", "type": "uint8", "internalType": "enum OPWitnessProofType" }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getRespectedDisputeGame",
    "inputs": [
      {
        "name": "optimismPortal",
        "type": "address",
        "internalType": "contract IOptimismPortalOutputRoot"
      },
      { "name": "index", "type": "uint256", "internalType": "uint256" },
      { "name": "minAge", "type": "uint256", "internalType": "uint256" },
      { "name": "maxAge", "type": "uint256", "internalType": "uint256" }
    ],
    "outputs": [
      { "name": "outputRoot", "type": "bytes32", "internalType": "bytes32" },
      { "name": "gameType", "type": "uint32", "internalType": "GameType" },
      {
        "name": "gameCreationTime",
        "type": "uint64",
        "internalType": "uint64"
      },
      {
        "name": "proxy",
        "type": "address",
        "internalType": "contract IDisputeGame"
      }
    ],
    "stateMutability": "view"
  },
  { "type": "error", "name": "UnknownProofType", "inputs": [] }
] as const
