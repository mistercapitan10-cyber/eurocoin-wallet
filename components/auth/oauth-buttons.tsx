'use client';

/**
 * OAuth Buttons Component
 * Displays OAuth provider buttons (Google)
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/use-translation';
import toast from 'react-hot-toast';

// Lucide icons
import { Chrome } from 'lucide-react';

interface OAuthButtonsProps {
  /** Callback URL after successful sign in */
  callbackUrl?: string;
  /** Disable all buttons */
  disabled?: boolean;
}

export function OAuthButtons({ callbackUrl = '/', disabled = false }: OAuthButtonsProps) {
  const t = useTranslation();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      setIsGoogleLoading(true);

      // Create form and submit to NextAuth Google OAuth endpoint
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = '/api/auth/signin/google';

      // Add callbackUrl as hidden input
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = 'callbackUrl';
      input.value = callbackUrl;
      form.appendChild(input);

      // Add CSRF token
      const csrfInput = document.createElement('input');
      csrfInput.type = 'hidden';
      csrfInput.name = 'csrfToken';
      csrfInput.value = await getCsrfToken();
      form.appendChild(csrfInput);

      document.body.appendChild(form);
      form.submit();
    } catch (error) {
      console.error('[OAuth] Google sign-in error:', error);

      const message =
        error instanceof Error ? error.message : t('login.oauth.googleError');

      toast.error(message);
      setIsGoogleLoading(false);
    }
  };

  // Helper function to get CSRF token
  async function getCsrfToken(): Promise<string> {
    try {
      const response = await fetch('/api/auth/csrf');
      const data = await response.json();
      return data.csrfToken || '';
    } catch (error) {
      console.error('[OAuth] Failed to get CSRF token:', error);
      return '';
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Google OAuth Button */}
      <Button
        type="button"
        variant="secondary"
        size="lg"
        fullWidth
        onClick={handleGoogleSignIn}
        disabled={disabled || isGoogleLoading}
        className="flex items-center justify-center gap-2"
      >
        {isGoogleLoading ? (
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : (
          <Chrome className="h-5 w-5" />
        )}
        {isGoogleLoading ? t('login.oauth.googleLoading') : t('login.oauth.google')}
      </Button>
    </div>
  );
}
