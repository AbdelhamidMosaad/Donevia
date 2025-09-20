
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sun, Moon, Palette, Type, Check, Bell, PanelLeft, User, Database, RefreshCcw, Landmark } from 'lucide-react';
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
import type { UserSettings, Currency } from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Button } from './ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { cva } from 'class-variance-authority';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';


type Theme = UserSettings['theme'];
type Font = UserSettings['font'];


const themes: { name: Theme; label: string; icon: React.ReactNode; colors: { bg: string; text: string; primary: string; secondary: string } }[] = [
  { name: 'light', label: 'Light', icon: <Sun className="h-5 w-5" />, colors: { bg: 'hsl(0 0% 100%)', text: 'hsl(215 40% 15%)', primary: 'hsl(206 65% 45%)', secondary: 'hsl(210 40% 96%)' } },
  { name: 'dark', label: 'Dark', icon: <Moon className="h-5 w-5" />, colors: { bg: 'hsl(215 30% 12%)', text: 'hsl(210 40% 98%)', primary: 'hsl(210 70% 50%)', secondary: 'hsl(215 20% 25%)' } },
  { name: 'theme-indigo', label: 'Indigo', icon: <Palette className="h-5 w-5" />, colors: { bg: 'hsl(242 30% 18%)', text: 'hsl(242 70% 95%)', primary: 'hsl(242 70% 65%)', secondary: 'hsl(242 30% 28%)' } },
  { name: 'theme-purple', label: 'Purple', icon: <Palette className="h-5 w-5" />, colors: { bg: 'hsl(279 30% 18%)', text: 'hsl(279 70% 95%)', primary: 'hsl(279 65% 70%)', secondary: 'hsl(279 30% 28%)' } },
  { name: 'theme-green', label: 'Green', icon: <Palette className="h-5 w-5" />, colors: { bg: 'hsl(145 30% 15%)', text: 'hsl(145 60% 95%)', primary: 'hsl(145 60% 45%)', secondary: 'hsl(145 30% 25%)' } },
  { name: 'theme-sunset', label: 'Sunset', icon: <Palette className="h-5 w-5" />, colors: { bg: 'hsl(20 100% 98%)', text: 'hsl(20 30% 25%)', primary: 'hsl(20 100% 65%)', secondary: 'hsl(20 100% 92%)' } },
  { name: 'theme-mint', label: 'Mint', icon: <Palette className="h-5 w-5" />, colors: { bg: 'hsl(150 25% 15%)', text: 'hsl(150 100% 90%)', primary: 'hsl(150 100% 70%)', secondary: 'hsl(150 25% 25%)' } },
  { name: 'theme-jade', label: 'Jade', icon: <Palette className="h-5 w-5" />, colors: { bg: 'hsl(158 30% 97%)', text: 'hsl(158 25% 25%)', primary: 'hsl(158 45% 57%)', secondary: 'hsl(158 30% 90%)' } },
  { name: 'theme-periwinkle', label: 'Periwinkle', icon: <Palette className="h-5 w-5" />, colors: { bg: 'hsl(233 35% 20%)', text: 'hsl(233 50% 95%)', primary: 'hsl(233 33% 62%)', secondary: 'hsl(233 35% 30%)' } },
  { name: 'theme-sky', label: 'Sky', icon: <Palette className="h-5 w-5" />, colors: { bg: 'hsl(195 40% 96%)', text: 'hsl(195 30% 25%)', primary: 'hsl(195 45% 73%)', secondary: 'hsl(195 40% 90%)' } },
  { name: 'theme-orchid', label: 'Orchid', icon: <Palette className="h-5 w-5" />, colors: { bg: 'hsl(319 70% 15%)', text: 'hsl(319 60% 95%)', primary: 'hsl(319 71% 35%)', secondary: 'hsl(319 70% 25%)' } },
  { name: 'theme-sage', label: 'Sage', icon: <Palette className="h-5 w-5" />, colors: { bg: 'hsl(161 10% 98%)', text: 'hsl(161 10% 25%)', primary: 'hsl(161 9% 55%)', secondary: 'hsl(161 10% 92%)' } },
  { name: 'theme-coral', label: 'Coral', icon: <Palette className="h-5 w-5" />, colors: { bg: 'hsl(0 50% 18%)', text: 'hsl(0 40% 95%)', primary: 'hsl(0 62% 64%)', secondary: 'hsl(0 50% 28%)' } },
  { name: 'theme-pastel', label: 'Pastel', icon: <Palette className="h-5 w-5" />, colors: { bg: 'hsl(187 25% 95%)', text: 'hsl(187 15% 30%)', primary: 'hsl(193 94% 75%)', secondary: 'hsl(187 20% 90%)' } },
  { name: 'theme-oceanic', label: 'Oceanic', icon: <Palette className="h-5 w-5" />, colors: { bg: 'hsl(187 30% 15%)', text: 'hsl(187 20% 95%)', primary: 'hsl(187 78% 38%)', secondary: 'hsl(187 30% 25%)' } },
  { name: 'theme-sunset-glow', label: 'Sunset Glow', icon: <Palette className="h-5 w-5" />, colors: { bg: 'hsl(40 30% 10%)', text: 'hsl(40 50% 95%)', primary: 'hsl(40 99% 54%)', secondary: 'hsl(40 30% 20%)' } },
  { name: 'theme-vibrant', label: 'Vibrant', icon: <Palette className="h-5 w-5" />, colors: { bg: 'hsl(333 20% 96%)', text: 'hsl(333 15% 25%)', primary: 'hsl(333 83% 67%)', secondary: 'hsl(333 15% 92%)' } },
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
    { name: 'bahnschrift', label: 'Bahnschrift', variable: 'Bahnschrift, sans-serif' },
];

