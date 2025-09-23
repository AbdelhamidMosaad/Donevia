
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
import { Trash2, UserPlus, ListPlus, Download } from 'lucide-react';
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
  
  const handleAttendeeChange = (attendeeId: string, field: 'name' | 'email' | 'jobTitle', value: string) => {
      const updatedAttendees = note.attendees.map(a => a.id === attendeeId ? {...a, [field]: value} : a);
      handleFieldChange('attendees', updatedAttendees);
  }
  
  const handleAddAttendee = () => {
      const newAttendee: Attendee = { id: uuidv4(), name: '', email: '', jobTitle: '' };
      handleFieldChange('attendees', [...note.attendees, newAttendee]);
  }
  
  const handleRemoveAttendee = (attendeeId: string) => {
      const updatedAttendees = note.attendees.filter(a => a.id !== attendeeId);
      handleFieldChange('attendees', updatedAttendees);
  }

  const handleAgendaChange = (itemId: string, field: 'topic', value: string) => {
      const updatedAgenda = note.agenda.map(item => item.id === itemId ? {...item, [field]: value} : item);
      handleFieldChange('agenda', updatedAgenda);
  }

  const handleAddAgendaItem = () => {
      const newAgendaItem: AgendaItem = { id: uuidv4(), topic: '', isCompleted: false };
      handleFieldChange('agenda', [...note.agenda, newAgendaItem]);
  }

  const handleRemoveAgendaItem = (itemId: string) => {
      const updatedAgenda = note.agenda.filter(item => item.id !== itemId);
      handleFieldChange('agenda', updatedAgenda);
  }
  
   const handleExportWord = () => {
    if (!editorInstance) {
      toast({ variant: 'destructive', title: 'Editor not ready.' });
      return;
    }
    const content = editorInstance.getHTML();
    const header = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Export HTML to Word Document</title></head><body><h1>${note.title}</h1>`;
    const footer = "</body></html>";
    const sourceHTML = header + content + footer;

    const source = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(sourceHTML);
    const fileDownload = document.createElement("a");
    document.body.appendChild(fileDownload);
    fileDownload.href = source;
    fileDownload.download = `${note.title}.doc`;
    fileDownload.click();
    document.body.removeChild(fileDownload);
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
                 <Button variant="outline" onClick={handleExportWord}>
                    <Download /> Export Word
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
             <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-sm font-medium">Start Date</label>
                    <Input
                        type="date"
                        value={note.startDate ? moment(note.startDate.toDate()).format('YYYY-MM-DD') : ''}
                        onChange={(e) => handleFieldChange('startDate', Timestamp.fromDate(new Date(e.target.value)))}
                    />
                </div>
                 <div>
                    <label className="text-sm font-medium">End Date</label>
                    <Input
                        type="date"
                        value={note.endDate ? moment(note.endDate.toDate()).format('YYYY-MM-DD') : ''}
                        onChange={(e) => handleFieldChange('endDate', e.target.value ? Timestamp.fromDate(new Date(e.target.value)) : null)}
                    />
                </div>
            </div>
             <div>
                <label className="text-sm font-medium">Location</label>
                <Input
                    value={note.location || ''}
                    onChange={(e) => handleFieldChange('location', e.target.value)}
                    placeholder="e.g., Board Room 4"
                />
            </div>
             <div className="space-y-2">
                <label className="text-sm font-medium">Attendees</label>
                {note.attendees.map(attendee => (
                    <div key={attendee.id} className="grid grid-cols-[1fr_1fr_auto] items-center gap-2">
                        <Input value={attendee.name} placeholder="Name" onChange={e => handleAttendeeChange(attendee.id, 'name', e.target.value)} />
                        <Input value={attendee.jobTitle || ''} placeholder="Job Title" onChange={e => handleAttendeeChange(attendee.id, 'jobTitle', e.target.value)} />
                        <Button variant="ghost" size="icon" onClick={() => handleRemoveAttendee(attendee.id)}><Trash2 className="h-4 w-4"/></Button>
                    </div>
                ))}
                <Button variant="outline" size="sm" onClick={handleAddAttendee}><UserPlus /> Add Attendee</Button>
            </div>
            <div className="space-y-2">
                <label className="text-sm font-medium">Agenda</label>
                 {note.agenda.map(item => (
                    <div key={item.id} className="flex items-center gap-2">
                        <Input value={item.topic} placeholder="Agenda topic..." onChange={e => handleAgendaChange(item.id, 'topic', e.target.value)} />
                        <Button variant="ghost" size="icon" onClick={() => handleRemoveAgendaItem(item.id)}><Trash2 className="h-4 w-4"/></Button>
                    </div>
                ))}
                 <Button variant="outline" size="sm" onClick={handleAddAgendaItem}><ListPlus /> Add Agenda Item</Button>
            </div>
        </div>
    </div>
  );
}
