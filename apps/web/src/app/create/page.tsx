import { LinkGeneratorContainer } from '@/components/organisms/LinkGeneratorContainer';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Create Your Payment Link | TippinBit',
  description: 'Claim your @username and generate a shareable payment link',
};

export default function CreatePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Create Payment Link</h1>
      <LinkGeneratorContainer />
    </div>
  );
}
