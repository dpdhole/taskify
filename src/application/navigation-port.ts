export interface NavigationView {
  id: string;
  name: string;
  order: number;
  showOnHome: boolean;
}
export type NavigationSnapshot =
  | { status: 'ready'; views: readonly NavigationView[] }
  | { status: 'waiting' | 'error'; views: readonly [] };
/** One shared read per admitted shell, never one listener per visual control. */
export interface NavigationReader {
  watch(uid: string, next: (snapshot: NavigationSnapshot) => void): () => void;
}
