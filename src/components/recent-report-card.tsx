import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Lightbulb } from "lucide-react";

interface RecentReportCardProps {
  summary: string | null;
}

export function RecentReportCard({ summary }: RecentReportCardProps) {
  if (!summary) {
    return null;
  }

  return (
    <Card className="w-full shadow-md bg-card border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          <Lightbulb className="mr-2 h-5 w-5 text-primary" />
          Last AI Summary
        </CardTitle>
        <CardDescription>This is the AI-generated summary from your last drug analysis.</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-32">
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{summary}</p>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
