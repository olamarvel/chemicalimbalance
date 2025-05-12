
'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Coffee, Twitter, Mail, Loader2, CheckCheckIcon, PillBottle, Linkedin } from "lucide-react";

interface SupportModalProps {
  isOpen: boolean;
  isImageGenerated: boolean;
  canShare: boolean;
  onShareButtonClick: () => void;
  onOpenChange: (isOpen: boolean) => void; // Added this line
}

export function SupportModal({ isOpen, isImageGenerated, canShare, onShareButtonClick, onOpenChange }: SupportModalProps) {
  return (
    <Dialog
      open={isOpen}
      onOpenChange={onOpenChange} // Use the new prop here
    >
      <DialogContent
        className="sm:max-w-md"
        // Removed showCloseButton as Radix Dialog handles close via X button and overlay click by default if onOpenChange is correctly wired
      >
        <DialogHeader>
          <DialogTitle className="flex items-center text-xl">
            {canShare ? (
              <CheckCheckIcon className="mr-2 h-5 w-5 text-primary" />
            ) : (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            )}
            {canShare ? 'Report Ready to Share!' : 'Generating Your Report Image...'}
          </DialogTitle>
          <DialogDescription className="pt-2">
            {canShare
              ? 'Your shareable report image is ready. Click the button below to share it!'
              : isImageGenerated
                ? 'Report image generated. The share button will be active in a moment. Please consider supporting the developer or getting in touch!'
                : 'While your shareable image is being created, please consider supporting the developer or getting in touch!'}
          </DialogDescription>
        </DialogHeader>

        <div className="py-6 space-y-4">
          <Button variant="outline" className="w-full" onClick={onShareButtonClick} disabled={!canShare && !isImageGenerated}>
            <p> Share Report Image </p>
          </Button>
          <Button variant="outline" className="w-full" asChild>
            <a href="https://buymeacoffee.com/olatundema" target="_blank" rel="noopener noreferrer">
            <PillBottle className="mr-2 h-4 w-4" />
            Buy Me My SCD Medications. Just a token!
            </a>
          </Button>

          <div className="text-center text-sm text-muted-foreground">
            Or connect with me:
          </div>

          <div className="flex justify-center items-center gap-6">
            <a
              href="mailto:olatundemarvelousanthony@gmail.com"
              className="flex flex-col items-center text-muted-foreground hover:text-primary transition-colors"
              aria-label="Email the developer"
            >
              <Mail className="h-6 w-6 mb-1" />
              Email
            </a>
            <a
              href="https://twitter.com/olamarvelcreate"
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center text-muted-foreground hover:text-primary transition-colors"
              aria-label="Developer's Twitter profile"
            >
              <Twitter className="h-6 w-6 mb-1" />
              Twitter
            </a>
            <a
              href="https://www.linkedin.com/in/marvelous-anthony-olatunde-506486243/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center text-muted-foreground hover:text-primary transition-colors"
              aria-label="Developer's LinkedIn profile"
            >
              <Linkedin className="h-5 w-5" />
              Linkedin
            </a>
          </div>
          <p className="text-center text-sm text-muted-foreground">  -opened for roles </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
