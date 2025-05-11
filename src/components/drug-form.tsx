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
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { DrugAnalysisInput } from "@/types";
import { Loader2 } from "lucide-react";

const drugFormSchema = z.object({
  drugName: z.string().min(2, {
    message: "Drug name must be at least 2 characters.",
  }),
  medicalConditions: z.string().optional(),
});

type DrugFormValues = z.infer<typeof drugFormSchema>;

interface DrugFormProps {
  onSubmit: (data: DrugAnalysisInput) => void;
  isLoading: boolean;
}

export function DrugForm({ onSubmit, isLoading }: DrugFormProps) {
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

  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl">Drug Analysis</CardTitle>
        <CardDescription>Enter drug details and your medical conditions for a personalized report.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="drugName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Drug Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Paracetamol, Ibuprofen" {...field} />
                  </FormControl>
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
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" disabled={isLoading}>
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
  );
}
