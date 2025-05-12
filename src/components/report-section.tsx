
import type { Report } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FlaskConical, AlertTriangle, Bot, Clock, ChevronDown, ChevronUp, Share2, Download } from "lucide-react";
import { formatDistanceToNow } from 'date-fns';
import { useState } from 'react';
import { generateReportImage } from '@/lib/image-generator';
import { useToast } from "@/hooks/use-toast";

interface ReportSectionProps {
  report: Report;
  medicalConditions?: string;
}

export function ReportSection({ report, medicalConditions }: ReportSectionProps) {
  const { toast } = useToast();
  const timeAgo = formatDistanceToNow(new Date(report.timestamp), { addSuffix: true });
  const [isSideEffectsExpanded, setIsSideEffectsExpanded] = useState(false);
  const SIDE_EFFECT_TRUNCATE_THRESHOLD = 3; // Number of items beyond which truncation UI appears

  const handleShareReport = async () => {
    toast({
      title: "Generating Report Image...",
      description: "Please wait a moment while we create your shareable image.",
    });
    try {
      const imageDataUri = await generateReportImage(report, medicalConditions);
      
      // Convert data URI to Blob for Web Share API
      const fetchRes = await fetch(imageDataUri);
      const blob = await fetchRes.blob();
      const imageFile = new File([blob], `${report.drugName}-Report.png`, { type: 'image/png' });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [imageFile] })) {
        await navigator.share({
          title: `${report.drugName} - Chemical Imbalance Report`,
          text: `Check out this personalized report for ${report.drugName}.`,
          files: [imageFile],
        });
        toast({
          title: "Report Shared!",
          description: "The report image has been prepared for sharing.",
        });
      } else {
        // Fallback to download
        const link = document.createElement('a');
        link.download = `${report.drugName}-Report.png`;
        link.href = imageDataUri;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast({
          title: "Report Image Downloaded",
          description: "The report image has been downloaded to your device.",
          action: (
            <Button variant="ghost" size="sm" onClick={() => window.open(imageDataUri, '_blank')}>
              <Download className="mr-2 h-4 w-4" />
              Open Image
            </Button>
          ),
        });
      }
    } catch (error) {
      if ((error as DOMException).name === 'AbortError') {
        // User cancelled the share dialog
        toast({
          variant: "default",
          title: "Sharing Cancelled",
          description: "You cancelled the sharing process.",
        });
      } else {
        console.error("Error generating or sharing report image:", error);
        toast({
          variant: "destructive",
          title: "Error Sharing Report",
          description: "Could not generate or share the report image. Please try again.",
        });
      }
    }
  };

  return (
    <Card className="w-full shadow-lg animate-in fade-in-50 duration-500">
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle className="text-3xl text-primary">{report.drugName}</CardTitle>
          <CardDescription>Detailed analysis and personalized AI summary from OpenFDA and AI.</CardDescription>
        </div>
        <Button variant="outline" size="icon" onClick={handleShareReport} aria-label="Share Report">
          <Share2 className="h-5 w-5" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {medicalConditions && medicalConditions.trim() !== "" && (
          <>
            <div>
              <h3 className="text-xl font-semibold mb-2 text-primary">
                Your Medical Conditions
              </h3>
              <p className="text-muted-foreground whitespace-pre-wrap">{medicalConditions}</p>
            </div>
            <Separator />
          </>
        )}
        <div>
          <h3 className="flex items-center text-xl font-semibold mb-2">
            <FlaskConical className="mr-2 h-5 w-5 text-primary" />
            Active Components
          </h3>
          {report.components.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {report.components.map((component) => (
                <Badge key={component.name} variant="secondary" className="text-sm px-3 py-1">
                  {component.name}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No active components listed.</p>
          )}
        </div>

        <Separator />

        <div>
          <h3 className="flex items-center text-xl font-semibold mb-2">
            <AlertTriangle className="mr-2 h-5 w-5 text-destructive" />
            Potential Side Effects / Warnings
          </h3>
          {report.sideEffects.length > 0 ? (
            <div> {/* Wrapper for list, fade, and button */}
              <div
                className={cn(
                  "relative overflow-hidden transition-all duration-300 ease-in-out",
                  isSideEffectsExpanded ? "max-h-[1000px]" : "max-h-32" // max-h-32 is approx 8rem, fits about 3-5 lines
                )}
              >
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  {report.sideEffects.map((effectText, index) => (
                    <li key={index} className="whitespace-pre-wrap">
                      {effectText}
                    </li>
                  ))}
                </ul>
                {!isSideEffectsExpanded && report.sideEffects.length > SIDE_EFFECT_TRUNCATE_THRESHOLD && (
                  <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-card via-card/80 to-transparent pointer-events-none" />
                )}
              </div>
              {report.sideEffects.length > SIDE_EFFECT_TRUNCATE_THRESHOLD && (
                <Button
                  variant="link"
                  size="sm"
                  className="mt-1 px-0 text-sm text-primary hover:text-primary/80 flex items-center"
                  onClick={() => setIsSideEffectsExpanded(!isSideEffectsExpanded)}
                  aria-expanded={isSideEffectsExpanded}
                >
                  {isSideEffectsExpanded ? "Show less" : "Show more"}
                  {isSideEffectsExpanded ? (
                    <ChevronUp className="ml-1 h-4 w-4" />
                  ) : (
                    <ChevronDown className="ml-1 h-4 w-4" />
                  )}
                </Button>
              )}
            </div>
          ) : (
            <p className="text-muted-foreground">
              No side effects or warnings information available from the source.
            </p>
          )}
        </div>

        <Separator />

        <div>
          <h3 className="flex items-center text-xl font-semibold mb-2">
            <Bot className="mr-2 h-5 w-5 text-accent" />
            Personalized AI Summary
          </h3>
          <div className="p-4 bg-secondary/50 rounded-md prose prose-sm max-w-none text-foreground whitespace-pre-wrap">
            {report.aiSummary}
          </div>
        </div>
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground">
        <Clock className="mr-1.5 h-3.5 w-3.5" />
        Report generated {timeAgo}. Drug data sourced from OpenFDA.
      </CardFooter>
    </Card>
  );
}
