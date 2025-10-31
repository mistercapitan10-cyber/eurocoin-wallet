'use client';

import { useEffect } from 'react';
import { SupportMessenger } from './support-messenger';

interface SupportChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SupportChatModal({ isOpen, onClose }: SupportChatModalProps) {
  // Handle ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop - hidden on mobile */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm hidden md:block"
        onClick={onClose}
      />

      {/* Modal - fullscreen on mobile, centered modal on desktop */}
      <div className="relative z-10 w-full h-full md:h-[600px] md:max-w-2xl md:mx-4 md:rounded-lg shadow-2xl overflow-hidden">
        <SupportMessenger onClose={onClose} />
      </div>
    </div>
  );
}
