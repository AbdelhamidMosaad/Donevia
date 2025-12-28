
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import type { InterviewSession, InterviewQuestion } from '@/lib/types';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import moment from 'moment';

// This is a placeholder for the detailed session view.
// In a real implementation, you would fetch the session and its questions/answers from Firestore.

const sampleSessionData = {
    id: "sample-session-1",
    jobTitle: "Senior Product Manager",
    industry: "Tech",
    experienceLevel: "senior",
    createdAt: new Date(),
    status: "completed",
    questions: [
        { id: "q1", questionText: "Tell me about yourself.", category: "General", userAnswerText: "I'm a product manager with 8 years of experience...", feedback: { clarity: 8, relevance: 9, confidence: 7, suggestions: ["Try to be more concise."], overallAssessment: "Good start." } },
        { id: "q2", questionText: "How do you handle disagreements with engineers?", category: "Behavioral", userAnswerText: "I focus on data and user feedback...", feedback: { clarity: 9, relevance: 9, confidence: 8, suggestions: ["Excellent use of the STAR method."], overallAssessment: "Strong answer." } },
    ]
};


export default function SessionDetailPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const params = useParams();
    const sessionId = params.sessionId as string;
    
    // const [session, setSession] = useState<InterviewSession | null>(null);
    // const [questions, setQuestions] = useState<InterviewQuestion[]>([]);

    // This would be the real implementation:
    /*
    useEffect(() => {
        if (user && sessionId) {
            const sessionRef = doc(db, 'users', user.uid, 'interviewSessions', sessionId);
            const unsubscribe = onSnapshot(sessionRef, (doc) => {
                if (doc.exists()) {
                    setSession({ id: doc.id, ...doc.data() } as InterviewSession);
                } else {
                    router.push('/interview-prep/history');
                }
            });
            // Also fetch questions for this session...
            return () => unsubscribe();
        }
    }, [user, sessionId, router]);
    */
    
    const session = sampleSessionData; // Using sample data for now

    if (loading || !user || !session) {
        return <div>Loading session details...</div>;
    }

    return (
        <div className="flex flex-col h-full gap-6">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={() => router.push('/interview-prep')}>
                    <ArrowLeft />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold font-headline">Interview Review: {session.jobTitle}</h1>
                    <p className="text-muted-foreground">Session from {moment(session.createdAt).format('MMMM Do, YYYY')}</p>
                </div>
            </div>

            <div className="space-y-4">
                {session.questions.map(q => (
                    <Card key={q.id}>
                        <CardHeader>
                            <CardTitle>{q.questionText}</CardTitle>
                            <CardDescription>Category: {q.category}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <h4 className="font-semibold">Your Answer:</h4>
                                <p className="text-muted-foreground p-3 bg-muted/50 rounded-md mt-1">{q.userAnswerText}</p>
                            </div>
                            <div>
                                <h4 className="font-semibold">AI Feedback:</h4>
                                <div className="p-3 bg-primary/10 rounded-md mt-1 space-y-2">
                                    <p><strong>Overall:</strong> {q.feedback.overallAssessment}</p>
                                    <p><strong>Suggestions:</strong></p>
                                    <ul className="list-disc pl-5">
                                        {q.feedback.suggestions.map((s, i) => <li key={i}>{s}</li>)}
                                    </ul>
                                    <div className="flex gap-4 pt-2">
                                        <span>Clarity: {q.feedback.clarity}/10</span>
                                        <span>Relevance: {q.feedback.relevance}/10</span>
                                        <span>Confidence: {q.feedback.confidence}/10</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
