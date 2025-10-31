'use client';

import { SupportMessenger } from '@/components/support/support-messenger';
import { useRouter } from 'next/navigation';

export default function SupportPage() {
  const router = useRouter();

  return (
    <div className="fixed inset-0 bg-white dark:bg-dark-surface z-50">
      <SupportMessenger onClose={() => router.back()} />
    </div>
  );
}
