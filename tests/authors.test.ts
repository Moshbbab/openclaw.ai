import { describe, expect, test } from 'bun:test';
import { getSortedAuthorLinkMeta } from '../src/lib/authors';

function getLinkMeta(url: string, label = 'Profile') {
  return getSortedAuthorLinkMeta({
    name: 'Example Author',
    links: [{ label, url }],
  })[0];
}

const credentialedLinkedInUrl = new URL('https://WWW.LINKEDIN.COM:8443/in/example');
credentialedLinkedInUrl.username = 'fixture-user';
credentialedLinkedInUrl.password = 'fixture-password';

describe('author link metadata', () => {
  test.each([
    'https://linkedin.com/in/example',
    'https://www.linkedin.com/in/example',
    'https://jobs.linkedin.com/in/example',
    credentialedLinkedInUrl.href,
  ])('recognizes canonical LinkedIn hosts: %s', (url) => {
    expect(getLinkMeta(url)).toMatchObject({
      displayLabel: 'LinkedIn',
      ariaLabel: 'Example Author on LinkedIn',
      order: 1,
    });
  });

  test.each([
    ['https://linkedin.com.evil.example/in/example', 'Profile'],
    ['https://evil-linkedin.com/in/example', 'LinkedIn'],
    ['https://l\u0131nkedin.com/in/example', 'Profile'],
  ])('does not recognize a LinkedIn lookalike host: %s', (url, label) => {
    expect(getLinkMeta(url, label)).toMatchObject({
      displayLabel: label,
      ariaLabel: `Example Author: ${label}`,
      order: 3,
    });
  });

  test('falls back to website metadata for malformed URLs', () => {
    expect(getLinkMeta('not a URL')).toMatchObject({
      displayLabel: 'Profile',
      ariaLabel: 'Example Author: Profile',
      order: 3,
    });
  });

  test.each([
    ['https://x.com/example', '@example', '@example', 0],
    ['https://twitter.com/example', 'X', 'X', 0],
    ['https://github.com/example', 'Profile', 'GitHub', 2],
  ])('keeps sibling host classification for %s', (url, label, displayLabel, order) => {
    expect(getLinkMeta(url, label)).toMatchObject({ displayLabel, order });
  });

  test.each([
    ['https://example.com/x', '@example'],
    ['https://example.com/linkedin', 'LinkedIn'],
    ['https://example.com/github', 'GitHub'],
  ])('does not infer a social host from the label: %s', (url, label) => {
    expect(getLinkMeta(url, label)).toMatchObject({
      displayLabel: label,
      ariaLabel: `Example Author: ${label}`,
      order: 3,
    });
  });
});
