import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';
import fs from 'fs';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {deployments, getNamedAccounts, network} = hre;
  const {deploy} = deployments;
  const {deployer} = await getNamedAccounts();

  await deploy('OPOutputLookup', {
    from: deployer,
    args: [],
    log: true,
    deterministicDeployment: '0x0000000000000000000000000000000000000000000000000000000000000000',
  });
};
export default func;
func.tags = ['OPOutputLookup'];
