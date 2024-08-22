import { expect } from 'chai';
import hre from 'hardhat';
import {
  ccipRequest,
  concat,
  ContractFunctionExecutionError,
  ContractFunctionRevertedError,
  createClient,
  custom,
  encodeAbiParameters,
  getContract,
  type Address,
  type Hex,
} from 'viem';
import { estimateGas } from 'viem/actions';

const getDeployment = async () => {
  const clientWithoutCcipRead = createClient({
    transport: await hre.viem
      .getPublicClient()
      .then((v) => custom(v, { retryCount: 0 })),
    ccipRead: false,
  });
  const targetDeployment = await hre.deployments.get('TestL1');
  const contract = await hre.viem.getContractAt(
    'TestL1',
    targetDeployment.address as Address
  );
  type Contract = typeof contract;
  const ccipReadDisabledContract = getContract({
    abi: contract.abi,
    address: contract.address,
    client: clientWithoutCcipRead,
  });
  const estimateCallbackGas = new Proxy(
    ccipReadDisabledContract.read as unknown as {
      [fn in keyof Contract['read']]: (
        ...args: Parameters<Contract['read'][fn]>
      ) => Promise<bigint>;
    },
    {
      get(target, prop) {
        return async (...args: never[]) => {
          const result = await target[prop as keyof typeof target](
            ...args
          ).catch((e) => e);
          if (!(result instanceof ContractFunctionExecutionError))
            throw new Error('Expected error');

          if (!(result.cause instanceof ContractFunctionRevertedError))
            throw new Error('Expected error');

          const revertData = result.cause.data;
          // string name check good enough for now
          if (revertData?.errorName !== 'OffchainLookup')
            throw new Error('Expected error');

          const [sender, urls, callData, callbackSelector, extraData] =
            revertData.args as [Hex, string[], Hex, Hex, Hex];
          const ccipResult = await ccipRequest({
            data: callData,
            sender,
            urls,
          });

          const estimatedGas = await estimateGas(clientWithoutCcipRead, {
            to: sender,
            data: concat([
              callbackSelector,
              encodeAbiParameters(
                [{ type: 'bytes' }, { type: 'bytes' }],
                [ccipResult, extraData]
              ),
            ]),
          });

          console.log(`Gas estimate ${estimatedGas}`);

          return estimatedGas;
        };
      },
    }
  );
  return {
    ...contract,
    estimateCallbackGas,
  };
};

describe('ArbVerifier', () => {
  it('simple proofs for fixed values', async () => {
    const target = await getDeployment();
    const result = await target.read.getLatest();
    expect(result).to.equal(42n);

    await target.estimateCallbackGas.getLatest();
  });

  it('simple proofs for dynamic values', async () => {
    const target = await getDeployment();
    const result = await target.read.getName();
    expect(result).to.equal('Satoshi');

    await target.estimateCallbackGas.getName();
  });

  it('nested proofs for dynamic values', async () => {
    const target = await getDeployment();
    const result = await target.read.getHighscorer([42n]);
    expect(result).to.equal('Hal Finney');

    await target.estimateCallbackGas.getHighscorer([42n]);
  });

  it('nested proofs for long dynamic values', async () => {
    const target = await getDeployment();
    const result = await target.read.getHighscorer([1n]);
    expect(result).to.equal(
      'Hubert Blaine Wolfeschlegelsteinhausenbergerdorff Sr.'
    );

    await target.estimateCallbackGas.getHighscorer([1n]);
  });

  it('nested proofs with lookbehind', async () => {
    const target = await getDeployment();
    const result = await target.read.getLatestHighscore();
    expect(result).to.equal(12345n);

    await target.estimateCallbackGas.getLatestHighscore();
  });

  it('nested proofs with lookbehind for dynamic values', async () => {
    const target = await getDeployment();
    const result = await target.read.getLatestHighscorer();
    expect(result).to.equal('Hal Finney');

    await target.estimateCallbackGas.getLatestHighscorer();
  });

  it('mappings with variable-length keys', async () => {
    const target = await getDeployment();
    const result = await target.read.getNickname(['Money Skeleton']);
    expect(result).to.equal('Vitalik Buterin');

    await target.estimateCallbackGas.getNickname(['Money Skeleton']);
  });

  it('nested proofs of mappings with variable-length keys', async () => {
    const target = await getDeployment();
    const result = await target.read.getPrimaryNickname();
    expect(result).to.equal('Hal Finney');

    await target.estimateCallbackGas.getPrimaryNickname();
  });

  it('treats uninitialized storage elements as zeroes', async () => {
    const target = await getDeployment();
    const result = await target.read.getZero();
    expect(result).to.equal(0n);

    await target.estimateCallbackGas.getZero();
  });

  it('treats uninitialized dynamic values as empty strings', async () => {
    const target = await getDeployment();
    const result = await target.read.getNickname(['Santa']);
    expect(result).to.equal('');

    await target.estimateCallbackGas.getNickname(['Santa']);
  });
});
