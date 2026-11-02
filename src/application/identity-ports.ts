import type {
  SessionReason,
  SignInProvider,
  SignInTransport,
} from './session-controller';
export interface SignInMethodsSnapshot {
  uid: string;
  verificationReturn?: { provider: SignInProvider; reason: SessionReason };
  providers: readonly SignInProvider[];
}
export interface LinkReturn {
  uid: string;
  target: SignInProvider;
  existing: SignInProvider;
  stage: 'ready' | 'checking' | 'error';
  reason: SessionReason;
  proofId?: string;
}
export interface SignInMethodsReader {
  readSignInMethods(uid: string): Promise<SignInMethodsSnapshot>;
  reauthenticate?(
    uid: string,
    provider: SignInProvider,
    transport: SignInTransport,
  ): Promise<{ uid: string }>;
  cancelReauthentication?(): void;
  hasVerificationReturn?(): boolean;
  proveLink?(
    uid: string,
    target: SignInProvider,
    existing: SignInProvider,
    transport: SignInTransport,
  ): Promise<{ uid: string; proofId: string }>;
  submitLink?(
    uid: string,
    target: SignInProvider,
    proofId: string,
    transport: SignInTransport,
  ): Promise<{ uid: string }>;
  cancelLink?(): void;
  takeLinkReturn?(): LinkReturn | undefined;
}
