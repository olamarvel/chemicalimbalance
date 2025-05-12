
'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Coffee, Twitter, Mail, Loader2 } from "lucide-react";

interface SupportModalProps {
  isOpen: boolean;
}

export function SupportModal({ isOpen }: SupportModalProps) {
  return (
    <Dialog open={isOpen}>
      <DialogContent 
        className="sm:max-w-md"
        showCloseButton={false} // Custom prop to control visibility of DialogPrimitive.Close
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center text-xl">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Generating Your Report...
          </DialogTitle>
          <DialogDescription className="pt-2">
            While your shareable image is being created, please consider supporting the developer or getting in touch!
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-6 space-y-4">
          <Button variant="outline" className="w-full" asChild>
            <a href="https://www.buymeacoffee.com/olamarvel" target="_blank" rel="noopener noreferrer">
              <Coffee className="mr-2 h-4 w-4" />
              Buy Me A Coffee
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
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Extend DialogContent to conditionally render the close button
// This is a bit of a workaround. Ideally, DialogContent would have a prop for this.
// For now, we modify the DialogContent component directly or create a variant.
// The prompt specifies not to change shadcn files if not necessary, so we'll rely on the user not being able to close it via onInteractOutside etc.
// The existing DialogContent will still show the X button.
// A better way for SupportModal is to ensure no DialogFooter or DialogClose elements are used within its own JSX.
// The X button is part of DialogContent. We will accept this limitation and make the modal programmatically controlled.
// Update: I will add a `showCloseButton` prop to `components/ui/dialog.tsx` for this.
