import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  createContext,
} from 'react';
import type { ReactNode } from 'react';
import { Link, useBlocker, useLocation, useNavigate } from 'react-router';
import type {
  NavigationReader,
  NavigationSnapshot,
} from '../application/navigation-port';
import styles from './navigation.module.css';

/** Future editors register their own synchronous leave decision here. */
export const NavigationGuardContext = createContext<
  (guard: (() => boolean) | null) => void
>(() => {});
const viewPath = (id: string) => '/views/' + encodeURIComponent(id);
function retained(uid: string) {
  try {
    return sessionStorage.getItem('taskify.navigation.' + uid) === 'expanded';
  } catch {
    return false;
  }
}
export function NavigationShell({
  uid,
  reader,
  account,
  logout,
}: {
  uid: string;
  reader: NavigationReader;
  account: ReactNode;
  logout: () => void;
}) {
  const [metadata, setMetadata] = useState<NavigationSnapshot>({
    status: 'waiting',
    views: [],
  });
  const [wide, setWide] = useState(
    () => matchMedia('(min-width: 960px)').matches,
  );
  const [expanded, setExpanded] = useState(() => retained(uid));
  const [drawer, setDrawer] = useState(false);
  const [preview, setPreview] = useState(false);
  const [section, setSection] = useState<'views' | 'settings' | null>('views');
  const location = useLocation();
  const [routeKey, setRouteKey] = useState(location.key);
  if (routeKey !== location.key) {
    setRouteKey(location.key);
    setDrawer(false);
    setPreview(false);
  }
  const navigate = useNavigate();
  const guard = useRef<(() => boolean) | null>(null);
  const blocker = useBlocker(() => (guard.current ? !guard.current() : false));
  useEffect(() => {
    if (blocker.state === 'blocked') blocker.reset();
  }, [blocker]);
  const navigation = useRef<HTMLElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const opener = useRef<HTMLButtonElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const settings = location.pathname.startsWith('/settings');
  const modal = !wide && drawer;
  const visible = wide ? expanded || preview : drawer;
  const route = location.pathname;
  let viewId: string | null = null;
  try {
    if (/^\/views\/[^/]+$/.test(route))
      viewId = decodeURIComponent(route.slice(7));
  } catch {
    /* invalid route below */
  }
  const view = metadata.views.find((item) => item.id === viewId);
  const title =
    route === '/'
      ? 'Home'
      : route === '/settings/account'
        ? 'My Account'
        : view
          ? view.name
          : viewId
            ? 'View unavailable'
            : 'Page unavailable';
  const origin =
    location.state &&
    typeof location.state === 'object' &&
    'taskifyOrigin' in location.state
      ? location.state.taskifyOrigin
      : null;
  const canBack =
    typeof origin === 'string' &&
    origin.startsWith('/') &&
    !origin.startsWith('//');

  useEffect(() => {
    let current = true;
    try {
      const stop = reader.watch(uid, (next) => {
        if (current) setMetadata(next);
      });
      return () => {
        current = false;
        stop();
      };
    } catch {
      queueMicrotask(() => {
        if (current) setMetadata({ status: 'error', views: [] });
      });
    }
    return () => {
      current = false;
    };
  }, [reader, uid]);
  useEffect(() => {
    const media = matchMedia('(min-width: 960px)');
    const change = () => {
      const hadNavigationFocus = navigation.current?.contains(
        document.activeElement,
      );
      setWide(media.matches);
      setDrawer(false);
      setPreview(false);
      if (hadNavigationFocus) opener.current?.focus();
    };
    media.addEventListener('change', change);
    return () => media.removeEventListener('change', change);
  }, []);
  useEffect(() => {
    document.title = title + ' · Taskify';
  }, [title]);
  useEffect(() => {
    if (document.activeElement === document.body) {
      if (modal) closeButton.current?.focus();
      else heading.current?.focus();
    }
  }, [metadata, modal]);
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      if (!content.current?.inert) heading.current?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [location.key]);
  useLayoutEffect(() => {
    if (!modal) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const background = content.current;
    const returnTarget = opener.current;
    if (background) background.inert = true;
    closeButton.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      if (background) background.inert = false;
      if (returnTarget?.isConnected) returnTarget.focus();
    };
  }, [modal]);
  function close() {
    setDrawer(false);
    setPreview(false);
    opener.current?.focus();
  }
  function toggle() {
    if (wide) {
      setPreview(false);
      setExpanded(!expanded);
      try {
        sessionStorage.setItem(
          'taskify.navigation.' + uid,
          expanded ? 'collapsed' : 'expanded',
        );
      } catch {
        /* in-memory fallback */
      }
    } else {
      setSection(settings ? 'settings' : 'views');
      setDrawer(true);
    }
  }
  function clearAndLogout() {
    try {
      sessionStorage.removeItem('taskify.navigation.' + uid);
    } catch {
      /* storage optional */
    }
    logout();
  }
  const link = (to: string, label: string, icon?: string) => (
    <Link
      to={to}
      state={{ taskifyOrigin: location.pathname }}
      aria-current={route === to ? 'page' : undefined}
      title={label}
      className={styles.link}
      aria-label={label}
    >
      {icon && (
        <img
          alt=""
          className={styles.icon}
          src={'/icons/material-symbols-rounded/' + icon + '.svg'}
        />
      )}
      <span className={styles.label}>{label}</span>
    </Link>
  );
  return (
    <NavigationGuardContext
      value={(next) => {
        guard.current = next;
      }}
    >
      <div
        className={styles.shell}
        data-expanded={wide && expanded}
        data-visible={visible}
      >
        <a className={styles.skip} href="#workspace-content" inert={modal}>
          Skip to content
        </a>
        {modal && (
          <div className={styles.backdrop} onClick={close} aria-hidden="true" />
        )}
        <aside
          ref={navigation}
          className={styles.navigation}
          hidden={!wide && !drawer}
          role={modal ? 'dialog' : undefined}
          aria-modal={modal || undefined}
          aria-label="Workspace navigation"
          onMouseEnter={() => {
            if (wide && !expanded && matchMedia('(hover: hover)').matches)
              setPreview(true);
          }}
          onMouseLeave={() => {
            if (!navigation.current?.contains(document.activeElement))
              setPreview(false);
          }}
          onBlur={(event) => {
            if (
              !event.currentTarget.contains(event.relatedTarget) &&
              !event.currentTarget.matches(':hover')
            )
              setPreview(false);
          }}
          onKeyDown={(event) => {
            if (event.key === 'Escape' && (modal || preview)) {
              event.preventDefault();
              close();
            }
            if (event.key !== 'Tab' || !modal) return;
            const controls = [
              ...event.currentTarget.querySelectorAll<HTMLElement>(
                'a[href],button:not(:disabled)',
              ),
            ].filter((el) => !el.closest('[hidden]'));
            const first = controls[0],
              last = controls.at(-1);
            if (event.shiftKey && document.activeElement === first) {
              event.preventDefault();
              last?.focus();
            }
            if (!event.shiftKey && document.activeElement === last) {
              event.preventDefault();
              first?.focus();
            }
          }}
        >
          <div className={styles.navTop}>
            <span className={styles.label}>Taskify</span>
            {visible && (
              <button
                ref={closeButton}
                aria-label="Close navigation"
                onClick={() => {
                  if (wide && expanded) toggle();
                  close();
                }}
              >
                <img
                  alt=""
                  className={styles.icon}
                  src="/icons/material-symbols-rounded/close.svg"
                />
              </button>
            )}
          </div>
          <nav aria-label="Main">
            {link('/', 'Home', 'home')}
            <button
              className={styles.section}
              aria-label="Task Views"
              aria-expanded={wide || section === 'views'}
              onClick={() => {
                if (wide && !visible) toggle();
                else if (!wide)
                  setSection(section === 'views' ? null : 'views');
              }}
              title="Task Views"
            >
              <img
                alt=""
                className={styles.icon}
                src="/icons/material-symbols-rounded/view_list.svg"
              />
              <span className={styles.label}>Task Views</span>
            </button>
            <div
              hidden={!wide && section !== 'views'}
              className={!visible ? styles.railContents : undefined}
              inert={!visible}
              aria-hidden={!visible || undefined}
            >
              {metadata.views.map((item) => (
                <div key={item.id}>{link(viewPath(item.id), item.name)}</div>
              ))}
              <p className={styles.unavailable}>
                Manage Views <small>Not available yet</small>
              </p>
            </div>
            <button
              className={styles.section}
              aria-label="Settings"
              aria-expanded={wide || section === 'settings'}
              onClick={() => {
                if (wide && !visible) toggle();
                else if (!wide)
                  setSection(section === 'settings' ? null : 'settings');
              }}
              title="Settings"
            >
              <img
                alt=""
                className={styles.icon}
                src="/icons/material-symbols-rounded/settings.svg"
              />
              <span className={styles.label}>Settings</span>
            </button>
            <div
              hidden={!wide && section !== 'settings'}
              className={!visible ? styles.railContents : undefined}
              inert={!visible}
              aria-hidden={!visible || undefined}
            >
              {[
                'Views',
                'Categories',
                'Locations',
                'Preferences',
                'Cleanup',
              ].map((name) => (
                <p key={name} className={styles.unavailable}>
                  {name}
                  <small>Not available yet</small>
                </p>
              ))}
              {link('/settings/account', 'My Account')}
            </div>
          </nav>
        </aside>
        <div ref={content} className={styles.workspace}>
          <header className={styles.header}>
            {settings && canBack ? (
              <button ref={opener} onClick={() => void navigate(-1)}>
                Back
              </button>
            ) : settings ? (
              <Link to="/">Home</Link>
            ) : null}
            {!settings && (
              <button
                ref={opener}
                onClick={toggle}
                aria-label={
                  wide && expanded ? 'Collapse navigation' : 'Open navigation'
                }
                aria-expanded={visible}
              >
                <img
                  alt=""
                  className={styles.icon}
                  src="/icons/material-symbols-rounded/menu.svg"
                />
              </button>
            )}
            <span className={styles.headerTitle} title={title}>
              Taskify / {title}
            </span>
          </header>
          <main id="workspace-content" tabIndex={-1} className={styles.main}>
            <h1 ref={heading} tabIndex={-1}>
              {title}
            </h1>
            <span role="status" className={styles.srOnly}>
              {title}
            </span>
            {route === '/settings/account' ? (
              <>
                {account}
                <button onClick={clearAndLogout}>Logout</button>
              </>
            ) : metadata.status !== 'ready' ? (
              <section role="status">
                <p>
                  {metadata.status === 'waiting'
                    ? 'Loading confirmed workspace navigation…'
                    : 'Workspace navigation needs recovery. View metadata could not be validated.'}
                </p>
                <p>
                  Check your connection and refresh. To sign out, open My
                  Account.
                </p>
                <Link
                  to="/settings/account"
                  state={{ taskifyOrigin: location.pathname }}
                >
                  My Account
                </Link>
              </section>
            ) : route === '/' ? (
              <>
                <p>Your workspace is ready. Choose a Task View to continue.</p>
                <div className={styles.viewGrid}>
                  {metadata.views
                    .filter((item) => item.showOnHome)
                    .map((item) => (
                      <div key={item.id}>
                        {link(viewPath(item.id), item.name)}
                      </div>
                    ))}
                </div>
                <p className={styles.note}>
                  Task lists and dashboard summaries are not available yet.
                </p>
              </>
            ) : view ? (
              <p>Task functionality for {view.name} is not available yet.</p>
            ) : (
              <>
                <p>
                  {viewId
                    ? 'This View no longer exists or is unavailable.'
                    : 'This destination is not available.'}
                </p>
                {viewId && link('/views/all-tasks', 'All Tasks')}
                {link('/', 'Home')}
              </>
            )}
          </main>
        </div>
      </div>
    </NavigationGuardContext>
  );
}
