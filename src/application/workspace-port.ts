export type WorkspaceReason =
  | 'unavailable'
  | 'uncertain'
  | 'inconsistent'
  | 'fenced'
  | 'revoked'
  | 'timezone-required'
  | 'profile-invalid';
export class WorkspaceError extends Error {
  constructor(
    readonly reason: WorkspaceReason,
    readonly operationCode?: string,
  ) {
    super(reason);
  }
}
export interface WorkspaceInitialInput {
  timezone?: string;
  profile?: { displayName?: string; photoUrl?: string };
}
export interface WorkspaceInspection {
  complete: boolean;
  nextStage: number;
  profile?: { displayName?: string; photoUrl?: string };
  timezone?: string;
}
export interface WorkspacePort {
  inspect(uid: string, current: () => boolean): Promise<WorkspaceInspection>;
  stage(
    uid: string,
    index: number,
    input: WorkspaceInitialInput,
    current: () => boolean,
  ): Promise<void>;
  finalize(uid: string, current: () => boolean): Promise<void>;
  watchFence(
    uid: string,
    next: (exists: boolean, authoritative: boolean) => void,
    error: () => void,
  ): () => void;
  dispose(): void;
}
