
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sun, Moon, Palette, Type, Check, Bell, PanelLeft, User, Database } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { NotificationSettings } from './notification-settings';
import { Switch } from './ui/switch';
import type { UserSettings } from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

type Theme = UserSettings['theme'];
type Font = UserSettings['font'];


const themes: { name: Theme; label: string; icon: React.ReactNode; colors: { bg: string; text: string; primary: string; secondary: string } }[] = [
  { name: 'light', label: 'Light', icon: <Sun className="h-5 w-5" />, colors: { bg: 'hsl(210 100% 95%)', text: 'hsl(215 40% 15%)', primary: 'hsl(175 42% 64%)', secondary: 'hsl(210 40% 90%)' } },
  { name: 'dark', label: 'Dark', icon: <Moon className="h-5 w-5" />, colors: { bg: 'hsl(215 30% 12%)', text: 'hsl(210 40% 98%)', primary: 'hsl(210 70% 50%)', secondary: 'hsl(215 20% 25%)' } },
  { name: 'theme-indigo', label: 'Indigo', icon: <Palette className="h-5 w-5" />, colors: { bg: 'hsl(232 46% 16%)', text: 'hsl(230 80% 98%)', primary: 'hsl(234 65% 26%)', secondary: 'hsl(232 46% 28%)' } },
  { name: 'theme-purple', label: 'Purple', icon: <Palette className="h-5 w-5" />, colors: { bg: 'hsl(279 40% 15%)', text: 'hsl(280 80% 98%)', primary: 'hsl(279 65% 40%)', secondary: 'hsl(279 40% 27%)' } },
  { name: 'theme-green', label: 'Green', icon: <Palette className="h-5 w-5" />, colors: { bg: 'hsl(145 25% 15%)', text: 'hsl(145 60% 98%)', primary: 'hsl(145 38% 25%)', secondary: 'hsl(145 25% 26%)' } },
];

const fonts: { name: Font; label: string; variable: string }[] = [
    { name: 'inter', label: 'Inter', variable: 'var(--font-inter)' },
    { name: 'roboto', label: 'Roboto', variable: 'var(--font-roboto)' },
    { name: 'open-sans', label: 'Open Sans', variable: 'var(--font-open-sans)' },
    { name: 'lato', label: 'Lato', variable: 'var(--font-lato)' },
    { name: 'poppins', label: 'Poppins', variable: 'var(--font-poppins)' },
    { name: 'source-sans-pro', label: 'Source Sans Pro', variable: 'var(--font-source-sans-pro)' },
    { name: 'nunito', label: 'Nunito', variable: 'var(--font-nunito)' },
    { name: 'montserrat', label: 'Montserrat', variable: 'var(--font-montserrat)' },
    { name: 'playfair-display', label: 'Playfair Display', variable: 'var(--font-playfair-display)' },
    { name: 'jetbrains-mono', label: 'JetBrains Mono', variable: 'var(--font-jetbrains-mono)' },
];

const fontVariables: Record<Font, string> = fonts.reduce((acc, font) => {
    acc[font.name] = font.variable;
    return acc;
}, {} as Record<Font, string>);


