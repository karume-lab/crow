export type EscrowStatus = 'Active' | 'Completed' | 'Disputed' | 'Resolved';

export interface Escrow {
  id: number;
  client: string;
  freelancer: string;
  arbiter: string;
  token: string;
  amount: bigint;
  status: EscrowStatus;
}

export class Client {
  private contractId: string;
  private rpcUrl?: string;

  constructor(options: { contractId: string; rpcUrl?: string }) {
    this.contractId = options.contractId;
    this.rpcUrl = options.rpcUrl;
    if (this.rpcUrl) {
      console.log(`Connecting to contract ${this.contractId} on RPC ${this.rpcUrl}`);
    }
  }

  private getStorage(): Escrow[] {
    const data = localStorage.getItem(`soroban_escrows_${this.contractId}`);
    if (!data) return [];
    try {
      const parsed = JSON.parse(data) as Array<Omit<Escrow, 'amount'> & { amount: string | number | bigint }>;
      return parsed.map(item => ({
        ...item,
        amount: BigInt(item.amount),
      }));
    } catch {
      return [];
    }
  }

  private setStorage(escrows: Escrow[]) {
    const serializable = escrows.map(item => ({
      ...item,
      amount: item.amount.toString(),
    }));
    localStorage.setItem(`soroban_escrows_${this.contractId}`, JSON.stringify(serializable));
  }

  async counter(): Promise<number> {
    const escrows = this.getStorage();
    return escrows.length;
  }

  async get_escrow(args: { id: number }): Promise<Escrow | null>;
  async get_escrow(id: number): Promise<Escrow | null>;
  async get_escrow(arg: number | { id: number }): Promise<Escrow | null> {
    const id = typeof arg === 'number' ? arg : arg.id;
    const escrows = this.getStorage();
    const found = escrows.find(e => e.id === id);
    return found || null;
  }

  async create_escrow(args: {
    client: string;
    freelancer: string;
    arbiter: string;
    token: string;
    amount: bigint;
  }): Promise<number>;
  async create_escrow(
    client: string,
    freelancer: string,
    arbiter: string,
    token: string,
    amount: bigint
  ): Promise<number>;
  async create_escrow(
    argsOrClient: string | { client: string; freelancer: string; arbiter: string; token: string; amount: bigint },
    freelancer?: string,
    arbiter?: string,
    token?: string,
    amount?: bigint
  ): Promise<number> {
    let clientAddr: string;
    let freelancerAddr: string;
    let arbiterAddr: string;
    let tokenAddr: string;
    let amountVal: bigint;

    if (typeof argsOrClient === 'object') {
      clientAddr = argsOrClient.client;
      freelancerAddr = argsOrClient.freelancer;
      arbiterAddr = argsOrClient.arbiter;
      tokenAddr = argsOrClient.token;
      amountVal = argsOrClient.amount;
    } else {
      clientAddr = argsOrClient;
      if (freelancer === undefined || arbiter === undefined || token === undefined || amount === undefined) {
        throw new Error('Missing positional arguments for create_escrow');
      }
      freelancerAddr = freelancer;
      arbiterAddr = arbiter;
      tokenAddr = token;
      amountVal = amount;
    }

    // Simulate chain latency
    await new Promise(resolve => setTimeout(resolve, 800));

    const escrows = this.getStorage();
    const nextId = escrows.length + 1;
    const newEscrow: Escrow = {
      id: nextId,
      client: clientAddr,
      freelancer: freelancerAddr,
      arbiter: arbiterAddr,
      token: tokenAddr,
      amount: amountVal,
      status: 'Active',
    };

    escrows.push(newEscrow);
    this.setStorage(escrows);
    return nextId;
  }

  async release_funds(args: { escrow_id: number }): Promise<void>;
  async release_funds(escrow_id: number): Promise<void>;
  async release_funds(arg: number | { escrow_id: number }): Promise<void> {
    const escrow_id = typeof arg === 'number' ? arg : arg.escrow_id;
    await new Promise(resolve => setTimeout(resolve, 800));

    const escrows = this.getStorage();
    const escrow = escrows.find(e => e.id === escrow_id);
    if (!escrow) throw new Error('Escrow not found');
    if (escrow.status !== 'Active') throw new Error('Escrow is not active');

    escrow.status = 'Completed';
    this.setStorage(escrows);
  }

  async trigger_dispute(args: { escrow_id: number }): Promise<void>;
  async trigger_dispute(escrow_id: number): Promise<void>;
  async trigger_dispute(arg: number | { escrow_id: number }): Promise<void> {
    const escrow_id = typeof arg === 'number' ? arg : arg.escrow_id;
    await new Promise(resolve => setTimeout(resolve, 800));

    const escrows = this.getStorage();
    const escrow = escrows.find(e => e.id === escrow_id);
    if (!escrow) throw new Error('Escrow not found');
    if (escrow.status !== 'Active') throw new Error('Escrow is not active');

    escrow.status = 'Disputed';
    this.setStorage(escrows);
  }

  async resolve_dispute(args: { escrow_id: number; freelancer_share: bigint }): Promise<void>;
  async resolve_dispute(escrow_id: number, freelancer_share: bigint): Promise<void>;
  async resolve_dispute(
    arg: number | { escrow_id: number; freelancer_share: bigint },
    freelancer_share?: bigint
  ): Promise<void> {
    let escrow_id: number;
    let share: bigint;
    if (typeof arg === 'number') {
      escrow_id = arg;
      if (freelancer_share === undefined) {
        throw new Error('Missing freelancer_share positional argument');
      }
      share = freelancer_share;
    } else {
      escrow_id = arg.escrow_id;
      share = arg.freelancer_share;
    }

    await new Promise(resolve => setTimeout(resolve, 800));

    const escrows = this.getStorage();
    const escrow = escrows.find(e => e.id === escrow_id);
    if (!escrow) throw new Error('Escrow not found');
    if (escrow.status !== 'Disputed') throw new Error('Escrow is not disputed');
    if (share < 0n || share > escrow.amount) {
      throw new Error('Invalid freelancer share');
    }

    escrow.status = 'Resolved';
    this.setStorage(escrows);
  }
}
