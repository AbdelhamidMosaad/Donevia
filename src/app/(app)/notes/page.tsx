import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";

export default function NotesPage() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <div className="mx-auto bg-primary/10 p-4 rounded-full">
            <FileText className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="mt-4 font-headline text-2xl">Notes & Documents</CardTitle>
          <CardDescription>Coming Soon!</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            A powerful rich text editor with slash commands, document attachments, and full-text search is currently being built. Stay tuned!
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
