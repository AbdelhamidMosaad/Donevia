'use client';
import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CVDataSchema, type CVData, type CVDraft } from '@/lib/types/cv-builder';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CVSection } from './cv-section';
import { FileDown, PlusCircle, Trash2, Search, Loader2, Check, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription as DialogDescriptionComponent, DialogFooter } from '@/components/ui/dialog';
import { suggestSkills, type SuggestSkillsResponse } from '@/ai/flows/suggest-skills-flow';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, orderBy, doc, setDoc, addDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import moment from 'moment';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Label } from '../ui/label';

function SuggestSkillsDialog({
    isOpen,
    onOpenChange,
    jobTitle,
    onSkillsSelected,
}: {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    jobTitle: string;
    onSkillsSelected: (skills: { technicalSkills: string[], softSkills: string[] }) => void;
}) {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [suggestions, setSuggestions] = useState<SuggestSkillsResponse | null>(null);
    const [selectedTechnical, setSelectedTechnical] = useState<string[]>([]);
    const [selectedSoft, setSelectedSoft] = useState<string[]>([]);
    
    useEffect(() => {
        if (isOpen && jobTitle) {
            const fetchSuggestions = async () => {
                setIsLoading(true);
                setSuggestions(null);
                try {
                    const result = await suggestSkills({ jobTitle });
                    setSuggestions(result);
                } catch (e) {
                    toast({ variant: 'destructive', title: 'Failed to get suggestions.' });
                    onOpenChange(false);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchSuggestions();
        }
    }, [isOpen, jobTitle, toast, onOpenChange]);

    const toggleSkill = (skill: string, type: 'technical' | 'soft') => {
        if (type === 'technical') {
            setSelectedTechnical(prev => prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]);
        } else {
            setSelectedSoft(prev => prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]);
        }
    };

    const handleAddSkills = () => {
        onSkillsSelected({ technicalSkills: selectedTechnical, softSkills: selectedSoft });
        onOpenChange(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>AI Skill Suggestions for "{jobTitle}"</DialogTitle>
                    <DialogDescriptionComponent>Select the skills you'd like to add to your CV.</DialogDescriptionComponent>
                </DialogHeader>
                {isLoading ? (
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="animate-spin h-8 w-8 text-primary" />
                    </div>
                ) : suggestions ? (
                    <div className="grid grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto p-1">
                        <Card>
                            <CardHeader><CardTitle className="text-lg">Technical Skills</CardTitle></CardHeader>
                            <CardContent className="flex flex-wrap gap-2">
                                {suggestions.technicalSkills.map(skill => (
                                    <Badge
                                        key={skill}
                                        variant={selectedTechnical.includes(skill) ? 'default' : 'secondary'}
                                        onClick={() => toggleSkill(skill, 'technical')}
                                        className="cursor-pointer"
                                    >
                                        {selectedTechnical.includes(skill) && <Check className="mr-1 h-3 w-3" />}
                                        {skill}
                                    </Badge>
                                ))}
                            </CardContent>
                        </Card>
                        <Card>
                             <CardHeader><CardTitle className="text-lg">Soft Skills</CardTitle></CardHeader>
                            <CardContent className="flex flex-wrap gap-2">
                                {suggestions.softSkills.map(skill => (
                                    <Badge
                                        key={skill}
                                        variant={selectedSoft.includes(skill) ? 'default' : 'secondary'}
                                        onClick={() => toggleSkill(skill, 'soft')}
                                        className="cursor-pointer"
                                    >
                                        {selectedSoft.includes(skill) && <Check className="mr-1 h-3 w-3" />}
                                        {skill}
                                    </Badge>
                                ))}
                            </CardContent>
                        </Card>
                    </div>
                ) : null}
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleAddSkills} disabled={selectedTechnical.length === 0 && selectedSoft.length === 0}>
                        Add Selected Skills
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export function CVBuilderForm() {
    const { toast } = useToast();
    const { user } = useAuth();
    const [drafts, setDrafts] = useState<CVDraft[]>([]);
    const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);

    const defaultFormValues: CVData = {
        name: 'Untitled CV',
        personalDetails: { fullName: '', email: '', phone: '', address: '', linkedIn: '', website: '' },
        summary: '',
        experience: [{ id: uuidv4(), jobTitle: '', company: '', location: '', startDate: '', endDate: '', description: '' }],
        education: [{ id: uuidv4(), degree: '', school: '', location: '', graduationDate: '', description: '' }],
        courses: [{ id: uuidv4(), courseName: '', institution: '', completionDate: '' }],
        languages: [{ id: uuidv4(), language: '', proficiency: '' }],
        technicalSkills: '',
        softSkills: '',
    };
    
    const form = useForm<CVData>({
        resolver: zodResolver(CVDataSchema),
        defaultValues: defaultFormValues,
    });
    
    const { fields: experienceFields, append: appendExperience, remove: removeExperience } = useFieldArray({
        control: form.control,
        name: 'experience'
    });

    const { fields: educationFields, append: appendEducation, remove: removeEducation } = useFieldArray({
        control: form.control,
        name: 'education'
    });
    
    const { fields: courseFields, append: appendCourse, remove: removeCourse } = useFieldArray({
        control: form.control,
        name: 'courses'
    });
    
    const { fields: languageFields, append: appendLanguage, remove: removeLanguage } = useFieldArray({
        control: form.control,
        name: 'languages'
    });

    const [isSuggestSkillsOpen, setIsSuggestSkillsOpen] = useState(false);

    const firstJobTitle = form.watch('experience.0.jobTitle');
    
    useEffect(() => {
        if (!user) return;
        const q = query(collection(db, 'users', user.uid, 'cvs'), orderBy('updatedAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const savedDrafts = snapshot.docs.map(d => {
                const data = d.data();
                return { 
                    ...data,
                    id: d.id, 
                    updatedAt: data.updatedAt?.toDate() 
                } as CVDraft;
            });
            setDrafts(savedDrafts);
        });
        return () => unsubscribe();
    }, [user]);

    const handleSaveDraft = async () => {
        if(!user) return;
        
        const isValid = await form.trigger();
        if(!isValid) {
            toast({ variant: 'destructive', title: 'Please fill in all required fields.', description: "The 'Draft Name' field cannot be empty." });
            return;
        }

        const data = form.getValues();
        const draftData = {
            ...data,
            ownerId: user.uid,
            updatedAt: serverTimestamp(),
        };
        
        if (currentDraftId) {
            const docRef = doc(db, 'users', user.uid, 'cvs', currentDraftId);
            await setDoc(docRef, draftData, { merge: true });
            toast({ title: 'CV Draft Updated!'});
        } else {
            const docRef = await addDoc(collection(db, 'users', user.uid, 'cvs'), draftData);
            setCurrentDraftId(docRef.id);
            toast({ title: 'CV Draft Saved!'});
        }
    };
    
    const handleLoadDraft = (draftId: string) => {
        if (draftId === 'new') {
            handleNewDraft();
            return;
        }
        const draftToLoad = drafts.find(d => d.id === draftId);
        if (draftToLoad) {
            const loadedData = {
                ...draftToLoad,
                experience: draftToLoad.experience?.map(e => ({...e, id: e.id || uuidv4()})) || [],
                education: draftToLoad.education?.map(e => ({...e, id: e.id || uuidv4(), description: e.description || '' })) || [],
                courses: draftToLoad.courses?.map(e => ({...e, id: e.id || uuidv4()})) || [],
                languages: draftToLoad.languages?.map(e => ({...e, id: e.id || uuidv4()})) || [],
            };
            form.reset(loadedData);
            setCurrentDraftId(draftId);
            toast({ title: 'Draft Loaded', description: `Now editing "${draftToLoad.name}".`});
        }
    };

    const handleNewDraft = () => {
        form.reset(defaultFormValues);
        setCurrentDraftId(null);
    };

    const handleDeleteDraft = async () => {
        if (!currentDraftId || !user) return;
        await deleteDoc(doc(db, 'users', user.uid, 'cvs', currentDraftId));
        toast({ title: 'Draft Deleted' });
        handleNewDraft();
    };


    const handleExport = async (format: 'docx' | 'pdf') => {
        const data = form.getValues();
        try {
            if (format === 'docx') {
                const { exportCvToDocx } = await import('@/lib/cv-export');
                exportCvToDocx(data);
            } else {
                const { exportCvToPdf } = await import('@/lib/cv-export');
                exportCvToPdf(data);
            }
             toast({ title: `Exporting CV as ${format.toUpperCase()}` });
        } catch(e) {
            toast({ variant: 'destructive', title: 'Export failed' });
            console.error(e);
        }
    }

    const handleSkillsSelected = (skills: { technicalSkills: string[], softSkills: string[] }) => {
        const currentTechnical = form.getValues('technicalSkills') || '';
        const currentSoft = form.getValues('softSkills') || '';
    
        const newTechnical = [...new Set([...currentTechnical.split(',').map(s=>s.trim()).filter(Boolean), ...skills.technicalSkills])].join(', ');
        const newSoft = [...new Set([...currentSoft.split(',').map(s=>s.trim()).filter(Boolean), ...skills.softSkills])].join(', ');
    
        form.setValue('technicalSkills', newTechnical);
        form.setValue('softSkills', newSoft);
    };
    
    return (
        <Form {...form}>
            <form className="space-y-6">
                <div className="flex justify-end gap-2 sticky top-0 py-2 bg-background z-10">
                    <Button type="button" variant="outline" onClick={() => handleExport('pdf')}><FileDown/> Export PDF</Button>
                    <Button type="button" onClick={() => handleExport('docx')}><FileDown/> Export Word</Button>
                </div>
                
                <Card>
                    <CardHeader>
                        <CardTitle>CV Management</CardTitle>
                        <CardDescription>Save, load, and manage your CV drafts.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex flex-col md:flex-row gap-4 items-end">
                            <div className="flex-1">
                                <Label>Load Draft</Label>
                                <Select onValueChange={handleLoadDraft} value={currentDraftId || 'new'}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="new">-- Start a New CV --</SelectItem>
                                        {drafts.map(d => (
                                            <SelectItem key={d.id} value={d.id}>{d.name} (Updated {moment(d.updatedAt).fromNow()})</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button type="button" onClick={handleNewDraft}>Start New</Button>
                        </div>

                         <div className="pt-4 border-t">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Current Draft Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Enter a name for your new or updated draft..." {...field} />
                                        </FormControl>
                                        <FormDescription>This name will be used to save or update your draft.</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        
                        <div className="flex gap-2 justify-end">
                             <Button type="button" onClick={handleSaveDraft}><Save/> {currentDraftId ? 'Update Draft' : 'Save as New Draft'}</Button>
                             {currentDraftId && (
                                 <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                         <Button type="button" variant="destructive"><Trash2 /> Delete Draft</Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                            <AlertDialogDescription>This will permanently delete the draft "{form.getValues('name')}".</AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={handleDeleteDraft}>Delete</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                 </AlertDialog>
                             )}
                        </div>
                    </CardContent>
                </Card>


                <Card>
                    <CardHeader><CardTitle>Personal Details</CardTitle></CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input placeholder="Full Name" {...form.register('personalDetails.fullName')} />
                        <Input placeholder="Email" {...form.register('personalDetails.email')} />
                        <Input placeholder="Phone Number" {...form.register('personalDetails.phone')} />
                        <Input placeholder="Address (e.g., City, Country)" {...form.register('personalDetails.address')} />
                        <Input placeholder="LinkedIn Profile URL (Optional)" {...form.register('personalDetails.linkedIn')} />
                        <Input placeholder="Personal Website/Portfolio (Optional)" {...form.register('personalDetails.website')} />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle>Professional Summary</CardTitle></CardHeader>
                    <CardContent>
                        <CVSection
                            title=""
                            value={form.watch('summary')}
                            onChange={(val) => form.setValue('summary', val)}
                            placeholder="Write a brief summary of your skills and experience."
                            context={{ section: 'Professional Summary' }}
                        />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle>Work Experience</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        {experienceFields.map((field, index) => (
                            <div key={field.id} className="p-4 border rounded-lg space-y-3 relative">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input placeholder="Job Title" {...form.register(`experience.${index}.jobTitle`)} />
                                    <Input placeholder="Company" {...form.register(`experience.${index}.company`)} />
                                    <Input placeholder="Location" {...form.register(`experience.${index}.location`)} />
                                    <Input placeholder="Start - End Date" {...form.register(`experience.${index}.startDate`)} />
                                </div>
                                <CVSection
                                    title="Description"
                                    value={form.watch(`experience.${index}.description`)}
                                    onChange={(val) => form.setValue(`experience.${index}.description`, val)}
                                    placeholder="Describe your responsibilities and achievements..."
                                    context={{ section: 'Work Experience Description', jobTitle: form.watch(`experience.${index}.jobTitle`) }}
                                />
                                <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2" onClick={() => removeExperience(index)}>
                                    <Trash2 className="h-4 w-4 text-destructive"/>
                                </Button>
                            </div>
                        ))}
                        <Button type="button" variant="outline" onClick={() => appendExperience({ id: uuidv4(), jobTitle: '', company: '', location: '', startDate: '', endDate: '', description: '' })}>
                            <PlusCircle/> Add Experience
                        </Button>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>Education</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        {educationFields.map((field, index) => (
                            <div key={field.id} className="p-4 border rounded-lg space-y-3 relative">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input placeholder="Degree (e.g., B.S. in Computer Science)" {...form.register(`education.${index}.degree`)} />
                                    <Input placeholder="School/University" {...form.register(`education.${index}.school`)} />
                                    <Input placeholder="Location" {...form.register(`education.${index}.location`)} />
                                    <Input placeholder="Graduation Date" {...form.register(`education.${index}.graduationDate`)} />
                                </div>
                                 <CVSection
                                    title="Description"
                                    value={form.watch(`education.${index}.description`) || ''}
                                    onChange={(val) => form.setValue(`education.${index}.description`, val)}
                                    placeholder="Describe your relevant coursework, projects, or honors..."
                                    context={{ section: 'Education Description', jobTitle: form.watch(`education.${index}.degree`) }}
                                />
                                <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2" onClick={() => removeEducation(index)}>
                                    <Trash2 className="h-4 w-4 text-destructive"/>
                                </Button>
                            </div>
                        ))}
                        <Button type="button" variant="outline" onClick={() => appendEducation({ id: uuidv4(), degree: '', school: '', location: '', graduationDate: '', description: '' })}>
                            <PlusCircle/> Add Education
                        </Button>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardHeader><CardTitle>Courses &amp; Certifications</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        {courseFields.map((field, index) => (
                            <div key={field.id} className="p-4 border rounded-lg space-y-3 relative">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input placeholder="Course or Certification Name" {...form.register(`courses.${index}.courseName`)} />
                                    <Input placeholder="Issuing Institution (e.g., Coursera, Udemy)" {...form.register(`courses.${index}.institution`)} />
                                </div>
                                <Input placeholder="Completion Date" {...form.register(`courses.${index}.completionDate`)} />
                                <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2" onClick={() => removeCourse(index)}>
                                    <Trash2 className="h-4 w-4 text-destructive"/>
                                </Button>
                            </div>
                        ))}
                        <Button type="button" variant="outline" onClick={() => appendCourse({ id: uuidv4(), courseName: '', institution: '', completionDate: '' })}>
                            <PlusCircle/> Add Course
                        </Button>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Skills</CardTitle>
                            <CardDescription>Enter the first job title to get AI suggestions.</CardDescription>
                        </div>
                         <Button type="button" variant="outline" size="sm" onClick={() => setIsSuggestSkillsOpen(true)} disabled={!firstJobTitle}>
                            <Search className="mr-2 h-4 w-4" /> Suggest Skills
                        </Button>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <CVSection
                            title="Technical Skills"
                            value={form.watch('technicalSkills')}
                            onChange={(val) => form.setValue('technicalSkills', val)}
                            placeholder="e.g., JavaScript, React, Node.js, Python, SQL"
                            context={{ section: 'Technical Skills', jobTitle: firstJobTitle }}
                        />
                        <CVSection
                            title="Soft Skills"
                            value={form.watch('softSkills')}
                            onChange={(val) => form.setValue('softSkills', val)}
                            placeholder="e.g., Communication, Teamwork, Problem-solving"
                            context={{ section: 'Soft Skills', jobTitle: firstJobTitle }}
                        />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle>Languages</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        {languageFields.map((field, index) => (
                            <div key={field.id} className="p-4 border rounded-lg space-y-3 relative">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name={`languages.${index}.language`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Language</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="e.g., Spanish" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name={`languages.${index}.proficiency`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Proficiency</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select a proficiency level" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="Native or Bilingual">Native or Bilingual</SelectItem>
                                                        <SelectItem value="Full Professional Proficiency">Full Professional Proficiency</SelectItem>
                                                        <SelectItem value="Professional Working Proficiency">Professional Working Proficiency</SelectItem>
                                                        <SelectItem value="Limited Working Proficiency">Limited Working Proficiency</SelectItem>
                                                        <SelectItem value="Elementary Proficiency">Elementary Proficiency</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2" onClick={() => removeLanguage(index)}>
                                    <Trash2 className="h-4 w-4 text-destructive"/>
                                </Button>
                            </div>
                        ))}
                        <Button type="button" variant="outline" onClick={() => appendLanguage({ id: uuidv4(), language: '', proficiency: '' })}>
                            <PlusCircle/> Add Language
                        </Button>
                    </CardContent>
                </Card>
            </form>
             {isSuggestSkillsOpen && firstJobTitle && (
                <SuggestSkillsDialog
                    isOpen={isSuggestSkillsOpen}
                    onOpenChange={setIsSuggestSkillsOpen}
                    jobTitle={firstJobTitle}
                    onSkillsSelected={handleSkillsSelected}
                />
            )}
        </Form>
    );
}
