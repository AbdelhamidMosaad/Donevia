
import type {Metadata} from 'next';
import { Toaster } from "@/components/ui/toaster"
import './globals.css';
import { Poppins, Inter, Roboto, Open_Sans, Lato, Source_Sans_3, Nunito, Montserrat, Playfair_Display, JetBrains_Mono, Space_Grotesk } from 'next/font/google';
import { AuthProvider } from '@/hooks/use-auth-provider';
import { PomodoroProvider } from '@/hooks/use-pomodoro';
import { StudyReminderProvider } from '@/hooks/use-study-reminders';
import { PlannerReminderProvider } from '@/hooks/use-planner-reminders';
import { ReminderDialogProvider } from '@/hooks/use-reminder-dialog';
import { StudyTimerProvider } from '@/hooks/use-study-timer';
import { TaskTimerProvider } from '@/hooks/use-task-timer';
import { TaskReminderProvider } from '@/hooks/use-task-reminders';
import { ReminderDialog } from '@/components/reminder-dialog';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const space_grotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-space-grotesk' });
const roboto = Roboto({ weight: ['400', '500', '700'], subsets: ['latin'], variable: '--font-roboto' });
const openSans = Open_Sans({ subsets: ['latin'], variable: '--font-open-sans' });
const lato = Lato({ weight: ['400', '700'], subsets: ['latin'], variable: '--font-lato' });
const poppins = Poppins({ weight: ['400', '500', '600', '700'], subsets: ['latin'], variable: '--font-poppins' });
const sourceSansPro = Source_Sans_3({ subsets: ['latin'], variable: '--font-source-sans-pro' });
const nunito = Nunito({ subsets: ['latin'], variable: '--font-nunito' });
const montserrat = Montserrat({ subsets: ['latin'], variable: '--font-montserrat' });
const playfairDisplay = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair-display' });
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jetbrains-mono' });


export const metadata: Metadata = {
  title: 'Donevia',
  description: 'A personal productivity management web application.',
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
       <head>
        <meta name="theme-color" content="#00AEEF" />
      </head>
      <body className={`antialiased ${inter.variable} ${roboto.variable} ${openSans.variable} ${lato.variable} ${poppins.variable} ${sourceSansPro.variable} ${nunito.variable} ${montserrat.variable} ${playfairDisplay.variable} ${jetbrainsMono.variable} ${space_grotesk.variable}`}>
        <AuthProvider>
          <TaskReminderProvider>
            <StudyReminderProvider>
              <ReminderDialogProvider>
                <PlannerReminderProvider>
                  <PomodoroProvider>
                      <TaskTimerProvider>
                        <StudyTimerProvider>
                            {children}
                           <ReminderDialog />
                        </StudyTimerProvider>
                      </TaskTimerProvider>
                  </PomodoroProvider>
                </PlannerReminderProvider>
              </ReminderDialogProvider>
            </StudyReminderProvider>
          </TaskReminderProvider>
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
