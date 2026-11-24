import { collection, onSnapshot } from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';
import type {
  NavigationReader,
  NavigationView,
} from '../../application/navigation-port';
import { decodeFirestoreWorkspaceRecord } from './workspace-record-decoder';

export function createNavigationReader(db: Firestore): NavigationReader {
  return {
    watch(uid, next) {
      let active = true;
      const stop = onSnapshot(
        collection(db, 'users', uid, 'views'),
        { includeMetadataChanges: true },
        (snapshot) => {
          if (!active) return;
          if (
            snapshot.metadata.fromCache ||
            snapshot.metadata.hasPendingWrites
          ) {
            next({ status: 'waiting', views: [] });
            return;
          }
          try {
            const views: NavigationView[] = snapshot.docs.map((record) => {
              const value = decodeFirestoreWorkspaceRecord(uid, 'view', record);
              if (!(
                'name' in value &&
                'showOnHome' in value &&
                'order' in value
              ))
                throw Error();
              return {
                id: record.id,
                name: value.name,
                showOnHome: value.showOnHome,
                order: value.order,
              };
            });
            if (
              !views.some((view) => view.id === 'all-tasks') ||
              new Set(views.map((view) => view.order)).size !== views.length
            )
              throw Error();
            views.sort((a, b) => a.order - b.order);
            next({ status: 'ready', views });
          } catch {
            next({ status: 'error', views: [] });
          }
        },
        () => {
          if (active) next({ status: 'error', views: [] });
        },
      );
      return () => {
        active = false;
        stop();
      };
    },
  };
}
