import { MainLayout } from '@/components/main-layout';
import { Toaster } from '@/components/ui/toaster';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <MainLayout>{children}</MainLayout>
      <Toaster />
    </>
  );
}
