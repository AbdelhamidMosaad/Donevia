'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { collection, onSnapshot, query, orderBy, doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { WorkActivity, WorkTrackerSettingItem, WorkTrackerSettings as WorkTrackerSettingsType } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Briefcase, List, Calendar, Settings, PlusCircle, FileText } from 'lucide-react';
import { ActivityForm } from '@/components/work-tracker/activity-form';
import { ActivityTable } from '@/components/work-tracker/activity-table';
import { ActivityCalendar } from '@/components/work-tracker/activity-calendar';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { WorkTrackerSettings } from '@/components/work-tracker/tracker-settings';
import { useToast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type View = 'table' | 'calendar';
const colorPalette = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#FED766", "#2AB7CA", "#F0CF65", "#9B59B6", "#3498DB", "#1ABC9C", "#E74C3C"];

export default function WorkTrackerPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [activities, setActivities] = useState<WorkActivity[]>([]);
  const [view, setView] = useState<View>('table');
  const [settings, setSettings] = useState<WorkTrackerSettingsType>({
    appointmentOptions: [],
    categoryOptions: [],
    customerOptions: [],
  });

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);
  
  useEffect(() => {
    if (user) {
      const q = query(collection(db, 'users', user.uid, 'workActivities'), orderBy('date', 'desc'));
      const unsubscribeActivities = onSnapshot(q, (snapshot) => {
        const activitiesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WorkActivity));
        setActivities(activitiesData);
      });

      const settingsRef = doc(db, 'users', user.uid, 'profile', 'workTrackerSettings');
      const unsubscribeSettings = onSnapshot(settingsRef, (docSnap) => {
        if (docSnap.exists()) {
          setSettings(docSnap.data() as WorkTrackerSettingsType);
        }
      });
      
      return () => {
        unsubscribeActivities();
        unsubscribeSettings();
      };
    }
  }, [user]);

  const handleAddNewSettingItem = async (
    type: 'appointmentOptions' | 'categoryOptions' | 'customerOptions',
    value: string
  ) => {
    if (!user || !value) return;

    if (settings[type]?.some(item => item.value === value)) {
      toast({ variant: 'destructive', title: 'Item already exists' });
      return;
    }

    const newItem: WorkTrackerSettingItem = {
      id: uuidv4(),
      value,
      color: colorPalette[Math.floor(Math.random() * colorPalette.length)],
    };
    
    const settingsRef = doc(db, 'users', user.uid, 'profile', 'workTrackerSettings');

    try {
        const docSnap = await getDoc(settingsRef);
        let updatedSettings: WorkTrackerSettingsType;

        if (docSnap.exists()) {
            // Document exists, update it
            const currentSettings = docSnap.data() as WorkTrackerSettingsType;
            updatedSettings = {
                ...currentSettings,
                [type]: [...(currentSettings[type] || []), newItem],
            };
        } else {
            // Document doesn't exist, create it with the new item
            updatedSettings = {
                ownerId: user.uid, // Set ownerId on creation
                appointmentOptions: [],
                categoryOptions: [],
                customerOptions: [],
                [type]: [newItem],
            };
        }
        
      await setDoc(settingsRef, updatedSettings, { merge: true });
      toast({ title: 'New option added!', description: `"${value}" is now available.` });
    } catch (e) {
      console.error('Error adding new setting item:', e);
      toast({ variant: 'destructive', title: 'Error adding option' });
    }
  };


  if (loading || !user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-col h-full gap-6">
       <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
            <Briefcase className="h-8 w-8 text-primary"/>
            <div>
                <h1 className="text-3xl font-bold font-headline">Work Activity Tracker</h1>
                <p className="text-muted-foreground">Log and manage your daily work activities, appointments, and tasks.</p>
            </div>
        </div>
         <WorkTrackerSettings settings={settings} />
      </div>

       <Tabs defaultValue="log" className="flex-1 flex flex-col min-h-0">
            <TabsList>
                <TabsTrigger value="log"><PlusCircle className="mr-2 h-4 w-4"/> Log Activity</TabsTrigger>
                <TabsTrigger value="records"><FileText className="mr-2 h-4 w-4"/> View Records</TabsTrigger>
            </TabsList>
            
            <TabsContent value="log" className="flex-1 mt-4">
                 <Card>
                    <ActivityForm settings={settings} onAddNewItem={handleAddNewSettingItem} />
                </Card>
            </TabsContent>
            <TabsContent value="records" className="flex-1 flex flex-col min-h-0 mt-4">
                 <Card className="flex-1 flex flex-col min-h-0">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Recorded Activities</CardTitle>
                                <CardDescription>View your logged activities in a table or calendar format.</CardDescription>
                            </div>
                            <ToggleGroup type="single" value={view} onValueChange={(v: View) => v && setView(v)} aria-label="View toggle">
                                <ToggleGroupItem value="table" aria-label="Table view">
                                <List className="h-4 w-4" />
                                </ToggleGroupItem>
                                <ToggleGroupItem value="calendar" aria-label="Calendar view">
                                <Calendar className="h-4 w-4" />
                                </ToggleGroupItem>
                            </ToggleGroup>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1">
                        {view === 'table' ? <ActivityTable activities={activities} settings={settings} /> : <ActivityCalendar activities={activities} />}
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    </div>
  );
}
