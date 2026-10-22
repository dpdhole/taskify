import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import styles from '../ui/foundation.module.css';
const root = document.getElementById('root');
if (!root) throw new Error('Missing root');
createRoot(root).render(
  <StrictMode>
    <main className={styles.panel}>
      <h1>Taskify</h1>
      <p>The application foundation is ready for feature development.</p>
      <p>Sign-in and Tasks are not available in this build.</p>
    </main>
  </StrictMode>,
);
