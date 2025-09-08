
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase } from "lucide-react";

export default function CrmPage() {
  return (
    <div className="flex flex-col h-full">
       <div className="flex items-center gap-4 mb-6">
        <Briefcase className="h-8 w-8 text-primary"/>
        <div>
            <h1 className="text-3xl font-bold font-headline">Client Relationship Management</h1>
            <p className="text-muted-foreground">Manage your clients, deals, and sales pipeline.</p>
        </div>
      </div>
      <div className="flex flex-col items-center justify-center h-full text-center">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <div className="mx-auto bg-primary/10 p-4 rounded-full">
              <Briefcase className="h-12 w-12 text-primary" />
            </div>
            <CardTitle className="mt-4 font-headline text-2xl">CRM Dashboard</CardTitle>
            <CardDescription>Coming Soon!</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              A comprehensive dashboard to manage clients, track deals through a visual pipeline, and handle quotations and invoices is on its way.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
