
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Sun, Moon, Palette, Type } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

type Theme = 'light' | 'dark' | 'theme-indigo' | 'theme-purple' | 'theme-green';
type Font = 'inter' | 'roboto' | 'open-sans' | 'lato' | 'poppins' | 'source-sans-pro' | 'nunito' | 'montserrat' | 'playfair-display' | 'jetbrains-mono';

const themes: { name: Theme; label: string; icon: React.ReactNode; colors: { bg: string; text: string; primary: string; secondary: string } }[] = [
  { name: 'light', label: 'Light', icon: <Sun className="h-5 w-5" />, colors: { bg: 'hsl(210 100% 95%)', text: 'hsl(215 40% 15%)', primary: 'hsl(175 42% 64%)', secondary: 'hsl(210 40% 90%)' } },
  { name: 'dark', label: 'Dark', icon: <Moon className="h-5 w-5" />, colors: { bg: 'hsl(215 30% 12%)', text: 'hsl(210 40% 98%)', primary: 'hsl(210 70% 50%)', secondary: 'hsl(215 20% 25%)' } },
  { name: 'theme-indigo', label: 'Indigo', icon: <Palette className="h-5 w-5" />, colors: { bg: 'hsl(232 46% 16%)', text: 'hsl(230 80% 98%)', primary: 'hsl(234 65% 26%)', secondary: 'hsl(232 46% 28%)' } },
  { name: 'theme-purple', label: 'Purple', icon: <Palette className="h-5 w-5" />, colors: { bg: 'hsl(279 40% 15%)', text: 'hsl(280 80% 98%)', primary: 'hsl(279 65% 40%)', secondary: 'hsl(279 40% 27%)' } },
  { name: 'theme-green', label: 'Green', icon: <Palette className="h-5 w-5" />, colors: { bg: 'hsl(145 25% 15%)', text: 'hsl(145 60% 98%)', primary: 'hsl(145 38% 25%)', secondary: 'hsl(145 25% 26%)' } },
];

const fonts: { name: Font; label: string; variable: string }[] = [
    { name: 'inter', label: 'Inter', variable: 'font-inter' },
    { name: 'roboto', label: 'Roboto', variable: 'font-roboto' },
    { name: 'open-sans', label: 'Open Sans', variable: 'font-open-sans' },
    { name: 'lato', label: 'Lato', variable: 'font-lato' },
    { name: 'poppins', label: 'Poppins', variable: 'font-poppins' },
    { name: 'source-sans-pro', label: 'Source Sans Pro', variable: 'font-source-sans-pro' },
    { name: 'nunito', label: 'Nunito', variable: 'font-nunito' },
    { name: 'montserrat', label: 'Montserrat', variable: 'font-montserrat' },
    { name: 'playfair-display', label: 'Playfair Display', variable: 'font-playfair-display' },
    { name: 'jetbrains-mono', label: 'JetBrains Mono', variable: 'font-jetbrains-mono' },
];

