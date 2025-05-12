
'use client';

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { ShieldAlert, FileText } from "lucide-react";

interface PrivacyNoticeModalProps {
  isOpen: boolean;
  onAccept: () => void;
}

export function PrivacyNoticeModal({ isOpen, onAccept }: PrivacyNoticeModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open && !isOpen) onAccept(); /* Allows no escape */}}>
      <DialogContent 
        className="sm:max-w-lg"
        onInteractOutside={(e) => e.preventDefault()} // Prevents closing by clicking outside
        onEscapeKeyDown={(e) => e.preventDefault()} // Prevents closing with Escape key
      >
        <DialogHeader>
          <DialogTitle className="flex items-center text-xl">
            <ShieldAlert className="mr-2 h-6 w-6 text-primary" />
            Important Notice & Privacy
          </DialogTitle>
          <DialogDescription className="text-left pt-2">
            Please read and accept the following terms before using the Chemical Imbalance application.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-4 text-sm max-h-[60vh] overflow-y-auto pr-2">
          <div className="space-y-1">
            <h3 className="font-semibold flex items-center">
              <FileText className="mr-2 h-4 w-4 text-primary" />
              Usage Terms
            </h3>
            <p className="text-muted-foreground">
              This application is provided &quot;as-is&quot; without any warranties, express or implied. You acknowledge that you use this application entirely at your own risk. The information provided is for educational purposes only and should not be considered a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition or medication.
            </p>
          </div>

          <div className="space-y-1">
            <h3 className="font-semibold flex items-center">
              <ShieldAlert className="mr-2 h-4 w-4 text-primary" />
              Privacy Policy
            </h3>
            <p className="text-muted-foreground">
              We respect your privacy. This application does not collect, store, or process any of your personal data beyond what is necessary for its immediate functionality. 
            </p>
            <ul className="list-disc list-inside pl-4 text-muted-foreground space-y-1">
              <li>All information you enter (drug names, medical conditions) is processed locally in your browser or sent directly to third-party APIs (like OpenFDA for drug data and Google&apos;s Genkit AI models for analysis) as required to provide the service.</li>
              <li>This data is not retained or stored by us on any servers after your session.</li>
              <li>Camera images captured for drug name extraction are processed in your browser and sent for analysis; these images are not stored by us.</li>
              <li>We use local storage in your browser solely to remember your acceptance of these terms and your last AI summary if you choose to use the app again.</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={onAccept} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
            I Understand and Accept
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
