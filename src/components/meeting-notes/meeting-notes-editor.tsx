'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { doc, updateDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { MeetingNote, Attendee, AgendaItem } from '@/lib/types';
import { DocEditor } from '@/components/docs/doc-editor';
import { Input } from '../ui/input';
import moment from 'moment';
import { Button } from '../ui/button';
import { Trash2, UserPlus, ListPlus, Download, FileText } from 'lucide-react';
import { useDebouncedCallback } from 'use-debounce';
import { v4 as uuidv4 } from 'uuid';


interface MeetingNotesEditorProps {
  note: MeetingNote;
}

export function MeetingNotesEditor({ note: initialNote }: MeetingNotesEditorProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [note, setNote] = useState(initialNote);
  const [editorInstance, setEditorInstance] = useState<any>(null);


  const debouncedSave = useDebouncedCallback(async (updatedNote: Partial<MeetingNote>) => {
    if (!user) return;
    const noteRef = doc(db, 'users', user.uid, 'meetingNotes', note.id);
    try {
      await updateDoc(noteRef, {
        ...updatedNote,
        updatedAt: serverTimestamp(),
      });
      toast({ title: '✓ Saved' });
    } catch (e) {
      console.error("Error saving note:", e);
      toast({ variant: 'destructive', title: 'Error saving note.' });
    }
  }, 1500);

  const handleFieldChange = <K extends keyof MeetingNote>(field: K, value: MeetingNote[K]) => {
    const updatedNote = { ...note, [field]: value };
    setNote(updatedNote);
    debouncedSave({ [field]: value });
  };
  
  const handleAttendeeChange = (attendeeId: string, field: 'name' | 'email', value: string) => {
      const updatedAttendees = note.attendees.map(a => a.id === attendeeId ? {...a, [field]: value} : a);
      handleFieldChange('attendees', updatedAttendees);
  }
  
  const handleAddAttendee = () => {
      const newAttendee: Attendee = { id: uuidv4(), name: '', email: '' };
      handleFieldChange('attendees', [...note.attendees, newAttendee]);
  }
  
  const handleRemoveAttendee = (attendeeId: string) => {
      const updatedAttendees = note.attendees.filter(a => a.id !== attendeeId);
      handleFieldChange('attendees', updatedAttendees);
  }

  const handleAgendaChange = (itemId: string, field: 'topic' | 'presenter' | 'time', value: string | number) => {
      const updatedAgenda = note.agenda.map(item => item.id === itemId ? {...item, [field]: value} : item);
      handleFieldChange('agenda', updatedAgenda);
  }

  const handleAddAgendaItem = () => {
      const newAgendaItem: AgendaItem = { id: uuidv4(), topic: '', presenter: '', time: 15, isCompleted: false };
      handleFieldChange('agenda', [...note.agenda, newAgendaItem]);
  }

  const handleRemoveAgendaItem = (itemId: string) => {
      const updatedAgenda = note.agenda.filter(item => item.id !== itemId);
      handleFieldChange('agenda', updatedAgenda);
  }
  
   const handleExportPDF = () => {
    toast({ variant: 'destructive', title: 'PDF Export is currently unavailable.'});
  };


  return (
    <div className="h-full flex flex-col md:grid md:grid-cols-[1fr_350px] gap-4">
        <div className="flex-1 min-h-0 order-2 md:order-1">
            <DocEditor 
                doc={{
                    ...note,
                    content: note.notes,
                    ownerId: note.ownerId,
                }} 
                onEditorInstance={(instance) => setEditorInstance(instance)}
            />
        </div>
        <div className="order-1 md:order-2 space-y-4 p-4 border-l bg-card">
            <div className="flex justify-between items-center">
                 <h2 className="text-xl font-bold font-headline">Meeting Details</h2>
                 <Button variant="outline" onClick={handleExportPDF}>
                    <Download /> Export PDF
                </Button>
            </div>
            <div>
                <label className="text-sm font-medium">Meeting Title</label>
                <Input
                    value={note.title}
                    onChange={(e) => handleFieldChange('title', e.target.value)}
                    className="text-lg font-semibold"
                />
            </div>
             <div>
                <label className="text-sm font-medium">Date</label>
                <Input
                    type="date"
                    value={moment(note.date.toDate()).format('YYYY-MM-DD')}
                    onChange={(e) => handleFieldChange('date', Timestamp.fromDate(new Date(e.target.value)))}
                />
            </div>
             <div className="space-y-2">
                <label className="text-sm font-medium">Attendees</label>
                {note.attendees.map(attendee => (
                    <div key={attendee.id} className="flex items-center gap-2">
                        <Input value={attendee.name} placeholder="Name" onChange={e => handleAttendeeChange(attendee.id, 'name', e.target.value)} />
                        <Input value={attendee.email} placeholder="Email" onChange={e => handleAttendeeChange(attendee.id, 'email', e.target.value)} />
                        <Button variant="ghost" size="icon" onClick={() => handleRemoveAttendee(attendee.id)}><Trash2 className="h-4 w-4"/></Button>
                    </div>
                ))}
                <Button variant="outline" size="sm" onClick={handleAddAttendee}><UserPlus /> Add Attendee</Button>
            </div>
            <div className="space-y-2">
                <label className="text-sm font-medium">Agenda</label>
                 {note.agenda.map(item => (
                    <div key={item.id} className="flex items-center gap-2">
                        <Input value={item.topic} placeholder="Topic" onChange={e => handleAgendaChange(item.id, 'topic', e.target.value)} />
                        <Input value={item.presenter} placeholder="Presenter" className="w-32" onChange={e => handleAgendaChange(item.id, 'presenter', e.target.value)} />
                        <Input value={item.time} type="number" className="w-20" onChange={e => handleAgendaChange(item.id, 'time', Number(e.target.value))} />
                        <Button variant="ghost" size="icon" onClick={() => handleRemoveAgendaItem(item.id)}><Trash2 className="h-4 w-4"/></Button>
                    </div>
                ))}
                 <Button variant="outline" size="sm" onClick={handleAddAgendaItem}><ListPlus /> Add Agenda Item</Button>
            </div>
        </div>
    </div>
  );
}
