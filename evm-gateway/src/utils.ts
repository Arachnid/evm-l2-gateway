import type { Request as CFWRequest } from '@cloudflare/workers-types';
import type { PropsDecoder } from '@ensdomains/server-analytics';
import {
  encodeAbiParameters,
  parseAbiParameter,
  type AbiFunction,
  type Address,
  type Hex,
  type ParseAbiItem,
} from 'viem';

import type { AbiParametersToPrimitiveTypes } from 'abitype';
import type { StateProof } from './EVMProofHelper.js';

export interface Router {
  handle: (request: CFWRequest) => Promise<Response>;
}

type ParseAbiFunction<signature extends string> =
  ParseAbiItem<signature> extends AbiFunction ? ParseAbiItem<signature> : never;

type AddAbiHandlerParameters<signature extends string> = {
  type: signature;
  handle: AbiFunctionHandler<ParseAbiFunction<signature>>;
};

type RpcRequest = {
  to: Address;
  data: Hex;
};
export type AbiFunctionHandler<abiFunc extends AbiFunction> = (
  args: AbiParametersToPrimitiveTypes<abiFunc['inputs']>,
  req: RpcRequest
) =>
  | Promise<AbiParametersToPrimitiveTypes<abiFunc['outputs']>>
  | AbiParametersToPrimitiveTypes<abiFunc['outputs']>;
export type GenericRouter = {
  add: <signature extends string>(
    params: AddAbiHandlerParameters<signature>
  ) => void;
};

export const propsDecoder: PropsDecoder<CFWRequest> = (request) => {
  if (!request || !request.url) {
    return {};
  }
  const trackingData = request.url.match(
    /\/0x[a-fA-F0-9]{40}\/0x[a-fA-F0-9]{1,}\.json/
  );
  if (trackingData) {
    return {
      sender: trackingData[0].slice(1, 42),
      calldata: trackingData[0].slice(44).replace('.json', ''),
    };
  } else {
    return {};
  }
};

const flatten = (data: Hex[]) => {
  return encodeAbiParameters([parseAbiParameter('bytes[]')], [data]);
};

export const convertIntoMerkleTrieProof = (proof: StateProof) => {
  return {
    stateTrieWitness: flatten(proof.stateTrieWitness),
    storageProofs: proof.storageProofs.map(flatten),
  };
};
