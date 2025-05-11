
'use client';

import { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Camera, VideoOff, AlertCircle, Zap } from 'lucide-react';

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (imageDataUri: string) => void;
}

export function CameraModal({ isOpen, onClose, onCapture }: CameraModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!isOpen) {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
      return;
    }

    const getCameraPermission = async () => {
      try {
        const cameraStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        setHasCameraPermission(true);
        setStream(cameraStream);
        if (videoRef.current) {
          videoRef.current.srcObject = cameraStream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description: 'Please enable camera permissions in your browser settings to use this feature.',
        });
      }
    };

    getCameraPermission();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, toast]); // stream dependency removed to prevent re-triggering on stream set

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current && hasCameraPermission) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageDataUri = canvas.toDataURL('image/jpeg');
        onCapture(imageDataUri);
        onClose();
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Camera className="mr-2 h-5 w-5" />
            Capture Drug Image
          </DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="relative aspect-video w-full bg-muted rounded-md overflow-hidden">
            <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
            {!hasCameraPermission && hasCameraPermission !== null && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white p-4">
                <VideoOff className="h-12 w-12 mb-2" />
                <p className="text-lg font-semibold">Camera access denied</p>
                <p className="text-sm text-center">Please enable camera permissions in your browser settings.</p>
              </div>
            )}
             {hasCameraPermission === null && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white p-4">
                 <p>Requesting camera permission...</p>
              </div>
            )}
          </div>
          <canvas ref={canvasRef} style={{ display: 'none' }} />
          {hasCameraPermission === false && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Camera Access Required</AlertTitle>
              <AlertDescription>
                Unable to access the camera. Please ensure permissions are granted in your browser settings.
              </AlertDescription>
            </Alert>
          )}
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <Button type="button" onClick={handleCapture} disabled={!hasCameraPermission || !stream}>
            <Zap className="mr-2 h-4 w-4" />
            Capture & Analyze
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
