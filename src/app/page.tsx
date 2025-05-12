
'use client';

import { useState, useEffect } from 'react';
import type { Report, DrugAnalysisInput } from '@/types';
import { getDrugReportAction } from '@/lib/actions';
import { AppHeader } from '@/components/layout/header';
import { DrugForm } from '@/components/drug-form';
import { ReportSection } from '@/components/report-section';
import { RecentReportCard } from '@/components/recent-report-card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";

const RECENT_SUMMARY_KEY = 'chemicalImbalanceRecentSummary';

export default function HomePage() {
  const [currentReport, setCurrentReport] = useState<Report | null>(null);
  const [submittedMedicalConditions, setSubmittedMedicalConditions] = useState<string | undefined>(undefined);
  const [recentReportSummary, setRecentReportSummary] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const storedSummary = localStorage.getItem(RECENT_SUMMARY_KEY);
      if (storedSummary) {
        setRecentReportSummary(storedSummary);
      }
    } catch (e) {
      // localStorage might not be available (e.g. SSR, private browsing)
      console.warn("Could not access localStorage for recent summary:", e);
    }
  }, []);

  const handleFormSubmit = async (data: DrugAnalysisInput) => {
    setIsLoading(true);
    setError(null);
    setCurrentReport(null);
    setSubmittedMedicalConditions(data.medicalConditions);

    const result = await getDrugReportAction(data);

    if ('error' in result) {
      setError(result.error);
    } else {
      setCurrentReport(result);
      setRecentReportSummary(result.aiSummary);
      try {
        localStorage.setItem(RECENT_SUMMARY_KEY, result.aiSummary);
      } catch (e) {
        console.warn("Could not save recent summary to localStorage:", e);
      }
    }
    setIsLoading(false);
  };

  const handleReset = () => {
    setCurrentReport(null);
    setSubmittedMedicalConditions(undefined);
    setRecentReportSummary(null);
    setError(null);
    setIsLoading(false);
    try {
      localStorage.removeItem(RECENT_SUMMARY_KEY);
    } catch (e) {
      console.warn("Could not clear recent summary from localStorage:", e);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader onReset={handleReset} />
      <main className="flex-1 container mx-auto py-8 px-4">
        <div className="max-w-2xl mx-auto space-y-8">
          {recentReportSummary && !currentReport && !isLoading && (
            <RecentReportCard summary={recentReportSummary} />
          )}

          <DrugForm onSubmit={handleFormSubmit} isLoading={isLoading} />

          {error && (
            <Alert variant="destructive" className="shadow-md">
              <Terminal className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {isLoading && !currentReport && (
             <div className="flex justify-center items-center p-8">
                <p className="text-lg text-muted-foreground">Generating report, please wait...</p>
             </div>
          )}

          {currentReport && <ReportSection report={currentReport} medicalConditions={submittedMedicalConditions} />}
        </div>
      </main>
      <footer className="py-6 text-center text-sm text-muted-foreground border-t">
        Disclaimer: This tool provides information for educational purposes only and is not a substitute for professional medical advice.
      </footer>
    </div>
  );
}
