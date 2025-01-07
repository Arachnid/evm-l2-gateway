import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';
import fs from 'fs';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {deployments, getNamedAccounts, network} = hre;
  const {deploy} = deployments;
  const {deployer} = await getNamedAccounts();

  // https://op-gateway-worker.ens-cf.workers.dev/{sender}/{data}.json
  let GATEWAY_URL = process.env.GATEWAY_URL
  let OPTIMISM_PORTAL_ADDRESS = process.env.OPTIMISM_PORTAL_ADDRESS
  let MINIMUM_AGE = parseInt(process.env.MINIMUM_AGE || '60')
  let MAXIMUM_AGE = parseInt(process.env.MAXIMUM_AGE || '1209600')

  if(network.name === 'opDevnetL1'){
    const opAddresses = await (await fetch("http://localhost:8080/addresses.json")).json();
    OPTIMISM_PORTAL_ADDRESS = opAddresses.OptimismPortalProxy
  }

  console.log('OPVerifier', [[GATEWAY_URL], OPTIMISM_PORTAL_ADDRESS, MINIMUM_AGE, MAXIMUM_AGE])
  await deploy('OPVerifier', {
    from: deployer,
    args: [[GATEWAY_URL], OPTIMISM_PORTAL_ADDRESS, MINIMUM_AGE, MAXIMUM_AGE],
    log: true,
  });
};
export default func;
func.tags = ['OPVerifier'];
