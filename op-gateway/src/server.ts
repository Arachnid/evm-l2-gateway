import { Server } from '@chainlink/ccip-read-server';
import { Command } from '@commander-js/extra-typings';
import { EVMGateway } from '@ensdomains/evm-gateway';
import { JsonRpcProvider } from 'ethers';
import { OPProofService } from './OPProofService.js';

const program = new Command()
  .option('-p, --port <port>', 'port to listen on', '8080')
  .option(
    '-u, --l1-provider-url <url>',
    'l1 provider url',
    'http://localhost:8545/'
  )
  .option(
    '-v, --l2-provider-url <url>',
    'l2 provider url',
    'http://localhost:9545/'
  )
  .option(
    '-o --l2-optimism-portal <address>',
    'address for OptimismPortalProxy on the L1',
    ''
  )
  .option('-d, --delay <number>', 'number of blocks delay to use', '5');

program.parse();

(async () => {
  const options = program.opts();

  const l1Provider = new JsonRpcProvider(options.l1ProviderUrl);
  const l2Provider = new JsonRpcProvider(options.l2ProviderUrl);

  const gateway = new EVMGateway(
    new OPProofService(
      l1Provider,
      l2Provider,
      options.l2OptimismPortal,
      Number(options.delay)
    )
  );
  const server = new Server();
  gateway.add(server);
  const app = server.makeApp('/');

  const port = parseInt(options.port);
  if (String(port) !== options.port) throw new Error('Invalid port');

  app.listen(port, function () {
    console.log(`Listening on ${port}`);
  });
})();
