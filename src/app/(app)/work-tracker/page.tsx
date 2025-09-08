
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { collection, onSnapshot, query, orderBy, doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { WorkActivity, WorkTrackerSettings as WorkTrackerSettingsType } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Briefcase, List, Calendar, Settings } from 'lucide-react';
import { ActivityForm } from '@/components/work-tracker/activity-form';
import { ActivityTable } from '@/components/work-tracker/activity-table';
import { ActivityCalendar } from '@/components/work-tracker/activity-calendar';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Card } from '@/components/ui/card';
import { WorkTrackerSettings } from '@/components/work-tracker/tracker-settings';
import { useToast } from '@/hooks/use-toast';


type View = 'table' | 'calendar';

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

    if (settings[type]?.includes(value)) {
      toast({ variant: 'destructive', title: 'Item already exists' });
      return;
    }

    const updatedSettings = {
      ...settings,
      [type]: [...(settings[type] || []), value],
    };

    const settingsRef = doc(db, 'users', user.uid, 'profile', 'workTrackerSettings');
    try {
      await setDoc(settingsRef, updatedSettings, { merge: true });
      toast({ title: 'New option added!', description: `"${value}" is now available.` });
    } catch (e) {
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
        <div className="flex items-center gap-2">
            <WorkTrackerSettings settings={settings} />
            <ToggleGroup type="single" value={view} onValueChange={(v: View) => v && setView(v)} aria-label="View toggle">
              <ToggleGroupItem value="table" aria-label="Table view">
                <List className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="calendar" aria-label="Calendar view">
                <Calendar className="h-4 w-4" />
              </ToggleGroupItem>
            </ToggleGroup>
        </div>
      </div>

      <Card>
        <ActivityForm settings={settings} onAddNewItem={handleAddNewSettingItem} />
      </Card>

      <div className="flex-1">
        {view === 'table' ? <ActivityTable activities={activities} settings={settings} /> : <ActivityCalendar activities={activities} />}
      </div>
    </div>
  );
}
