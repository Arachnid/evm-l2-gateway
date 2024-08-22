import '@nomicfoundation/hardhat-toolbox-viem';
import { HardhatUserConfig } from 'hardhat/config';

const config: HardhatUserConfig = {
  solidity: '0.8.19',
  networks: {
    anvil: {
      url: `http://localhost:${parseInt(process.env['RPC_PORT'] || '8545')}`,
    },
  },
};

export default config;
