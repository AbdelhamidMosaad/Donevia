import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BrainCircuit } from "lucide-react";

export default function NotebooksPage() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <div className="mx-auto bg-primary/10 p-4 rounded-full">
            <BrainCircuit className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="mt-4 font-headline text-2xl">Notebooks</CardTitle>
          <CardDescription>Coming Soon!</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Organize your notes into a hierarchical structure of notebooks, sections, and pages. This powerful organizational tool is under construction.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
