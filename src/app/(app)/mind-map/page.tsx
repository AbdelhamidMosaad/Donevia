import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GitBranch } from "lucide-react";

export default function MindMapPage() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <div className="mx-auto bg-primary/10 p-4 rounded-full">
            <GitBranch className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="mt-4 font-headline text-2xl">Mind Mapping</CardTitle>
          <CardDescription>Coming Soon!</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            A flexible mind mapping tool with drag-and-drop nodes and extensive customization is being developed to help you visualize your ideas.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
