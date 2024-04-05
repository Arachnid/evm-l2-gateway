import { Server } from '@chainlink/ccip-read-server';
import { makeL1Gateway } from '../../l1-gateway';
import { HardhatEthersProvider } from '@nomicfoundation/hardhat-ethers/internal/hardhat-ethers-provider';
import type { HardhatEthersHelpers } from '@nomicfoundation/hardhat-ethers/types';
import { expect } from 'chai';
import {
  AddressLike,
  BrowserProvider,
  Contract,
  FetchRequest,
  JsonRpcProvider,
  Signer,
  ethers as ethersT,
} from 'ethers';
import { ethers } from 'hardhat';
import { EthereumProvider } from 'hardhat/types';
import request from 'supertest';

type ethersObj = typeof ethersT &
  Omit<HardhatEthersHelpers, 'provider'> & {
    provider: Omit<HardhatEthersProvider, '_hardhatProvider'> & {
      _hardhatProvider: EthereumProvider;
    };
  };

declare module 'hardhat/types/runtime' {
  const ethers: ethersObj;
  interface HardhatRuntimeEnvironment {
    ethers: ethersObj;
  }
}

const SECOND_TARGET_RESPONSE_ADDRESS = "0x0000000000000000000000000000000000000123";

var l2contractAddress: AddressLike;

describe('L1Verifier', () => {
  let provider: BrowserProvider;
  let signer: Signer;
  let verifier: Contract;
  let target: Contract;

  before(async () => {
    // Hack to get a 'real' ethers provider from hardhat. The default `HardhatProvider`
    // doesn't support CCIP-read.
    provider = new ethers.BrowserProvider(ethers.provider._hardhatProvider);
    // provider.on("debug", (x: any) => console.log(JSON.stringify(x, undefined, 2)));
    signer = await provider.getSigner(0);
    const gateway = makeL1Gateway(provider as unknown as JsonRpcProvider);
    const server = new Server();
    gateway.add(server);
    const app = server.makeApp('/');
    const getUrl = FetchRequest.createGetUrlFunc();
    ethers.FetchRequest.registerGetUrl(async (req: FetchRequest) => {
      if (req.url != 'test:') return getUrl(req);

      const r = request(app).post('/');
      if (req.hasBody()) {
        r.set('Content-Type', 'application/json').send(
          ethers.toUtf8String(req.body)
        );
      }
      const response = await r;

      return {
        statusCode: response.statusCode,
        statusMessage: response.ok ? 'OK' : response.statusCode.toString(),
        body: ethers.toUtf8Bytes(JSON.stringify(response.body)),
        headers: {
          'Content-Type': 'application/json',
        },
      };
    });
    const l1VerifierFactory = await ethers.getContractFactory(
      'L1Verifier',
      signer
    );
    verifier = await l1VerifierFactory.deploy(['test:']);

    const testL2Factory = await ethers.getContractFactory('TestL2', signer);
    const l2contract = await testL2Factory.deploy(42, SECOND_TARGET_RESPONSE_ADDRESS);

    await l2contract.waitForDeployment();
    l2contractAddress = await l2contract.getAddress();

    const l2contractB = await testL2Factory.deploy(262, l2contractAddress);
    await l2contractB.waitForDeployment();
    const l2contractBAddress = await l2contractB.getAddress();

    const testL1Factory = await ethers.getContractFactory('TestL1', signer);
    target = await testL1Factory.deploy(
      await verifier.getAddress(),
      await l2contractBAddress,
      await l2contractAddress,
    );

    // Mine an empty block so we have something to prove against
    await provider.send('evm_mine', []);
  });

  
  it('simple proofs for fixed values', async () => {
    const result = await target.getLatest({ enableCcipRead: true });

    expect(Number(result)).to.equal(262);
  });


  it('simple proofs for fixed values from two targets', async () => {
    const result = await target.getLatestFromTwoTargets({ enableCcipRead: true });

    expect(Number(result)).to.equal(304);
  });

  
  it('simple proofs for dynamic values', async () => {
    const result = await target.getName({ enableCcipRead: true });
    expect(result).to.equal('Satoshi');
  });


  it('simple proofs for address', async () => {
    const result = await target.getSecondAddress({ enableCcipRead: true });
    expect(result).to.equal(l2contractAddress);
  });

  
  it('nested proofs for dynamic values', async () => {
    const result = await target.getHighscorer(262, { enableCcipRead: true });
    expect(result).to.equal('Hal Finney');
  });


  it('nested proofs for long dynamic values', async () => {
    const result = await target.getHighscorer(1, { enableCcipRead: true });
    expect(result).to.equal(
      'Hubert Blaine Wolfeschlegelsteinhausenbergerdorff Sr.'
    );
  });

  
  it('nested proofs with lookbehind', async () => {
    const result = await target.getLatestHighscore({ enableCcipRead: true });
    expect(Number(result)).to.equal(12345);
  });
  

  it('simple proofs for address target', async () => {
    const result = await target.getValueFromSecondContract({ enableCcipRead: true });
    expect(result).to.equal(SECOND_TARGET_RESPONSE_ADDRESS);
  });


  it('nested proofs with lookbehind for dynamic values', async () => {
    const result = await target.getLatestHighscorer({ enableCcipRead: true });
    expect(result).to.equal('Hal Finney');
  });

  
  it('mappings with variable-length keys', async () => {
    const result = await target.getNickname('Money Skeleton', {
      enableCcipRead: true,
    });
    expect(result).to.equal('Vitalik Buterin');
  });

  it('nested proofs of mappings with variable-length keys', async () => {
    const result = await target.getPrimaryNickname({ enableCcipRead: true });
    expect(result).to.equal('Hal Finney');
  });

  it('treats uninitialized storage elements as zeroes', async () => {
    const result = await target.getZero({ enableCcipRead: true });
    expect(Number(result)).to.equal(0);
  });

  it('treats uninitialized dynamic values as empty strings', async () => {
    const result = await target.getNickname('Santa', { enableCcipRead: true });
    expect(result).to.equal('');
  });

  it('will index on uninitialized values', async () => {
    const result = await target.getZeroIndex({ enableCcipRead: true });
    expect(Number(result)).to.equal(1);
  })
});
