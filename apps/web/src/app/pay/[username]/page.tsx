import { Metadata } from 'next';
import { UsernamePayPageClient } from './UsernamePayPageClient';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ amount?: string }>;
}

/**
 * Generate metadata for username payment page
 *
 * @param params - Route parameters containing username
 * @returns Page metadata with username in title
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  return {
    title: `Tip ${username} | TippinBit`,
    description: `Send a tip to ${username} on TippinBit`,
  };
}

/**
 * Username payment page (Server Component wrapper)
 *
 * Handles /pay/@username route pattern.
 * Resolves username to wallet address and displays payment page.
 *
 * @param params - Route parameters containing username
 * @param searchParams - Query parameters (e.g., amount)
 */
export default async function UsernamePayPage({
  params,
  searchParams,
}: Props) {
  const { username } = await params;
  const { amount } = await searchParams;

  return (
    <UsernamePayPageClient
      username={username}
      {...(amount ? { amount } : {})}
    />
  );
}
