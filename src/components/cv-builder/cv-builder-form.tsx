'use client';
import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CVDataSchema, type CVData } from '@/lib/types/cv-builder';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CVSection } from './cv-section';
import { exportCvToDocx, exportCvToPdf } from '@/lib/cv-export';
import { FileDown, PlusCircle, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';

export function CVBuilderForm() {
    const { toast } = useToast();
    const form = useForm<CVData>({
        resolver: zodResolver(CVDataSchema),
        defaultValues: {
            personalDetails: { fullName: '', email: '', phone: '', address: '' },
            summary: '',
            experience: [{ id: '1', jobTitle: '', company: '', location: '', startDate: '', endDate: '', description: '' }],
            education: [{ id: '1', degree: '', school: '', location: '', graduationDate: '' }],
            courses: [{ id: '1', courseName: '', institution: '', completionDate: '' }],
            languages: [{ id: '1', language: '', proficiency: '' }],
            skills: '',
        }
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

    const handleExport = (format: 'docx' | 'pdf') => {
        const data = form.getValues();
        try {
            if (format === 'docx') {
                exportCvToDocx(data);
            } else {
                exportCvToPdf(data);
            }
             toast({ title: `Exporting CV as ${format.toUpperCase()}` });
        } catch(e) {
            toast({ variant: 'destructive', title: 'Export failed' });
            console.error(e);
        }
    }
    
    return (
        <form className="space-y-6">
            <div className="flex justify-end gap-2 sticky top-0 py-2 bg-background z-10">
                 <Button type="button" variant="outline" onClick={() => handleExport('pdf')}><FileDown/> Export PDF</Button>
                 <Button type="button" onClick={() => handleExport('docx')}><FileDown/> Export Word</Button>
            </div>
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
                                <div className="grid grid-cols-2 gap-2">
                                     <Input placeholder="Start Date" {...form.register(`experience.${index}.startDate`)} />
                                     <Input placeholder="End Date" {...form.register(`experience.${index}.endDate`)} />
                                </div>
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
                            <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2" onClick={() => removeEducation(index)}>
                                <Trash2 className="h-4 w-4 text-destructive"/>
                            </Button>
                        </div>
                    ))}
                    <Button type="button" variant="outline" onClick={() => appendEducation({ id: uuidv4(), degree: '', school: '', location: '', graduationDate: '' })}>
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
                                <Input placeholder="Completion Date" {...form.register(`courses.${index}.completionDate`)} />
                            </div>
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
                <CardHeader><CardTitle>Skills</CardTitle></CardHeader>
                <CardContent>
                     <CVSection
                        title=""
                        value={form.watch('skills')}
                        onChange={(val) => form.setValue('skills', val)}
                        placeholder="List your skills, separated by commas (e.g., JavaScript, React, Node.js)."
                        context={{ section: 'Skills Section' }}
                    />
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle>Languages</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    {languageFields.map((field, index) => (
                        <div key={field.id} className="p-4 border rounded-lg space-y-3 relative">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input placeholder="Language (e.g., Spanish)" {...form.register(`languages.${index}.language`)} />
                                <Input placeholder="Proficiency (e.g., Native, Fluent, Conversational)" {...form.register(`languages.${index}.proficiency`)} />
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
    );
}