const currencies: { value: Currency; label: string }[] = [
    { value: 'USD', label: 'USD - US Dollar' },
    { value: 'EUR', label: 'EUR - Euro' },
    { value: 'GBP', label: 'GBP - British Pound' },
    { value: 'JPY', label: 'JPY - Japanese Yen' },
    { value: 'EGP', label: 'EGP - Egyptian Pound' },
];

const fontVariables: Record<Font, string> = fonts.reduce((acc, font) => {
    acc[font.name] = font.variable;
    return acc;
}, {} as Record<Font, string>);

const defaultSettings: UserSettings = {
    theme: 'light',
    font: 'inter',
    sidebarVariant: 'sidebar',
    sidebarOpen: true,
    notificationSound: true,
    taskListsView: 'card',
    docsView: 'card',
    notesView: 'board',
    studyTrackerView: 'card',
    listViews: {},
    tableColumns: {},
    sidebarOrder: [],
    currency: 'USD',
    studyProfile: {
        currentStreak: 0,
        longestStreak: 0,
        lastStudyDay: '',
        level: 1,
        experiencePoints: 0,
        earnedBadges: [],
    }
};


export function SettingsDialog({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);

  useEffect(() => {
    if (user && open) {
      const fetchSettings = async () => {
        const settingsRef = doc(db, 'users', user.uid, 'profile', 'settings');
        const settingsSnap = await getDoc(settingsRef);
        if (settingsSnap.exists() && settingsSnap.data()) {
          const data = settingsSnap.data();
          setSettings({
            ...defaultSettings,
            ...data
          });
        } else {
            setSettings(defaultSettings);
        }
      };
      fetchSettings();
    }
  }, [user, open]);
  
  const applyStyling = (newSettings: Partial<UserSettings>) => {
    const body = document.body;
    
    if (newSettings.theme) {
        const themeClassesToRemove = themes.map(t => t.name);
        body.classList.remove(...themeClassesToRemove);
        body.classList.add(newSettings.theme);
    }

    if (newSettings.font) {
        const fontVariable = fontVariables[newSettings.font];
        if (fontVariable) {
            document.body.style.fontFamily = fontVariable;
        }
    }
  };
  
  const savePreferences = async (newSettings: Partial<UserSettings>) => {
    if (!user) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'You must be logged in to save settings.',
        });
        return;
    }
    
    setSettings(currentSettings => ({...currentSettings, ...newSettings}));
    applyStyling(newSettings);

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


  const handleSidebarChange = (isOpen: boolean) => {
    savePreferences({ sidebarOpen: isOpen });
  }

  const handleNotificationSoundChange = (enabled: boolean) => {
    savePreferences({ notificationSound: enabled });
  }
  
  const handleResetSidebar = async () => {
    if (!user) return;
    try {
        const settingsRef = doc(db, 'users', user.uid, 'profile', 'settings');
        await updateDoc(settingsRef, { sidebarOrder: [] });
        toast({ title: 'Sidebar layout reset to default.'});
    } catch(e) {
        toast({ variant: 'destructive', title: 'Error resetting sidebar layout.'});
    }
  }

  const handleResetSettings = async () => {
    if (!user) return;
    try {
        // We delete the doc so it regenerates on next fetch
        const settingsRef = doc(db, 'users', user.uid, 'profile', 'settings');
        await deleteDoc(settingsRef);
        setSettings(defaultSettings);
        applyStyling({ theme: defaultSettings.theme, font: defaultSettings.font });
        toast({
            title: 'Settings Reset',
            description: 'Your application settings have been restored to their defaults.',
        });
        window.location.reload();
    } catch (error) {
         console.error("Error resetting settings: ", error);
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Failed to reset settings. Please try again.',
        });
    }
  };
  
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
                        <CardTitle className="flex items-center gap-2"><Palette/> App Theme</CardTitle>
                        <CardDescription>Select a theme to personalize your experience.</CardDescription>
                        </CardHeader>
                        <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-4">
                            {themes.map((theme) => (
                            <div key={theme.name} onClick={() => savePreferences({ theme: theme.name })} className="cursor-pointer group">
                                <div className={cn(
                                'rounded-lg border-2 p-2 transition-all',
                                settings.theme === theme.name ? 'border-primary' : 'border-border/50 hover:border-primary/50'
                                )}>
                                <div className="space-y-1.5 rounded-md p-2 flex flex-col items-center justify-center aspect-square" style={{ backgroundColor: theme.colors.bg, color: theme.colors.text }}>
                                    <div className="flex items-center justify-center h-10 w-10 rounded-full mb-2" style={{backgroundColor: theme.colors.secondary}}>
                                        {theme.icon}
                                    </div>
                                    <div className="space-y-1">
                                    <div className="h-1.5 w-12 rounded-sm" style={{ backgroundColor: theme.colors.primary }} />
                                    <div className="h-1.5 w-16 rounded-sm" style={{ backgroundColor: theme.colors.primary }} />
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
                            <Select value={settings.font} onValueChange={(v: Font) => savePreferences({ font: v })}>
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
                        <CardTitle className="flex items-center gap-2"><Landmark /> Currency</CardTitle>
                        <CardDescription>Choose the default currency for financial values.</CardDescription>
                        </CardHeader>
                        <CardContent>
                        <div className="w-full max-w-sm">
                            <Label htmlFor="currency-select">Currency</Label>
                            <Select value={settings.currency} onValueChange={(v: Currency) => savePreferences({ currency: v })}>
                                <SelectTrigger id="currency-select">
                                    <SelectValue placeholder="Select a currency" />
                                </SelectTrigger>
                                <SelectContent>
                                    {currencies.map(c => (
                                        <SelectItem key={c.value} value={c.value}>
                                            {c.label}
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
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="sidebar-switch">Open by Default</Label>
                                <Switch
                                    id="sidebar-switch"
                                    checked={settings.sidebarOpen}
                                    onCheckedChange={handleSidebarChange}
                                />
                            </div>
                             <div className="flex items-center justify-between pt-4 border-t">
                                <div>
                                    <h3 className="font-medium">Reset Sidebar Layout</h3>
                                    <p className="text-sm text-muted-foreground">Restore the sidebar item order to the default layout.</p>
                                </div>
                                 <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="outline">
                                            Reset Layout
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This will reset the sidebar layout to its default order.
                                        </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                            onClick={handleResetSidebar}
                                        >
                                            Yes, reset layout
                                        </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
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
                            <CardDescription>Export your data or reset settings to default.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-medium">Reset All Settings</h3>
                                    <p className="text-sm text-muted-foreground">This will restore all application settings to their original defaults. This action cannot be undone.</p>
                                </div>
                                 <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="destructive">
                                            <RefreshCcw className="mr-2 h-4 w-4" />
                                            Reset Settings
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This will reset all application settings to their default values. Any customizations you've made will be lost.
                                        </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                            onClick={handleResetSettings}
                                            className={buttonVariants({ variant: "destructive" })}
                                        >
                                            Yes, reset everything
                                        </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        </CardContent>
                    </Card>
                 </TabsContent>

            </div>

        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)
