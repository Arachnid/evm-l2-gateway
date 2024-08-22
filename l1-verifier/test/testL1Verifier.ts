import { expect } from 'chai';
import hre from 'hardhat';

async function fixture() {
  const client = await hre.viem.getPublicClient();

  const l1Verifier = await hre.viem.deployContract('L1Verifier', [
    [`http://0.0.0.0:${process.env.SERVER_PORT}/{sender}/{data}.json`],
  ]);
  const l2Contract = await hre.viem.deployContract('TestL2', []);
  const target = await hre.viem.deployContract('TestL1', [
    l1Verifier.address,
    l2Contract.address,
  ]);

  return { client, l1Verifier, target };
}

describe('L1Verifier', () => {
  it('simple proofs for fixed values', async () => {
    const { target } = await fixture();

    const result = await target.read.getLatest();
    expect(result).to.equal(42n);
  });

  it('simple proofs for dynamic values', async () => {
    const { target } = await fixture();

    const result = await target.read.getName();
    expect(result).to.equal('Satoshi');
  });

  it('nested proofs for dynamic values', async () => {
    const { target } = await fixture();

    const result = await target.read.getHighscorer([42n]);
    expect(result).to.equal('Hal Finney');
  });

  it('nested proofs for long dynamic values', async () => {
    const { target } = await fixture();

    const result = await target.read.getHighscorer([1n]);
    expect(result).to.equal(
      'Hubert Blaine Wolfeschlegelsteinhausenbergerdorff Sr.'
    );
  });

  it('nested proofs with lookbehind', async () => {
    const { target } = await fixture();

    const result = await target.read.getLatestHighscore();
    expect(result).to.equal(12345n);
  });

  it('nested proofs with lookbehind for dynamic values', async () => {
    const { target } = await fixture();

    const result = await target.read.getLatestHighscorer();
    expect(result).to.equal('Hal Finney');
  });

  it('mappings with variable-length keys', async () => {
    const { target } = await fixture();

    const result = await target.read.getNickname(['Money Skeleton']);
    expect(result).to.equal('Vitalik Buterin');
  });

  it('nested proofs of mappings with variable-length keys', async () => {
    const { target } = await fixture();

    const result = await target.read.getPrimaryNickname();
    expect(result).to.equal('Hal Finney');
  });

  it('treats uninitialized storage elements as zeroes', async () => {
    const { target } = await fixture();

    const result = await target.read.getZero();
    expect(result).to.equal(0n);
  });

  it('treats uninitialized dynamic values as empty strings', async () => {
    const { target } = await fixture();

    const result = await target.read.getNickname(['Santa']);
    expect(result).to.equal('');
  });

  it('will index on uninitialized values', async () => {
    const { target } = await fixture();

    const result = await target.read.getZeroIndex();
    expect(result).to.equal(1n);
  });

  it('will read static value from a struct in a map', async () => {
    const { target } = await fixture();

    const result = await target.read.getStructOffsetValue([1n]);
    expect(result).to.equal(1337n);
  });

  it('will read dynamic value from map in a struct in a map', async () => {
    const { target } = await fixture();

    const result = await target.read.getStructLatestMappedValue(['Nick']);
    expect(result).to.equal('Johnson');
  });
});
