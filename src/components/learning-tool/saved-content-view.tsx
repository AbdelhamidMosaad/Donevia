
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { collection, query, onSnapshot, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { LearningMaterial } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { NotebookText, HelpCircle, Copy, Trash2 } from 'lucide-react';
import { GeneratedContentDisplay } from './generated-content-display';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import moment from 'moment';

const typeIcons = {
    notes: <NotebookText className="h-5 w-5 text-blue-500" />,
    quiz: <HelpCircle className="h-5 w-5 text-green-500" />,
    flashcards: <Copy className="h-5 w-5 text-purple-500" />,
};

export function SavedContentView() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [materials, setMaterials] = useState<LearningMaterial[]>([]);
    const [selectedMaterial, setSelectedMaterial] = useState<LearningMaterial | null>(null);

    useEffect(() => {
        if (!user) return;
        const q = query(collection(db, 'users', user.uid, 'learningMaterials'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LearningMaterial));
            setMaterials(data);
        });
        return () => unsubscribe();
    }, [user]);

    const handleDelete = async (materialId: string) => {
        if (!user) return;
        try {
            await deleteDoc(doc(db, 'users', user.uid, 'learningMaterials', materialId));
            toast({ title: 'Material deleted successfully' });
        } catch (error) {
            console.error("Error deleting material:", error);
            toast({ variant: 'destructive', title: 'Failed to delete material' });
        }
    };

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle>My Learning Materials</CardTitle>
                    <CardDescription>Here are all the notes, quizzes, and flashcards you've generated.</CardDescription>
                </CardHeader>
                <CardContent>
                    {materials.length === 0 ? (
                        <p className="text-muted-foreground">You haven't generated any materials yet.</p>
                    ) : (
                       <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                         {materials.map(material => (
                            <Card key={material.id} className="flex flex-col">
                                <CardHeader className="flex-row items-start justify-between gap-4">
                                   <div className="flex items-center gap-3">
                                     {typeIcons[material.type]}
                                    <div>
                                        <CardTitle className="text-base line-clamp-2">{material.sourceTitle}</CardTitle>
                                        <CardDescription className="text-xs">
                                            {material.type.charAt(0).toUpperCase() + material.type.slice(1)} | {moment(material.createdAt?.toDate()).format('MMM D, YYYY')}
                                        </CardDescription>
                                    </div>
                                   </div>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-7 w-7"><Trash2 className="h-4 w-4 text-destructive"/></Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This action cannot be undone. This will permanently delete this learning material.
                                            </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleDelete(material.id)}>Delete</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </CardHeader>
                                <CardContent className="flex-1 flex items-end">
                                     <Dialog>
                                        <DialogTrigger asChild>
                                            <Button variant="outline" className="w-full">View</Button>
                                        </DialogTrigger>
                                        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                                            <DialogHeader>
                                                <DialogTitle>{material.sourceTitle}</DialogTitle>
                                            </DialogHeader>
                                            <GeneratedContentDisplay content={material.content} />
                                        </DialogContent>
                                     </Dialog>
                                </CardContent>
                            </Card>
                         ))}
                       </div>
                    )}
                </CardContent>
            </Card>

           
        </div>
    );
}
