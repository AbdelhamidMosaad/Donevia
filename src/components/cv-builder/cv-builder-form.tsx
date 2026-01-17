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
import { FileDown, PlusCircle, Trash2, CalendarIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

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
            technicalSkills: '',
            softSkills: '',
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
    
    const DatePickerField = ({ name, label, placeholder }: { name: any, label: string, placeholder?: string }) => (
        <FormField
            control={form.control}
            name={name}
            render={({ field }) => (
                <FormItem className="flex flex-col">
                    <FormLabel>{label}</FormLabel>
                    <Popover>
                        <PopoverTrigger asChild>
                            <FormControl>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-full pl-3 text-left font-normal",
                                        !field.value && "text-muted-foreground"
                                    )}
                                >
                                    {field.value ? (
                                        format(new Date(field.value), "PPP")
                                    ) : (
                                        <span>{placeholder || 'Pick a date'}</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                            </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={field.value ? new Date(field.value) : undefined}
                                onSelect={(date) => field.onChange(date ? format(date, 'yyyy-MM-dd') : '')}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>
                </FormItem>
            )}
        />
    );

    return (
        <Form {...form}>
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
                                        <DatePickerField name={`experience.${index}.startDate`} label="Start Date" placeholder="Start Date"/>
                                        <DatePickerField name={`experience.${index}.endDate`} label="End Date" placeholder="End Date" />
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
                                    <DatePickerField name={`education.${index}.graduationDate`} label="Graduation Date" placeholder="Graduation Date" />
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
                                </div>
                                <DatePickerField name={`courses.${index}.completionDate`} label="Completion Date" placeholder="Completion Date" />
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
                    <CardHeader><CardTitle>Technical Skills</CardTitle></CardHeader>
                    <CardContent>
                        <CVSection
                            title=""
                            value={form.watch('technicalSkills')}
                            onChange={(val) => form.setValue('technicalSkills', val)}
                            placeholder="e.g., JavaScript, React, Node.js, Python, SQL"
                            context={{ section: 'Technical Skills' }}
                        />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle>Soft Skills</CardTitle></CardHeader>
                    <CardContent>
                        <CVSection
                            title=""
                            value={form.watch('softSkills')}
                            onChange={(val) => form.setValue('softSkills', val)}
                            placeholder="e.g., Communication, Teamwork, Problem-solving"
                            context={{ section: 'Soft Skills' }}
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
        </Form>
    );
}