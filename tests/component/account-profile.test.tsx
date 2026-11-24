import { expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { AccountProfile } from '../../src/ui/AccountProfile';

it('shows identity details and recovers from a failed photo or unsafe URL', () => {
  const firstPhoto = 'https://lh3.googleusercontent.com/first';
  const secondPhoto = 'https://lh3.googleusercontent.com/second';
  const identity = {
    displayName: 'Account name',
    email: 'account@example.test',
    photoUrl: firstPhoto,
  };
  const { rerender } = render(<AccountProfile identity={identity} />);
  const image = screen
    .getByRole('region', { name: 'Account information' })
    .querySelector('img')!;
  expect(screen.getByText(identity.displayName)).toBeInTheDocument();
  expect(screen.getByText(identity.email)).toBeInTheDocument();
  expect(image).toHaveAttribute('src', firstPhoto);
  expect(image).toHaveAttribute('referrerpolicy', 'no-referrer');
  fireEvent.error(image);
  expect(image).toHaveAttribute(
    'src',
    '/icons/material-symbols-rounded/person.svg',
  );
  rerender(
    <AccountProfile identity={{ ...identity, photoUrl: secondPhoto }} />,
  );
  expect(image).toHaveAttribute('src', secondPhoto);
  rerender(
    <AccountProfile
      identity={{ ...identity, photoUrl: 'javascript:alert(1)' }}
    />,
  );
  expect(image).toHaveAttribute(
    'src',
    '/icons/material-symbols-rounded/person.svg',
  );
});
