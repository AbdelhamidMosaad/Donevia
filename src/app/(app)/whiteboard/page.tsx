import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PenSquare } from "lucide-react";

export default function WhiteboardPage() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <div className="mx-auto bg-primary/10 p-4 rounded-full">
            <PenSquare className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="mt-4 font-headline text-2xl">Digital Whiteboard</CardTitle>
          <CardDescription>Coming Soon!</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Get ready to brainstorm on an infinite canvas with drawing tools, sticky notes, shapes, and real-time collaboration. This feature is on its way.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
