export const rollupAbi = [
  {
    inputs: [],
    name: 'latestNodeCreated',
    outputs: [
      {
        internalType: 'uint64',
        name: '',
        type: 'uint64',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'uint64',
        name: 'nodeNum',
        type: 'uint64',
      },
      {
        indexed: true,
        internalType: 'bytes32',
        name: 'parentNodeHash',
        type: 'bytes32',
      },
      {
        indexed: true,
        internalType: 'bytes32',
        name: 'nodeHash',
        type: 'bytes32',
      },
      {
        indexed: false,
        internalType: 'bytes32',
        name: 'executionHash',
        type: 'bytes32',
      },
      {
        components: [
          {
            components: [
              {
                components: [
                  {
                    internalType: 'bytes32[2]',
                    name: 'bytes32Vals',
                    type: 'bytes32[2]',
                  },
                  {
                    internalType: 'uint64[2]',
                    name: 'u64Vals',
                    type: 'uint64[2]',
                  },
                ],
                internalType: 'struct GlobalState',
                name: 'globalState',
                type: 'tuple',
              },
              {
                internalType: 'enum MachineStatus',
                name: 'machineStatus',
                type: 'uint8',
              },
            ],
            internalType: 'struct RollupLib.ExecutionState',
            name: 'beforeState',
            type: 'tuple',
          },
          {
            components: [
              {
                components: [
                  {
                    internalType: 'bytes32[2]',
                    name: 'bytes32Vals',
                    type: 'bytes32[2]',
                  },
                  {
                    internalType: 'uint64[2]',
                    name: 'u64Vals',
                    type: 'uint64[2]',
                  },
                ],
                internalType: 'struct GlobalState',
                name: 'globalState',
                type: 'tuple',
              },
              {
                internalType: 'enum MachineStatus',
                name: 'machineStatus',
                type: 'uint8',
              },
            ],
            internalType: 'struct RollupLib.ExecutionState',
            name: 'afterState',
            type: 'tuple',
          },
          {
            internalType: 'uint64',
            name: 'numBlocks',
            type: 'uint64',
          },
        ],
        indexed: false,
        internalType: 'struct RollupLib.Assertion',
        name: 'assertion',
        type: 'tuple',
      },
      {
        indexed: false,
        internalType: 'bytes32',
        name: 'afterInboxBatchAcc',
        type: 'bytes32',
      },
      {
        indexed: false,
        internalType: 'bytes32',
        name: 'wasmModuleRoot',
        type: 'bytes32',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'inboxMaxCount',
        type: 'uint256',
      },
    ],
    name: 'NodeCreated',
    type: 'event',
  },
] as const;
