import { useState } from 'react';
import type { SessionIdentity } from '../application/session-controller';
import styles from './navigation.module.css';

const placeholder = '/icons/material-symbols-rounded/person.svg';

function profilePhoto(value: string | undefined) {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    if (url.protocol === 'https:' && !url.username && !url.password)
      return url.href;
  } catch {
    return undefined;
  }
}

export function AccountProfile({
  identity,
}: {
  identity: Pick<SessionIdentity, 'displayName' | 'email' | 'photoUrl'>;
}) {
  const [failedPhoto, setFailedPhoto] = useState<string>();
  const photo = profilePhoto(identity.photoUrl);
  const showPhoto = photo && photo !== failedPhoto;
  return (
    <section className={styles.accountProfile} aria-label="Account information">
      <img
        className={showPhoto ? styles.profilePhoto : styles.profilePlaceholder}
        src={showPhoto ? photo : placeholder}
        alt=""
        referrerPolicy="no-referrer"
        onError={showPhoto ? () => setFailedPhoto(photo) : undefined}
      />
      <div>
        <strong>{identity.displayName?.trim() || 'Signed-in account'}</strong>
        {identity.email?.trim() && <p>{identity.email.trim()}</p>}
      </div>
    </section>
  );
}
