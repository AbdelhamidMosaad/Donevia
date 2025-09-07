
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, LayoutDashboard, BrainCircuit, GitBranch, Repeat, Briefcase, GraduationCap } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { DoneviaLogo } from '@/components/logo';
import { auth } from '@/lib/firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useEffect } from 'react';
import { WelcomeScreen } from '@/components/welcome-screen';


export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();
  
  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);
  
  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      router.push('/dashboard');
    } catch (error) {
      console.error("Error signing in with Google: ", error);
    }
  };
  
  if (loading || user) {
    return <WelcomeScreen />
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="px-4 lg:px-6 h-16 flex items-center bg-card shadow-sm sticky top-0 z-50">
        <Link href="#" className="flex items-center justify-center">
          <DoneviaLogo className="h-6 w-6" />
          <span className="ml-2 text-xl font-headline font-semibold">Donevia</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Button onClick={handleGoogleSignIn}>Get Started</Button>
        </nav>
      </header>
      <main className="flex-1">
        <section className="w-full py-20 md:py-24 lg:py-32 xl:py-40">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-6 text-center">
                <div className="space-y-4">
                  <h1 className="text-4xl font-bold font-headline tracking-tighter sm:text-5xl md:text-6xl xl:text-7xl/none">
                    The Unified Workspace for Peak Performance
                  </h1>
                  <p className="max-w-[700px] mx-auto text-muted-foreground md:text-xl">
                    Stop switching between apps. Donevia brings your tasks, notes, habits, clients, and goals into one intelligent platform designed for focus and growth.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Button onClick={handleGoogleSignIn} size="lg">
                    Start for Free
                  </Button>
                </div>
            </div>
          </div>
        </section>

        <section id="features" className="w-full py-12 md:py-24 lg:py-32 bg-muted/50">
            <div className="container px-4 md:px-6 space-y-20">
                
                {/* Feature 1: Advanced CRM */}
                <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
                    <div className="space-y-4">
                        <div className="inline-block rounded-lg bg-primary/10 px-3 py-1 text-sm text-primary font-medium">Advanced CRM</div>
                        <h2 className="text-3xl font-bold font-headline tracking-tighter sm:text-4xl">From Lead to Invoice, Seamlessly</h2>
                        <p className="text-muted-foreground md:text-lg">
                            Transform your client management with a powerful, visual pipeline. Track requests, manage sales stages, and analyze performance without leaving your workspace.
                        </p>
                        <ul className="grid gap-3">
                            <li className="flex items-start gap-3">
                                <CheckCircle className="mt-1 h-5 w-5 text-primary" />
                                <span><strong>Visual Kanban Pipeline:</strong> Drag-and-drop client requests through customizable stages from 'New Request' to 'Win'.</span>
                            </li>
                             <li className="flex items-start gap-3">
                                <CheckCircle className="mt-1 h-5 w-5 text-primary" />
                                <span><strong>Insightful Analytics:</strong> Track win/loss ratios, deal values, and loss reasons to optimize your sales process.</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <CheckCircle className="mt-1 h-5 w-5 text-primary" />
                                <span><strong>Integrated Client Hub:</strong> Manage client details, custom fields, quotations, and invoices all in one place.</span>
                            </li>
                        </ul>
                    </div>
                     <Image
                        src="https://picsum.photos/600/400"
                        width="600"
                        height="400"
                        alt="CRM Feature"
                        data-ai-hint="crm pipeline dashboard"
                        className="mx-auto aspect-video overflow-hidden rounded-xl object-cover"
                      />
                </div>

                {/* Feature 2: Habit Tracker */}
                <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
                     <Image
                        src="https://picsum.photos/600/400"
                        width="600"
                        height="400"
                        alt="Habit Tracker"
                        data-ai-hint="habit tracker chart"
                        className="mx-auto aspect-video overflow-hidden rounded-xl object-cover lg:order-last"
                      />
                    <div className="space-y-4">
                        <div className="inline-block rounded-lg bg-primary/10 px-3 py-1 text-sm text-primary font-medium">Habit Tracker</div>
                        <h2 className="text-3xl font-bold font-headline tracking-tighter sm:text-4xl">Build Consistency, Achieve Greatness</h2>
                        <p className="text-muted-foreground md:text-lg">
                           The key to success is consistency. Our intuitive habit tracker helps you build winning routines, monitor your progress, and stay motivated.
                        </p>
                        <ul className="grid gap-3">
                            <li className="flex items-start gap-3">
                                <CheckCircle className="mt-1 h-5 w-5 text-primary" />
                                <span><strong>Weekly View:</strong> Easily check off your daily habits in a clean, weekly calendar format.</span>
                            </li>
                             <li className="flex items-start gap-3">
                                <CheckCircle className="mt-1 h-5 w-5 text-primary" />
                                <span><strong>Track Your Streaks:</strong> Visualize your progress and build momentum by tracking your completion streaks over time.</span>
                            </li>
                        </ul>
                    </div>
                </div>

                 {/* Feature 3: AI Learning Tools */}
                <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
                    <div className="space-y-4">
                        <div className="inline-block rounded-lg bg-primary/10 px-3 py-1 text-sm text-primary font-medium">AI Learning Tools</div>
                        <h2 className="text-3xl font-bold font-headline tracking-tighter sm:text-4xl">Learn Smarter, Not Harder</h2>
                        <p className="text-muted-foreground md:text-lg">
                           Turn any document, lecture, or text into a powerful learning asset. Our AI tools help you understand and retain information more effectively.
                        </p>
                        <ul className="grid gap-3">
                            <li className="flex items-start gap-3">
                                <CheckCircle className="mt-1 h-5 w-5 text-primary" />
                                <span><strong>Instant Notes:</strong> Upload a file (PDF, DOCX) or paste text to generate comprehensive, well-structured notes.</span>
                            </li>
                             <li className="flex items-start gap-3">
                                <CheckCircle className="mt-1 h-5 w-5 text-primary" />
                                <span><strong>Custom Quizzes:</strong> Test your knowledge by creating quizzes with various question types and get instant feedback.</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <CheckCircle className="mt-1 h-5 w-5 text-primary" />
                                <span><strong>Interactive Flashcards:</strong> Master key concepts with generated flashcards, perfect for quick review sessions.</span>
                            </li>
                        </ul>
                    </div>
                     <Image
                        src="https://picsum.photos/600/400"
                        width="600"
                        height="400"
                        alt="AI Learning Tools"
                        data-ai-hint="ai learning study"
                        className="mx-auto aspect-video overflow-hidden rounded-xl object-cover"
                      />
                </div>
            </div>
        </section>
        
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold font-headline tracking-tighter sm:text-5xl">An Entire Suite of Tools</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Donevia is more than just a few features. It's an integrated ecosystem for productivity.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-2 md:gap-12 lg:max-w-none lg:grid-cols-3 pt-12">
                <div className="flex flex-col items-center text-center gap-2">
                    <div className="p-3 rounded-full bg-primary/10"><LayoutDashboard className="h-8 w-8 text-primary" /></div>
                    <h3 className="font-bold font-headline text-xl">Task Management</h3>
                    <p className="text-muted-foreground">Organize your work with boards, lists, and a calendar view. Your tasks, your way.</p>
                </div>
                <div className="flex flex-col items-center text-center gap-2">
                    <div className="p-3 rounded-full bg-primary/10"><BrainCircuit className="h-8 w-8 text-primary" /></div>
                    <h3 className="font-bold font-headline text-xl">OneNote-style Notebooks</h3>
                    <p className="text-muted-foreground">Capture your ideas in flexible, powerful notebooks with a rich text editor.</p>
                </div>
                <div className="flex flex-col items-center text-center gap-2">
                    <div className="p-3 rounded-full bg-primary/10"><GitBranch className="h-8 w-8 text-primary" /></div>
                    <h3 className="font-bold font-headline text-xl">Mind Mapping</h3>
                    <p className="text-muted-foreground">Visualize your ideas, plan projects, and uncover new insights with an infinite canvas.</p>
                </div>
                 <div className="flex flex-col items-center text-center gap-2">
                    <div className="p-3 rounded-full bg-primary/10"><Repeat className="h-8 w-8 text-primary" /></div>
                    <h3 className="font-bold font-headline text-xl">Habit Tracker</h3>
                    <p className="text-muted-foreground">Build consistency and achieve your goals by tracking your daily habits.</p>
                </div>
                 <div className="flex flex-col items-center text-center gap-2">
                    <div className="p-3 rounded-full bg-primary/10"><Briefcase className="h-8 w-8 text-primary" /></div>
                    <h3 className="font-bold font-headline text-xl">Advanced CRM</h3>
                    <p className="text-muted-foreground">Manage your entire sales pipeline from lead to invoice with our integrated CRM.</p>
                </div>
                 <div className="flex flex-col items-center text-center gap-2">
                    <div className="p-3 rounded-full bg-primary/10"><GraduationCap className="h-8 w-8 text-primary" /></div>
                    <h3 className="font-bold font-headline text-xl">AI Learning Tools</h3>
                    <p className="text-muted-foreground">Turn any document into notes, quizzes, and flashcards instantly.</p>
                </div>
            </div>
          </div>
        </section>

      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-muted-foreground">&copy; 2024 Donevia. All rights reserved.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link href="#" className="text-xs hover:underline underline-offset-4">
            Terms of Service
          </Link>
          <Link href="#" className="text-xs hover:underline underline-offset-4">
            Privacy
          </Link>
        </nav>
      </footer>
    </div>
  );
}

    