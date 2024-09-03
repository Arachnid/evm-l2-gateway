import { OPFaultRollup } from '../../src/op/OPFaultRollup.js';
import { testOPFault } from './common.js';

if (!process.env.IS_CI) {
  testOPFault(
    OPFaultRollup.baseTestnetConfig,
    // https://sepolia.basescan.org/address/0x7AE933cf265B9C7E7Fd43F0D6966E34aaa776411
    '0x7AE933cf265B9C7E7Fd43F0D6966E34aaa776411'
  );
}