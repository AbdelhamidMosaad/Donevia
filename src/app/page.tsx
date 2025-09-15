
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, LayoutDashboard, BrainCircuit, GitBranch, Repeat, Briefcase, GraduationCap } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { DoneviaLogo } from '@/components/logo';
import { auth } from '@/lib/firebase';
import { GoogleAuthProvider, signInWithPopup, AuthError } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useEffect } from 'react';
import { WelcomeScreen } from '@/components/welcome-screen';


export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();
  
  useEffect(() => {
    if (!loading && user) {
      router.push('/home');
    }
  }, [user, loading, router]);
  
  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      router.push('/home');
    } catch (error) {
      // Don't log an error if the user closes the popup
      const firebaseError = error as AuthError;
      if (firebaseError.code !== 'auth/popup-closed-by-user' && firebaseError.code !== 'auth/cancelled-popup-request') {
        console.error("Error signing in with Google: ", error);
      }
    }
  };
  
  if (loading || user) {
    return <WelcomeScreen />
  }

  return (
    <div className="flex flex-col min-h-screen bg-landing-gradient text-gray-800">
      <header className="px-4 lg:px-6 h-16 flex items-center bg-white/50 backdrop-blur-sm shadow-sm sticky top-0 z-50">
        <Link href="#" className="flex items-center justify-center">
          <DoneviaLogo className="h-6 w-6" />
          <span className="ml-2 text-xl font-headline font-semibold text-gray-900">Donevia</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Button onClick={handleGoogleSignIn} className="bg-violet-600 hover:bg-violet-700 text-white">Get Started</Button>
        </nav>
      </header>
      <main className="flex-1">
        <section className="w-full py-20 md:py-24 lg:py-32 xl:py-40">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-6 text-center">
                <div className="space-y-4">
                  <h1 className="text-4xl font-bold font-headline tracking-tighter sm:text-5xl md:text-6xl xl:text-7xl/none bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-blue-500">
                    The Unified Workspace for Peak Performance
                  </h1>
                  <p className="max-w-[700px] mx-auto text-gray-600 md:text-xl">
                    Stop switching between apps. Donevia brings your tasks, notes, habits, clients, and goals into one intelligent platform designed for focus and growth.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                   <Button onClick={handleGoogleSignIn} size="lg" className="bg-violet-600 hover:bg-violet-700 text-white shadow-lg">
                    Start for Free
                  </Button>
                </div>
            </div>
          </div>
        </section>

        <section id="features" className="w-full py-12 md:py-24 lg:py-32 bg-white/60 backdrop-blur-md">
            <div className="container px-4 md:px-6 space-y-20">
                
                {/* Feature 1: Advanced CRM */}
                <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
                    <div className="space-y-4">
                        <div className="inline-block rounded-lg bg-violet-100 px-3 py-1 text-sm text-violet-700 font-medium">Advanced CRM</div>
                        <h2 className="text-3xl font-bold font-headline tracking-tighter sm:text-4xl text-gray-900">From Lead to Invoice, Seamlessly</h2>
                        <p className="text-gray-600 md:text-lg">
                            Transform your client management with a powerful, visual pipeline. Track requests, manage sales stages, and analyze performance without leaving your workspace.
                        </p>
                        <ul className="grid gap-3">
                            <li className="flex items-start gap-3">
                                <CheckCircle className="mt-1 h-5 w-5 text-violet-600" />
                                <span><strong>Visual Kanban Pipeline:</strong> Drag-and-drop client requests through customizable stages from 'New Request' to 'Win'.</span>
                            </li>
                             <li className="flex items-start gap-3">
                                <CheckCircle className="mt-1 h-5 w-5 text-violet-600" />
                                <span><strong>Insightful Analytics:</strong> Track win/loss ratios, deal values, and loss reasons to optimize your sales process.</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <CheckCircle className="mt-1 h-5 w-5 text-violet-600" />
                                <span><strong>Integrated Client Hub:</strong> Manage client details, custom fields, quotations, and invoices all in one place.</span>
                            </li>
                        </ul>
                    </div>
                     <Image
                        src="https://images.unsplash.com/photo-1542626991-cbc4e32524cc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwzfHx0YXNrJTIwbWFuYWdlbWVudHxlbnwwfHx8fDE3NTcyNDE3MDJ8MA&ixlib=rb-4.1.0&q=80&w=1080"
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
                        src="https://images.unsplash.com/photo-1550534791-2677533605ab?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxNXx8dGltZSUyMG1hbmFnZW1lbnR8ZW58MHx8fHwxNzU3MjQxODkxfDA&ixlib=rb-4.1.0&q=80&w=1080"
                        width="600"
                        height="400"
                        alt="Habit Tracker"
                        data-ai-hint="time management"
                        className="mx-auto aspect-video overflow-hidden rounded-xl object-cover lg:order-last"
                      />
                    <div className="space-y-4">
                        <div className="inline-block rounded-lg bg-blue-100 px-3 py-1 text-sm text-blue-700 font-medium">Habit Tracker</div>
                        <h2 className="text-3xl font-bold font-headline tracking-tighter sm:text-4xl text-gray-900">Build Consistency, Achieve Greatness</h2>
                        <p className="text-gray-600 md:text-lg">
                           The key to success is consistency. Our intuitive habit tracker helps you build winning routines, monitor your progress, and stay motivated.
                        </p>
                        <ul className="grid gap-3">
                            <li className="flex items-start gap-3">
                                <CheckCircle className="mt-1 h-5 w-5 text-blue-600" />
                                <span><strong>Weekly View:</strong> Easily check off your daily habits in a clean, weekly calendar format.</span>
                            </li>
                             <li className="flex items-start gap-3">
                                <CheckCircle className="mt-1 h-5 w-5 text-blue-600" />
                                <span><strong>Track Your Streaks:</strong> Visualize your progress and build momentum by tracking your completion streaks over time.</span>
                            </li>
                        </ul>
                    </div>
                </div>

                 {/* Feature 3: AI Learning Tools */}
                <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
                    <div className="space-y-4">
                        <div className="inline-block rounded-lg bg-violet-100 px-3 py-1 text-sm text-violet-700 font-medium">AI Learning Tools</div>
                        <h2 className="text-3xl font-bold font-headline tracking-tighter sm:text-4xl text-gray-900">Learn Smarter, Not Harder</h2>
                        <p className="text-gray-600 md:text-lg">
                           Turn any document, lecture, or text into a powerful learning asset. Our AI tools help you understand and retain information more effectively.
                        </p>
                        <ul className="grid gap-3">
                            <li className="flex items-start gap-3">
                                <CheckCircle className="mt-1 h-5 w-5 text-violet-600" />
                                <span><strong>Instant Notes:</strong> Upload a file (PDF, DOCX) or paste text to generate comprehensive, well-structured notes.</span>
                            </li>
                             <li className="flex items-start gap-3">
                                <CheckCircle className="mt-1 h-5 w-5 text-violet-600" />
                                <span><strong>Custom Quizzes:</strong> Test your knowledge by creating quizzes with various question types and get instant feedback.</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <CheckCircle className="mt-1 h-5 w-5 text-violet-600" />
                                <span><strong>Interactive Flashcards:</strong> Master key concepts with generated flashcards, perfect for quick review sessions.</span>
                            </li>
                        </ul>
                    </div>
                     <Image
                        src="https://images.unsplash.com/photo-1483058712412-4245e9b90334?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwyfHxwcm9kdWN0aXZpdHl8ZW58MHx8fHwxNzU3MjQyMDAyfDA&ixlib=rb-4.1.0&q=80&w=1080"
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
                <h2 className="text-3xl font-bold font-headline tracking-tighter sm:text-5xl text-gray-900">An Entire Suite of Tools</h2>
                <p className="max-w-[900px] text-gray-600 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Donevia is more than just a few features. It's an integrated ecosystem for productivity.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-2 md:gap-12 lg:max-w-none lg:grid-cols-3 pt-12">
                <div className="flex flex-col items-center text-center gap-2">
                    <div className="p-3 rounded-full bg-blue-100"><LayoutDashboard className="h-8 w-8 text-blue-600" /></div>
                    <h3 className="font-bold font-headline text-xl text-gray-900">Task Management</h3>
                    <p className="text-gray-600">Organize your work with boards, lists, and a calendar view. Your tasks, your way.</p>
                </div>
                <div className="flex flex-col items-center text-center gap-2">
                    <div className="p-3 rounded-full bg-blue-100"><BrainCircuit className="h-8 w-8 text-blue-600" /></div>
                    <h3 className="font-bold font-headline text-xl text-gray-900">OneNote-style Notebooks</h3>
                    <p className="text-gray-600">Capture your ideas in flexible, powerful notebooks with a rich text editor.</p>
                </div>
                <div className="flex flex-col items-center text-center gap-2">
                    <div className="p-3 rounded-full bg-blue-100"><GitBranch className="h-8 w-8 text-blue-600" /></div>
                    <h3 className="font-bold font-headline text-xl text-gray-900">Mind Mapping</h3>
                    <p className="text-gray-600">Visualize your ideas, plan projects, and uncover new insights with an infinite canvas.</p>
                </div>
                 <div className="flex flex-col items-center text-center gap-2">
                    <div className="p-3 rounded-full bg-blue-100"><Repeat className="h-8 w-8 text-blue-600" /></div>
                    <h3 className="font-bold font-headline text-xl text-gray-900">Habit Tracker</h3>
                    <p className="text-gray-600">Build consistency and achieve your goals by tracking your daily habits.</p>
                </div>
                 <div className="flex flex-col items-center text-center gap-2">
                    <div className="p-3 rounded-full bg-blue-100"><Briefcase className="h-8 w-8 text-blue-600" /></div>
                    <h3 className="font-bold font-headline text-xl text-gray-900">Advanced CRM</h3>
                    <p className="text-gray-600">Manage your entire sales pipeline from lead to invoice with our integrated CRM.</p>
                </div>
                 <div className="flex flex-col items-center text-center gap-2">
                    <div className="p-3 rounded-full bg-blue-100"><GraduationCap className="h-8 w-8 text-blue-600" /></div>
                    <h3 className="font-bold font-headline text-xl text-gray-900">AI Learning Tools</h3>
                    <p className="text-gray-600">Turn any document into notes, quizzes, and flashcards instantly.</p>
                </div>
            </div>
          </div>
        </section>

      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t border-gray-200">
        <p className="text-xs text-gray-500">&copy; 2024 Donevia. All rights reserved.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link href="/terms" className="text-xs hover:underline underline-offset-4 text-gray-600">
            Terms of Service
          </Link>
          <Link href="/privacy" className="text-xs hover:underline underline-offset-4 text-gray-600">
            Privacy
          </Link>
        </nav>
      </footer>
    </div>
  );
}


    
