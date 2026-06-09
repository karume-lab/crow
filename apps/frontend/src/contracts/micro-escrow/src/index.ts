import { Buffer } from "buffer";
import { Address } from "@stellar/stellar-sdk";
import {
  AssembledTransaction,
  Client as ContractClient,
  ClientOptions as ContractClientOptions,
  MethodOptions,
  Result,
  Spec as ContractSpec,
} from "@stellar/stellar-sdk/contract";
import type {
  u32,
  i32,
  u64,
  i64,
  u128,
  i128,
  u256,
  i256,
  Option,
  Timepoint,
  Duration,
} from "@stellar/stellar-sdk/contract";
export * from "@stellar/stellar-sdk";
export * as contract from "@stellar/stellar-sdk/contract";
export * as rpc from "@stellar/stellar-sdk/rpc";

if (typeof window !== "undefined") {
  //@ts-ignore Buffer exists
  window.Buffer = window.Buffer || Buffer;
}


export const networks = {
  standalone: {
    networkPassphrase: "Standalone Network ; February 2017",
    contractId: "CDRUVX6QQDZ2GFDRSAOIROPBNN7USCIJMMBMGQFYYCOC4OVWVSM7TE3F",
  }
} as const


export interface Escrow {
  amount: i128;
  arbiter: string;
  client: string;
  freelancer: string;
  id: u32;
  status: EscrowStatus;
  token: string;
}

export type DataKey = {tag: "Counter", values: void} | {tag: "Escrow", values: readonly [u32]};

export type EscrowStatus = {tag: "Active", values: void} | {tag: "Completed", values: void} | {tag: "Disputed", values: void} | {tag: "Resolved", values: void};

export interface Client {
  /**
   * Construct and simulate a counter transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  counter: (options?: MethodOptions) => Promise<AssembledTransaction<u32>>

  /**
   * Construct and simulate a get_escrow transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_escrow: ({id}: {id: u32}, options?: MethodOptions) => Promise<AssembledTransaction<Option<Escrow>>>

  /**
   * Construct and simulate a create_escrow transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  create_escrow: ({client, freelancer, arbiter, token, amount}: {client: string, freelancer: string, arbiter: string, token: string, amount: i128}, options?: MethodOptions) => Promise<AssembledTransaction<u32>>

  /**
   * Construct and simulate a release_funds transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  release_funds: ({escrow_id}: {escrow_id: u32}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a resolve_dispute transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  resolve_dispute: ({escrow_id, freelancer_share}: {escrow_id: u32, freelancer_share: i128}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a trigger_dispute transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  trigger_dispute: ({escrow_id}: {escrow_id: u32}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

}
export class Client extends ContractClient {
  static async deploy<T = Client>(
    /** Options for initializing a Client as well as for calling a method, with extras specific to deploying. */
    options: MethodOptions &
      Omit<ContractClientOptions, "contractId"> & {
        /** The hash of the Wasm blob, which must already be installed on-chain. */
        wasmHash: Buffer | string;
        /** Salt used to generate the contract's ID. Passed through to {@link Operation.createCustomContract}. Default: random. */
        salt?: Buffer | Uint8Array;
        /** The format used to decode `wasmHash`, if it's provided as a string. */
        format?: "hex" | "base64";
      }
  ): Promise<AssembledTransaction<T>> {
    return ContractClient.deploy(null, options)
  }
  constructor(public readonly options: ContractClientOptions) {
    super(
      new ContractSpec([ "AAAAAQAAAAAAAAAAAAAABkVzY3JvdwAAAAAABwAAAAAAAAAGYW1vdW50AAAAAAALAAAAAAAAAAdhcmJpdGVyAAAAABMAAAAAAAAABmNsaWVudAAAAAAAEwAAAAAAAAAKZnJlZWxhbmNlcgAAAAAAEwAAAAAAAAACaWQAAAAAAAQAAAAAAAAABnN0YXR1cwAAAAAH0AAAAAxFc2Nyb3dTdGF0dXMAAAAAAAAABXRva2VuAAAAAAAAEw==",
        "AAAAAgAAAAAAAAAAAAAAB0RhdGFLZXkAAAAAAgAAAAAAAAAAAAAAB0NvdW50ZXIAAAAAAQAAAAAAAAAGRXNjcm93AAAAAAABAAAABA==",
        "AAAAAgAAAAAAAAAAAAAADEVzY3Jvd1N0YXR1cwAAAAQAAAAAAAAAAAAAAAZBY3RpdmUAAAAAAAAAAAAAAAAACUNvbXBsZXRlZAAAAAAAAAAAAAAAAAAACERpc3B1dGVkAAAAAAAAAAAAAAAIUmVzb2x2ZWQ=",
        "AAAAAAAAAAAAAAAHY291bnRlcgAAAAAAAAAAAQAAAAQ=",
        "AAAAAAAAAAAAAAAKZ2V0X2VzY3JvdwAAAAAAAQAAAAAAAAACaWQAAAAAAAQAAAABAAAD6AAAB9AAAAAGRXNjcm93AAA=",
        "AAAAAAAAAAAAAAANY3JlYXRlX2VzY3JvdwAAAAAAAAUAAAAAAAAABmNsaWVudAAAAAAAEwAAAAAAAAAKZnJlZWxhbmNlcgAAAAAAEwAAAAAAAAAHYXJiaXRlcgAAAAATAAAAAAAAAAV0b2tlbgAAAAAAABMAAAAAAAAABmFtb3VudAAAAAAACwAAAAEAAAAE",
        "AAAAAAAAAAAAAAANcmVsZWFzZV9mdW5kcwAAAAAAAAEAAAAAAAAACWVzY3Jvd19pZAAAAAAAAAQAAAAA",
        "AAAAAAAAAAAAAAAPcmVzb2x2ZV9kaXNwdXRlAAAAAAIAAAAAAAAACWVzY3Jvd19pZAAAAAAAAAQAAAAAAAAAEGZyZWVsYW5jZXJfc2hhcmUAAAALAAAAAA==",
        "AAAAAAAAAAAAAAAPdHJpZ2dlcl9kaXNwdXRlAAAAAAEAAAAAAAAACWVzY3Jvd19pZAAAAAAAAAQAAAAA" ]),
      options
    )
  }
  public readonly fromJSON = {
    counter: this.txFromJSON<u32>,
        get_escrow: this.txFromJSON<Option<Escrow>>,
        create_escrow: this.txFromJSON<u32>,
        release_funds: this.txFromJSON<null>,
        resolve_dispute: this.txFromJSON<null>,
        trigger_dispute: this.txFromJSON<null>
  }
}