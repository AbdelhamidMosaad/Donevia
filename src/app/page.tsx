
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LayoutDashboard, FileText, BotMessageSquare, GitBranch, PenSquare, BrainCircuit, Repeat, Briefcase, GraduationCap } from 'lucide-react';
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
  
  const features = [
    {
      icon: <Repeat className="h-8 w-8 text-primary" />,
      title: 'Build Winning Habits',
      description: 'Track daily habits with a weekly view, monitor progress with streaks, and build routines that lead to success.'
    },
    {
      icon: <Briefcase className="h-8 w-8 text-primary" />,
      title: 'Advanced CRM Pipeline',
      description: 'Manage clients from lead to invoice with a customizable Kanban board, win/loss tracking, and powerful analytics.'
    },
    {
      icon: <GraduationCap className="h-8 w-8 text-primary" />,
      title: 'AI-Powered Learning Tools',
      description: 'Turn any document or text into comprehensive lecture notes, custom quizzes, or interactive flashcards instantly.'
    }
  ];

  const otherFeatures = [
      {
        icon: <LayoutDashboard className="h-6 w-6 text-primary" />,
        title: 'Dynamic Task Management',
      },
      {
        icon: <BrainCircuit className="h-6 w-6 text-primary" />,
        title: 'OneNote-style Notebooks',
      },
      {
        icon: <PenSquare className="h-6 w-6 text-primary" />,
        title: 'Digital Whiteboard',
      },
      {
        icon: <GitBranch className="h-6 w-6 text-primary" />,
        title: 'Mind Mapping',
      },
  ]

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
    <div className="flex flex-col min-h-screen">
      <header className="px-4 lg:px-6 h-16 flex items-center bg-card shadow-sm">
        <Link href="#" className="flex items-center justify-center">
          <DoneviaLogo className="h-6 w-6" />
          <span className="ml-2 text-xl font-headline font-semibold">Donevia</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Button onClick={handleGoogleSignIn}>Get Started</Button>
        </nav>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-card">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold font-headline tracking-tighter sm:text-5xl xl:text-6xl/none">
                    The All-in-One Platform for Productivity and Growth
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl">
                    From tracking daily habits and managing complex client pipelines to leveraging AI for learning, Donevia integrates all the tools you need to succeed.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Button onClick={handleGoogleSignIn} size="lg">
                    Start for Free
                  </Button>
                </div>
              </div>
              <Image
                src="https://images.unsplash.com/photo-1555212697-194d092e3b8f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwyfHx2aWJyYW50JTIwcHJvZHVjdGl2aXR5fGVufDB8fHx8MTc1NzAyMTQxN3ww&ixlib=rb-4.1.0&q=80&w=1080"
                width="600"
                height="338"
                alt="Hero"
                data-ai-hint="creativity productivity"
                className="mx-auto aspect-video overflow-hidden rounded-xl object-cover sm:w-full lg:order-last"
              />
            </div>
          </div>
        </section>
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm">Key Features</div>
                <h2 className="text-3xl font-bold font-headline tracking-tighter sm:text-5xl">Everything You Need to Succeed</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Donevia combines powerful, distinct tools into one seamless workflow to help you achieve your goals.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-1 md:gap-12 lg:max-w-none lg:grid-cols-3 pt-12">
              {features.map((feature, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow duration-300 h-full">
                  <CardHeader className="flex flex-col items-center text-center gap-4">
                    {feature.icon}
                    <CardTitle>{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
             <div className="flex flex-col items-center justify-center space-y-4 text-center mt-16">
                <h3 className="text-2xl font-bold font-headline tracking-tighter sm:text-4xl">And So Much More...</h3>
                 <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                    Your integrated productivity suite also includes:
                </p>
                <div className="mx-auto grid max-w-4xl grid-cols-2 md:grid-cols-4 gap-8 pt-8">
                     {otherFeatures.map((feature, index) => (
                        <div key={index} className="flex flex-col items-center gap-2">
                            {feature.icon}
                            <span className="font-semibold">{feature.title}</span>
                        </div>
                    ))}
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
