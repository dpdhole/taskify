import type {
  AccountDeletionControl,
  DeletionProvider,
} from '../domain/account-deletion';
export interface DeletionProof {
  uid: string;
  jobId: string;
  provider: DeletionProvider;
  authTime: number;
}
export type DeletionStatus =
  { exists: false } | { exists: true; control: AccountDeletionControl | null };
export class DeletionError extends Error {
  constructor(
    readonly reason:
      | 'unavailable'
      | 'uncertain'
      | 'cancelled'
      | 'proof-invalid'
      | 'popup-blocked'
      | 'unsupported'
      | 'revoked',
  ) {
    super(reason);
  }
}
export interface DeletionProofPort {
  providers(uid: string): Promise<readonly DeletionProvider[]>;
  prove(
    uid: string,
    jobId: string,
    provider: DeletionProvider,
    transport: 'popup' | 'redirect',
  ): Promise<DeletionProof>;
  resume(uid: string): Promise<DeletionProof | undefined>;
  cancel(): void;
  dispose(): void;
}
export interface DeletionRequestPort {
  hasPending?(uid: string): boolean;
  forget?(uid: string): void;
  read(uid: string): Promise<DeletionStatus>;
  request(
    proof: DeletionProof,
    revision: number,
    current: () => boolean,
  ): Promise<DeletionStatus>;
  watch(
    uid: string,
    next: (status: DeletionStatus, authoritative: boolean) => void,
    error: () => void,
  ): () => void;
  dispose(): void;
}