export function SettingsDialog({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<Theme>('light');
  const [selectedFont, setSelectedFont] = useState<Font>('inter');
  const [isSaving, setIsSaving] = useState(false);
  const [initialTheme, setInitialTheme] = useState<Theme>('light');
  const [initialFont, setInitialFont] = useState<Font>('inter');

  useEffect(() => {
    if (user && open) {
      const fetchSettings = async () => {
        const settingsRef = doc(db, 'users', user.uid, 'profile', 'settings');
        const settingsSnap = await getDoc(settingsRef);
        if (settingsSnap.exists() && settingsSnap.data()) {
          const { theme, font } = settingsSnap.data();
          if (theme) {
            setSelectedTheme(theme);
            setInitialTheme(theme);
            applyTheme(theme);
          }
          if (font) {
            setSelectedFont(font);
            setInitialFont(font);
            applyFont(font);
          }
        }
      };
      fetchSettings();
    }
  }, [user, open]);
  
  const applyTheme = (theme: Theme) => {
    const body = document.body;
    const currentFont = body.style.fontFamily;
    // Remove only theme-related classes
    body.className = body.className.split(' ').filter(c => !c.startsWith('theme-') && c !== 'light' && c !== 'dark').join(' ');
    
    if (theme) {
      body.classList.add(theme);
    }
    body.style.fontFamily = currentFont;
  };
  
  const applyFont = (font: Font) => {
    document.body.style.fontFamily = `var(--font-${font})`;
  }

  const handleThemeChange = (theme: Theme) => {
    setSelectedTheme(theme);
    applyTheme(theme);
  };

  const handleFontChange = (font: Font) => {
    setSelectedFont(font);
    applyFont(font);
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
        const settingsRef = doc(db, 'users', user.uid, 'profile', 'settings');
        await setDoc(settingsRef, { theme: selectedTheme, font: selectedFont }, { merge: true });
        setInitialTheme(selectedTheme);
        setInitialFont(selectedFont);
        toast({
            title: 'Settings Saved',
            description: 'Your new preferences have been saved.',
        });
        setOpen(false); // Close dialog on success
    } catch (error) {
        console.error("Error saving settings: ", error);
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Failed to save your settings. Please try again.',
        });
    } finally {
        setIsSaving(false); // Reset button state
    }
  };

  const handleCancelChanges = () => {
    setSelectedTheme(initialTheme);
    setSelectedFont(initialFont);
    applyTheme(initialTheme);
    applyFont(initialFont);
    setOpen(false);
  };
  
  const onOpenChange = (isOpen: boolean) => {
    if (!isOpen && !isSaving) {
        handleCancelChanges();
    }
    setOpen(isOpen);
  }

  if (loading) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>Manage your application preferences.</DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
             <Card>
                <CardHeader>
                <CardTitle className="flex items-center gap-2"><Type /> Typography System</CardTitle>
                <CardDescription>Choose the font that best suits your reading preference.</CardDescription>
                </CardHeader>
                <CardContent>
                <div className="w-full max-w-sm">
                    <Label htmlFor="font-select">Font Family</Label>
                    <Select value={selectedFont} onValueChange={(v: Font) => handleFontChange(v)}>
                        <SelectTrigger id="font-select">
                            <SelectValue placeholder="Select a font" />
                        </SelectTrigger>
                        <SelectContent>
                            {fonts.map(font => (
                                <SelectItem key={font.name} value={font.name}>
                                    <span style={{ fontFamily: `var(--font-${font.name})` }}>{font.label}</span>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                </CardContent>
            </Card>
            
            <Card>
                <CardHeader>
                <CardTitle className="flex items-center gap-2"><Palette/> Theme Engine</CardTitle>
                <CardDescription>Select a theme to personalize your experience.</CardDescription>
                </CardHeader>
                <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-4">
                    {themes.map((theme) => (
                    <div key={theme.name} onClick={() => handleThemeChange(theme.name)} className="cursor-pointer group">
                        <div className={cn(
                        'rounded-lg border-2 p-2 transition-all',
                        selectedTheme === theme.name ? 'border-primary' : 'border-border/50 hover:border-primary/50'
                        )}>
                        <div className="space-y-1.5 rounded-md p-2 flex flex-col items-center justify-center aspect-square" style={{ backgroundColor: theme.colors.bg }}>
                            <div className="flex items-center justify-center h-10 w-10 rounded-full mb-2" style={{backgroundColor: theme.colors.secondary}}>
                                {theme.icon}
                            </div>
                            <div className="space-y-1">
                            <div className="h-1.5 w-12 rounded-sm" style={{ backgroundColor: theme.colors.text }} />
                            <div className="h-1.5 w-16 rounded-sm" style={{ backgroundColor: theme.colors.text }} />
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
                </CardContent>
            </Card>
        </div>

        <DialogFooter>
          <Button onClick={handleCancelChanges} variant="outline" disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSaveChanges} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

    