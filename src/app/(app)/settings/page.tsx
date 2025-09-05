
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

type Theme = 'light' | 'dark' | 'blue' | 'green' | 'purple';

const themes: { name: Theme; label: string; colors: { bg: string; text: string; primary: string; secondary: string } }[] = [
  { name: 'light', label: 'Light', colors: { bg: 'hsl(210 100% 95%)', text: 'hsl(215 40% 15%)', primary: 'hsl(210 70% 50%)', secondary: 'hsl(210 40% 90%)' } },
  { name: 'dark', label: 'Dark', colors: { bg: 'hsl(215 30% 12%)', text: 'hsl(210 40% 98%)', primary: 'hsl(210 70% 50%)', secondary: 'hsl(215 20% 25%)' } },
  { name: 'blue', label: 'Blue', colors: { bg: 'hsl(220 60% 10%)', text: 'hsl(220 20% 95%)', primary: 'hsl(220 90% 60%)', secondary: 'hsl(220 40% 25%)' } },
  { name: 'green', label: 'Green', colors: { bg: 'hsl(140 60% 10%)', text: 'hsl(140 10% 95%)', primary: 'hsl(140 80% 50%)', secondary: 'hsl(140 40% 25%)' } },
  { name: 'purple', label: 'Purple', colors: { bg: 'hsl(280 60% 10%)', text: 'hsl(280 10% 95%)', primary: 'hsl(280 80% 60%)', secondary: 'hsl(280 40% 25%)' } },
];

export default function SettingsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [selectedTheme, setSelectedTheme] = useState<Theme>('light');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);
  
  useEffect(() => {
    if (user) {
      const fetchTheme = async () => {
        const themeRef = doc(db, 'users', user.uid, 'profile', 'theme');
        const themeSnap = await getDoc(themeRef);
        if (themeSnap.exists() && themeSnap.data().theme) {
          setSelectedTheme(themeSnap.data().theme);
        }
      };
      fetchTheme();
    }
  }, [user]);

  const handleThemeChange = (theme: Theme) => {
    setSelectedTheme(theme);
    document.body.className = '';
    if (theme !== 'light') {
        document.body.classList.add(theme === 'dark' ? 'dark' : `theme-${theme}`);
    }
  };

  const handleSaveChanges = async () => {
    if (!user) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'You must be logged in to save settings.',
        });
        return;
    }
    setIsSaving(true);
    try {
        const themeRef = doc(db, 'users', user.uid, 'profile', 'theme');
        await setDoc(themeRef, { theme: selectedTheme });
        toast({
            title: 'Settings Saved',
            description: 'Your theme has been updated successfully.',
        });
    } catch (error) {
        console.error("Error saving theme: ", error);
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Failed to save your theme. Please try again.',
        });
    } finally {
        setIsSaving(false);
    }
  };
  
  if (loading || !user) {
    return <div>Loading...</div>; // Or a spinner component
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-headline">Settings</h1>
        <p className="text-muted-foreground">Manage your application preferences.</p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Theme Customization</CardTitle>
          <CardDescription>Select a theme to personalize your experience. Your choice will be saved to your profile and applied across the app.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {themes.map((theme) => (
              <div key={theme.name} onClick={() => handleThemeChange(theme.name)} className="cursor-pointer">
                <div className={cn(
                  'rounded-lg border-2 p-2 transition-all',
                  selectedTheme === theme.name ? 'border-primary' : 'border-transparent hover:border-primary/50'
                )}>
                  <div className="space-y-1.5 rounded-md p-2" style={{ backgroundColor: theme.colors.bg }}>
                    <div className="space-y-1">
                      <div className="h-2 w-10 rounded-sm" style={{ backgroundColor: theme.colors.text }} />
                      <div className="h-2 w-16 rounded-sm" style={{ backgroundColor: theme.colors.text }} />
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <div className="h-4 w-4 rounded-full" style={{ backgroundColor: theme.colors.primary }} />
                      <div className="h-4 w-4 rounded-full" style={{ backgroundColor: theme.colors.secondary }} />
                    </div>
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-center gap-2">
                   {selectedTheme === theme.name && <Check className="h-4 w-4 text-primary" />}
                   <span className="text-sm font-medium">{theme.label}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 flex justify-end">
            <Button onClick={handleSaveChanges} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
