import { CcipReadRouter } from '@ensdomains/ccip-read-router';
import { EVMGateway } from '@ensdomains/evm-gateway';
import { L1ProofService } from '@ensdomains/l1-gateway';
import { createAnvil } from '@viem/anvil';
import { createServerAdapter } from '@whatwg-node/server';
import { fork } from 'child_process';
import { createServer } from 'http';
import { createClient, http } from 'viem';

const SERVER_PORT = 3001;

const anvil = createAnvil();

await anvil.start();

const client = createClient({
  transport: http(`http://${anvil.host}:${anvil.port}`),
});
const proofService = new L1ProofService(client);
const gateway = new EVMGateway(proofService);

const router = CcipReadRouter();
gateway.add(router);
const ccipReadServer = createServerAdapter(router.fetch);

const httpServer = createServer(ccipReadServer);
httpServer.listen(SERVER_PORT);

console.log('Starting hardhat');
const code = await new Promise((resolve) => {
  const hh = fork(
    '../node_modules/.bin/hardhat',
    ['test', '--network', 'anvil'],
    {
      stdio: 'inherit',
      env: {
        NODE_OPTIONS: '--experimental-loader ts-node/esm/transpile-only',
        RPC_PORT: anvil.port.toString(),
        SERVER_PORT: SERVER_PORT.toString(),
      },
    }
  );
  hh.on('close', (c) => resolve(c ?? 0));
});

console.log('Shutting down');
httpServer.close();
anvil.stop();
process.exit(code);