export function SettingsDialog({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState<UserSettings>({
      theme: 'light',
      font: 'inter',
      sidebarOpen: true,
      notificationSound: true,
  });

  useEffect(() => {
    if (user && open) {
      const fetchSettings = async () => {
        const settingsRef = doc(db, 'users', user.uid, 'profile', 'settings');
        const settingsSnap = await getDoc(settingsRef);
        if (settingsSnap.exists() && settingsSnap.data()) {
          const data = settingsSnap.data();
          setSettings({
            theme: data.theme || 'light',
            font: data.font || 'inter',
            sidebarOpen: data.sidebarOpen !== false,
            notificationSound: data.notificationSound !== false,
          });
        }
      };
      fetchSettings();
    }
  }, [user, open]);
  
  const applyTheme = (theme: Theme) => {
    const body = document.body;
    const currentFontFamily = body.style.fontFamily;
    body.className = body.className.split(' ').filter(c => !c.startsWith('theme-') && c !== 'light' && c !== 'dark' && !c.startsWith('font-')).join(' ');
    
    if (theme) {
      body.classList.add(theme);
    }
    body.style.fontFamily = currentFontFamily;
  };
  
  const applyFont = (font: Font) => {
    const fontVariable = fontVariables[font];
    if (fontVariable) {
        document.body.style.fontFamily = fontVariable;
    }
  }

  const savePreferences = async (newSettings: Partial<UserSettings>) => {
    if (!user) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'You must be logged in to save settings.',
        });
        return;
    }
    try {
        const settingsRef = doc(db, 'users', user.uid, 'profile', 'settings');
        await setDoc(settingsRef, newSettings, { merge: true });
        toast({
            title: 'Settings Saved',
            description: 'Your new preferences have been saved.',
        });
    } catch (error) {
        console.error("Error saving settings: ", error);
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Failed to save your settings. Please try again.',
        });
    }
  };


  const handleThemeChange = (theme: Theme) => {
    setSettings(s => ({...s, theme}));
    applyTheme(theme);
    savePreferences({ theme });
  };

  const handleFontChange = (font: Font) => {
    setSettings(s => ({...s, font}));
    applyFont(font);
    savePreferences({ font });
  };

  const handleSidebarChange = (isOpen: boolean) => {
    setSettings(s => ({...s, sidebarOpen: isOpen}));
    savePreferences({ sidebarOpen: isOpen });
  }

  const handleNotificationSoundChange = (enabled: boolean) => {
    setSettings(s => ({...s, notificationSound: enabled}));
    savePreferences({ notificationSound: enabled });
  }
  
  if (loading) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>Manage your application preferences.</DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="general" className="flex-1 min-h-0 flex flex-col">
            <TabsList className="shrink-0">
                <TabsTrigger value="general"><Palette className="mr-2 h-4 w-4"/>General</TabsTrigger>
                <TabsTrigger value="notifications"><Bell className="mr-2 h-4 w-4"/>Notifications</TabsTrigger>
                <TabsTrigger value="account"><User className="mr-2 h-4 w-4"/>Account</TabsTrigger>
                <TabsTrigger value="data"><Database className="mr-2 h-4 w-4"/>Data</TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto mt-4 pr-4">
                <TabsContent value="general" className="space-y-6">
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
                                settings.theme === theme.name ? 'border-primary' : 'border-border/50 hover:border-primary/50'
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
                                {settings.theme === theme.name && <Check className="h-4 w-4 text-primary" />}
                                <span className="text-sm font-medium">{theme.label}</span>
                                </div>
                            </div>
                            ))}
                        </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Type /> Typography System</CardTitle>
                        <CardDescription>Choose the font that best suits your reading preference.</CardDescription>
                        </CardHeader>
                        <CardContent>
                        <div className="w-full max-w-sm">
                            <Label htmlFor="font-select">Font Family</Label>
                            <Select value={settings.font} onValueChange={(v: Font) => handleFontChange(v)}>
                                <SelectTrigger id="font-select">
                                    <SelectValue placeholder="Select a font" />
                                </SelectTrigger>
                                <SelectContent>
                                    {fonts.map(font => (
                                        <SelectItem key={font.name} value={font.name}>
                                            <span style={{ fontFamily: font.variable }}>{font.label}</span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                        <CardTitle className="flex items-center gap-2"><PanelLeft /> Sidebar</CardTitle>
                        <CardDescription>Customize the behavior of the main sidebar.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <Label htmlFor="sidebar-switch">Open by Default</Label>
                                <Switch
                                    id="sidebar-switch"
                                    checked={settings.sidebarOpen}
                                    onCheckedChange={handleSidebarChange}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="notifications">
                    <NotificationSettings 
                        soundEnabled={settings.notificationSound}
                        onSoundChange={handleNotificationSoundChange}
                    />
                </TabsContent>

                 <TabsContent value="account">
                    <Card>
                        <CardHeader>
                            <CardTitle>Account Information</CardTitle>
                            <CardDescription>Manage your account details. (Coming Soon)</CardDescription>
                        </CardHeader>
                    </Card>
                 </TabsContent>
                 <TabsContent value="data">
                    <Card>
                        <CardHeader>
                            <CardTitle>Data Management</CardTitle>
                            <CardDescription>Export your data. (Coming Soon)</CardDescription>
                        </CardHeader>
                    </Card>
                 </TabsContent>

            </div>

        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
