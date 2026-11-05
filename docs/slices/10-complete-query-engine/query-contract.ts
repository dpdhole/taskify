/** Slice10 engineering contract; documentation artifact, not application implementation. */
import type { WorkspaceQuery } from '../../../src/domain/workspace-query';
export type Instant = Readonly<{ seconds: number; nanoseconds: number }>;
export type Due =
  | Readonly<{ kind: 'calendarDate'; date: string; expiresAt: Instant }>
  | Readonly<{ kind: 'instant'; value: Instant }>;
export type TriState = 'yes' | 'no' | 'unset';
export type Lifecycle = 'draft' | 'inProgress' | 'closed';
export type Outcome =
  | 'done'
  | 'cancelled'
  | 'unableToComplete'
  | 'noLongerApplicable'
  | 'duplicate'
  | 'other';
export interface TaskMetadata {
  readonly id: string;
  readonly schemaVersion: 1 | 2;
  readonly recordVersion: number;
  readonly title: string;
  readonly reference: string | null;
  readonly categoryId: string;
  readonly locationId: string | null;
  readonly lifecycle: Lifecycle;
  readonly important: TriState;
  readonly urgent: TriState;
  readonly pause:
    | Readonly<{ active: false; until: null }>
    | Readonly<{ active: true; until: Instant | null }>;
  readonly closureOutcome: Outcome | null;
  readonly createdAt: Instant;
  readonly plannedStart: Instant | null;
  readonly due: Due | null;
  readonly actualStart: Instant | null;
  readonly actualEnd: Instant | null;
  readonly deletedAt: Instant | null;
}
export interface Classification {
  readonly id: string;
  readonly name: string;
  readonly order: number;
  readonly archived: boolean;
  readonly protected: boolean;
}
export interface Admission {
  readonly environmentId: string;
  readonly uid: string;
  readonly generation: number;
}
export interface EvaluationContext {
  readonly now: Instant;
  readonly timezone: string;
  readonly revision: number;
}
export interface SourceRevision {
  readonly admission: Admission;
  readonly streamEpoch: number;
  readonly sequence: number;
}
export interface ConfirmedPopulation {
  readonly revision: SourceRevision;
  readonly tasks: readonly TaskMetadata[];
  readonly categories: readonly Classification[];
  readonly locations: readonly Classification[];
}
/** Atomically replaces one source collection. Never mixes pending values into confirmed records. */
export interface PopulationReplacement {
  readonly revision: SourceRevision;
  readonly collection: 'tasks' | 'categories' | 'locations';
  readonly records: readonly unknown[];
  readonly fromCache: boolean;
  readonly hasPendingWrites: boolean;
}
export type PopulationEvent =
  | Readonly<{ type: 'replacement'; value: PopulationReplacement }>
  | Readonly<{ type: 'transportLost'; revision: SourceRevision }>
  | Readonly<{
      type: 'blocked';
      revision: SourceRevision;
      reason: 'accessLost' | 'compatibility' | 'deletionFence';
    }>
  | Readonly<{
      type: 'error';
      revision: SourceRevision;
      code: 'invalidData' | 'unsupportedSchema' | 'listenerFailed';
    }>;
export interface MetadataPort {
  subscribe(
    admission: Admission,
    receive: (event: PopulationEvent) => void,
  ): () => void;
}
export interface CalendarPort {
  dateAt(value: Instant, timezone: string): string;
  addDays(date: string, count: number): string;
  daysBetween(from: string, to: string): number;
  startOfDay(date: string, timezone: string): Instant;
}
export type GroupIdentity =
  | Readonly<{
      kind: 'classification';
      field: 'category' | 'location';
      id: string;
    }>
  | Readonly<{
      kind: 'missingClassification';
      field: 'category' | 'location';
      id: string;
    }>
  | Readonly<{ kind: 'unassignedLocation' }>
  | Readonly<{
      kind: 'enum';
      field: 'lifecycle' | 'importantUrgent';
      value: string;
    }>
  | Readonly<{
      kind: 'date';
      field: string;
      bucket:
        | 'older'
        | 'previous8To30'
        | 'previous1To7'
        | 'today'
        | 'next1To7'
        | 'next8To30'
        | 'later'
        | 'unspecified';
    }>;
export interface QueryGroup {
  readonly identity: GroupIdentity;
  readonly label: Readonly<{
    text: string;
    unavailable: boolean;
    archived: boolean;
  }>;
  readonly taskIds: readonly string[];
  readonly count: number;
}
export interface QueryResult {
  readonly source: SourceRevision;
  readonly queryRevision: number;
  readonly contextRevision: number;
  readonly groups: readonly QueryGroup[];
  readonly total: number;
}
export type QueryState =
  | Readonly<{ status: 'loading'; admission: Admission }>
  | Readonly<{ status: 'ready'; result: QueryResult }>
  | Readonly<{
      status: 'stale';
      result: QueryResult;
      reason: 'transport' | 'reloading';
    }>
  | Readonly<{ status: 'blocked'; reason: string }>
  | Readonly<{
      status: 'error';
      code:
        | 'invalidQuery'
        | 'unsupportedQuery'
        | 'invalidData'
        | 'unsupportedSchema'
        | 'dateRange'
        | 'listenerFailed';
    }>;
export type Evaluate = (
  query: WorkspaceQuery,
  queryRevision: number,
  population: ConfirmedPopulation,
  context: EvaluationContext,
  calendar: CalendarPort,
) => QueryResult;
