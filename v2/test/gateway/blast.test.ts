import { OPRollup } from '../../src/op/OPRollup.js';
import { testOP } from './common.js';

if (!process.env.IS_CI) {
  testOP(
    OPRollup.blastMainnnetConfig,
    // https://blastscan.io/address/0xD2CBC073e564b1F30AD7dF3e99a1285e8b7Df8c7#code
    '0xD2CBC073e564b1F30AD7dF3e99a1285e8b7Df8c7'
  );
}