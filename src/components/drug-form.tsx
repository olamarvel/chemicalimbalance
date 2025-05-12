
'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription, // Import FormDescription
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { DrugAnalysisInput } from "@/types";
import { Loader2, Camera } from "lucide-react";
import { useState } from "react";
import { CameraModal } from "./camera-modal";
import { extractDrugInfoFromImage, type ExtractDrugInfoInput } from "@/ai/flows/extract-drug-info-flow";
import { useToast } from "@/hooks/use-toast";

const drugFormSchema = z.object({
  drugName: z.string().min(2, {
    // Allow shorter input for NAFDAC numbers potentially
    message: "Input must be at least 2 characters.",
  }),
  medicalConditions: z.string().optional(),
});

type DrugFormValues = z.infer<typeof drugFormSchema>;

interface DrugFormProps {
  onSubmit: (data: DrugAnalysisInput) => void;
  isLoading: boolean;
}

export function DrugForm({ onSubmit, isLoading }: DrugFormProps) {
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const { toast } = useToast();

  const form = useForm<DrugFormValues>({
    resolver: zodResolver(drugFormSchema),
    defaultValues: {
      drugName: "",
      medicalConditions: "",
    },
  });

  function handleSubmit(data: DrugFormValues) {
    onSubmit(data);
  }

  const handleImageCapture = async (imageDataUri: string) => {
    setIsProcessingImage(true);
    try {
      const input: ExtractDrugInfoInput = { photoDataUri: imageDataUri };
      const result = await extractDrugInfoFromImage(input);
      if (result.drugName) {
        form.setValue("drugName", result.drugName, { shouldValidate: true });
        toast({
          title: "Drug Name Extracted",
          description: `Found: ${result.drugName}. You can now analyze.`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Extraction Failed",
          description: "Could not extract drug name from the image. Please try again or enter manually.",
        });
      }
    } catch (error) {
      console.error("Error extracting drug info from image:", error);
      toast({
        variant: "destructive",
        title: "Error Processing Image",
        description: "An unexpected error occurred while analyzing the image.",
      });
    }
    setIsProcessingImage(false);
  };

  return (
    <>
      <Card className="w-full shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl">Drug Analysis</CardTitle>
          <CardDescription>Enter drug details and your medical conditions for a personalized report. You can also use your camera to snap a picture of the drug.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="drugName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Drug Name or NAFDAC Number</FormLabel>
                    <div className="flex items-center gap-2">
                      <FormControl>
                        <Input placeholder="e.g., Paracetamol or A4-1234" {...field} disabled={isProcessingImage || isLoading} />
                      </FormControl>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => setShowCameraModal(true)}
                        disabled={isProcessingImage || isLoading}
                        aria-label="Capture drug name with camera"
                      >
                        {isProcessingImage ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Camera className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                     <FormDescription>
                      Enter the drug's brand name, generic name, or its NAFDAC registration number.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="medicalConditions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Medical Conditions (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="e.g., Asthma, High blood pressure. Comma-separated."
                        className="resize-none"
                        rows={3}
                        {...field}
                        disabled={isLoading || isProcessingImage}
                      />
                    </FormControl>
                     <FormDescription>
                      Providing conditions helps generate more personalized AI insights.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" disabled={isLoading || isProcessingImage}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  "Analyze Drug"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      <CameraModal
        isOpen={showCameraModal}
        onClose={() => setShowCameraModal(false)}
        onCapture={handleImageCapture}
      />
    </>
  );
}
