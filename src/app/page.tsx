
'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Report, DrugAnalysisInput } from '@/types';
import { getDrugReportAction } from '@/lib/actions';
import { AppHeader } from '@/components/layout/header';
import { DrugForm } from '@/components/drug-form';
import { ReportSection } from '@/components/report-section';
import { RecentReportCard } from '@/components/recent-report-card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
// import { PrivacyNoticeModal } from '@/components/privacy-notice-modal';
import { Terminal, Coffee, Twitter, Mail, Loader2, PillBottle, Linkedin } from "lucide-react";
import dynamic from 'next/dynamic';

const PrivacyNoticeModal = dynamic(() => 
  import('@/components/privacy-notice-modal').then(mod => mod.PrivacyNoticeModal),
  { ssr: false, loading: () => <p>Loading privacy notice...</p> }
);


const RECENT_SUMMARY_KEY = 'chemicalImbalanceRecentSummary';
const PRIVACY_NOTICE_KEY = 'chemicalImbalancePrivacyAccepted_v1';

export default function HomePage() {
  const [currentReport, setCurrentReport] = useState<Report | null>(null);
  const [submittedMedicalConditions, setSubmittedMedicalConditions] = useState<string | undefined>(undefined);
  const [recentReportSummary, setRecentReportSummary] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isClient, setIsClient] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  useEffect(() => {
    setIsClient(true);
    try {
      const storedSummary = localStorage.getItem(RECENT_SUMMARY_KEY);
      if (storedSummary) {
        setRecentReportSummary(storedSummary);
      }
      const accepted = localStorage.getItem(PRIVACY_NOTICE_KEY) === 'true';
      setPrivacyAccepted(accepted);
      if (!accepted) {
        setShowPrivacyModal(true);
      }
    } catch (e) {
      console.warn("Could not access localStorage:", e);
      // If localStorage is not available, assume privacy not accepted for safety, show modal
      if (!privacyAccepted) {
        setShowPrivacyModal(true);
      }
    }
  }, []);


  const handleFormSubmit = useCallback(async (data: DrugAnalysisInput) => {
    if (!privacyAccepted) {
      setShowPrivacyModal(true);
      return;
    }
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
  }, [privacyAccepted]);

  const handleReset = useCallback(() => {
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
  }, []);

  const handleAcceptPrivacy = useCallback(() => {
    try {
      localStorage.setItem(PRIVACY_NOTICE_KEY, 'true');
    } catch (e) {
      console.warn("Could not save privacy acceptance to localStorage:", e);
    }
    setPrivacyAccepted(true);
    setShowPrivacyModal(false);
  }, []);

  if (!isClient) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading application...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col mx-auto py-8 px-4">
      <AppHeader onReset={handleReset} />
      <main className="flex-1 container ">
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
              <Loader2 className="mr-2 h-8 w-8 animate-spin text-primary" />
              <p className="text-lg text-muted-foreground">Generating report, please wait...</p>
            </div>
          )}

          {currentReport && <ReportSection report={currentReport} medicalConditions={submittedMedicalConditions} />}
        </div>
      </main>
      <footer className="py-6 text-center text-sm text-muted-foreground border-t mt-12">
        <div className="space-y-2 mb-6">
          <p className="text-xs">
            Built by a sickle cell disordered warrior for warriors everywhere.
            Now you can show your overbearing aunties, parents, and well-wishers just why that drug isn&apos;t meant for you.
          </p>
          <p className="text-xs font-semibold">
            Note: This app is used at the user&apos;s own risk.
          </p>
          <p>
            Disclaimer: This tool provides information for educational purposes only and is not a substitute for professional medical advice.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-4">
          <Button variant="secondary" size="sm" asChild>
            <a href="https://buymeacoffee.com/olatundema" target="_blank" rel="noopener noreferrer">
              <PillBottle className="mr-2 h-4 w-4" />
              Buy Me My SCD Medications. Just a token!
            </a>
          </Button>
          <div className="flex items-center gap-3">
            <a href="mailto:olatundemarvelousanthony@gmail.com" className="hover:text-primary transition-colors" aria-label="Email the developer">
              <Mail className="h-5 w-5" />
            </a>
            <a href="https://twitter.com/olamarvelcreate" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors" aria-label="Developer's Twitter profile">
              <Twitter className="h-5 w-5" />
            </a>
            <a href="https://www.linkedin.com/in/marvelous-anthony-olatunde-506486243/" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors" aria-label="Developer's Linkedin profile">
              <Linkedin className="h-5 w-5" />
            </a>
            <a href="https://www.linkedin.com/in/marvelous-anthony-olatunde-506486243/" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors" aria-label="Developer's Linkedin profile">
              <p>opened for roles.</p>
            </a>
          </div>

        </div>
      </footer>
      {isClient && showPrivacyModal && !privacyAccepted && <PrivacyNoticeModal isOpen={showPrivacyModal && !privacyAccepted} onAccept={handleAcceptPrivacy} /> }
    </div>
  );
}

