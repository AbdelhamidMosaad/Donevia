
'use client';

import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { signInWithCustomToken } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';

export function GoogleLoginButton() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { user } = useAuth();

  const handleSignIn = () => {
    // Redirect to our backend route to start the OAuth flow
    window.location.href = '/api/auth/google';
  };

  useEffect(() => {
    const accessToken = searchParams.get('access_token');
    const refreshToken = searchParams.get('refresh_token');
    const googleId = searchParams.get('user_id');
    const email = searchParams.get('user_email');
    const error = searchParams.get('error');

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Authentication Error',
        description: `Failed to sign in with Google: ${error}`,
      });
      // Clean up URL
      router.replace('/');
    }

    if (accessToken && googleId && email && !user) {
      const getCustomToken = async () => {
        try {
          // 1. Get a Firebase custom token from our backend
          const response = await fetch('/api/firebase/custom-token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ googleId, email, accessToken, refreshToken }),
          });

          if (!response.ok) {
            throw new Error('Failed to get custom token from server.');
          }

          const { customToken } = await response.json();

          // 2. Sign in to Firebase with the custom token
          await signInWithCustomToken(auth, customToken);

          // 3. Redirect to the home page after successful sign-in
          router.push('/home');

        } catch (err) {
          console.error('Custom token sign-in error:', err);
          toast({
            variant: 'destructive',
            title: 'Sign-In Error',
            description: (err as Error).message,
          });
          // Clean up URL
          router.replace('/');
        }
      };

      getCustomToken();
    }
  }, [searchParams, router, toast, user]);

  return (
    <Button onClick={handleSignIn} size="lg" className="bg-violet-600 hover:bg-violet-700 text-white shadow-lg">
      Sign in with Google
    </Button>
  );
}
