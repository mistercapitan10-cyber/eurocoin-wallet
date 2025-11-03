'use client';

/**
 * OAuth Buttons Component
 * Displays OAuth provider buttons (Google)
 */

import { useState, useEffect } from 'react';
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
  const [isGoogleAvailable, setIsGoogleAvailable] = useState(true);

  // Check if Google OAuth is available on mount
  useEffect(() => {
    checkGoogleAvailability();
  }, []);

  // Check if Google OAuth provider is available
  async function checkGoogleAvailability() {
    try {
      const response = await fetch('/api/auth/providers');
      if (!response.ok) {
        setIsGoogleAvailable(false);
        return;
      }
      const providers = await response.json();
      setIsGoogleAvailable(!!providers?.google);
    } catch (error) {
      console.warn('[OAuth] Failed to check providers availability:', error);
      setIsGoogleAvailable(false);
    }
  }

  const handleGoogleSignIn = async () => {
    try {
      setIsGoogleLoading(true);

      // Get CSRF token first
      const csrfToken = await getCsrfToken();
      if (!csrfToken) {
        throw new Error('Failed to get CSRF token. Please try again later.');
      }

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
      csrfInput.value = csrfToken;
      form.appendChild(csrfInput);

      document.body.appendChild(form);
      form.submit();
    } catch (error) {
      console.error('[OAuth] Google sign-in error:', error);

      const message =
        error instanceof Error ? error.message : t('login.oauth.googleError');

      toast.error(message);
      setIsGoogleLoading(false);
      setIsGoogleAvailable(false);
    }
  };

  // Helper function to get CSRF token with better error handling
  async function getCsrfToken(): Promise<string> {
    try {
      const response = await fetch('/api/auth/csrf');
      
      if (!response.ok) {
        // If server returns error, try to get text to see what's wrong
        const text = await response.text();
        console.error('[OAuth] CSRF endpoint returned error:', {
          status: response.status,
          statusText: response.statusText,
          body: text.substring(0, 200),
        });
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        const text = await response.text();
        console.error('[OAuth] CSRF endpoint returned non-JSON:', text.substring(0, 200));
        throw new Error('Invalid response format from server');
      }

      const data = await response.json();
      return data.csrfToken || '';
    } catch (error) {
      console.error('[OAuth] Failed to get CSRF token:', error);
      throw error; // Re-throw to let handleGoogleSignIn handle it
    }
  }

  // Don't render Google button if provider is not available
  if (!isGoogleAvailable) {
    return null;
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
