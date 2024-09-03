import type { Rollup } from '../src/rollup.js';
import { createProviderPair, chainName } from './providers.js';
import { EZCCIP, serve } from '@resolverworks/ezccip';
import { Gateway } from '../src/gateway.js';
import { OPRollup } from '../src/op/OPRollup.js';
import { OPFaultRollup } from '../src/op/OPFaultRollup.js';
import { NitroRollup } from '../src/nitro/NitroRollup.js';
import { ScrollRollup } from '../src/scroll/ScrollRollup.js';
import { TaikoRollup } from '../src/taiko/TaikoRollup.js';
import { LineaRollup } from '../src/linea/LineaRollup.js';
import { LineaGatewayV1 } from '../src/linea/LineaGatewayV1.js';
import { ZKSyncRollup } from '../src/zksync/ZKSyncRollup.js';
import { PolygonPoSRollup } from '../src/polygon/PolygonPoSRollup.js';

const [, , name, port] = process.argv;
let gateway: EZCCIP & { readonly rollup: Rollup };
switch (name) {
  case 'op': {
    const config = OPFaultRollup.mainnetConfig;
    gateway = new Gateway(
      await OPFaultRollup.create(createProviderPair(config), config)
    );
    break;
  }
  case 'arb1': {
    const config = NitroRollup.arb1MainnetConfig;
    gateway = new Gateway(new NitroRollup(createProviderPair(config), config));
    break;
  }
  case 'base': {
    const config = OPRollup.baseMainnetConfig;
    gateway = new Gateway(new OPRollup(createProviderPair(config), config));
    break;
  }
  case 'base-testnet': {
    const config = OPFaultRollup.baseTestnetConfig;
    gateway = new Gateway(
      await OPFaultRollup.create(createProviderPair(config), config)
    );
    break;
  }
  case 'linea': {
    const config = LineaRollup.mainnetConfig;
    gateway = new Gateway(new LineaRollup(createProviderPair(config), config));
    break;
  }
  case 'lineaV1': {
    const config = LineaRollup.mainnetConfig;
    gateway = new LineaGatewayV1(
      new LineaRollup(createProviderPair(config), config)
    );
    break;
  }
  case 'polygon': {
    const config = PolygonPoSRollup.mainnetConfig;
    gateway = new Gateway(
      new PolygonPoSRollup(createProviderPair(config), config)
    );
    break;
  }
  case 'scroll': {
    const config = ScrollRollup.mainnetConfig;
    gateway = new Gateway(
      await ScrollRollup.create(createProviderPair(config), config)
    );
    break;
  }
  case 'taiko': {
    const config = TaikoRollup.mainnetConfig;
    gateway = new Gateway(
      await TaikoRollup.create(createProviderPair(config), config)
    );
    break;
  }
  case 'zksync': {
    const config = ZKSyncRollup.mainnetConfig;
    gateway = new Gateway(new ZKSyncRollup(createProviderPair(config), config));
    break;
  }
  case 'blast': {
    const config = OPRollup.blastMainnnetConfig;
    gateway = new Gateway(new OPRollup(createProviderPair(config), config));
    break;
  }
  case 'fraxtal': {
    const config = OPRollup.fraxtalMainnetConfig;
    gateway = new Gateway(new OPRollup(createProviderPair(config), config));
    break;
  }
  case 'zora': {
    const config = OPRollup.zoraMainnetConfig;
    gateway = new Gateway(new OPRollup(createProviderPair(config), config));
    break;
  }
  default: {
    throw new Error(`unknown gateway: ${name}`);
  }
}

console.log({
  rollup: gateway.rollup.constructor.name,
  gateway: gateway.constructor.name,
  chain1: chainName(gateway.rollup.provider1._network.chainId),
  chain2: chainName(gateway.rollup.provider2._network.chainId),
});
await serve(gateway, { protocol: 'raw', port: parseInt(port) || 8000 });