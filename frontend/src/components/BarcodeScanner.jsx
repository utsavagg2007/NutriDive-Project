import { useState, useRef, useEffect, useCallback } from "react";
import { Camera, X, Upload, RefreshCw, StopCircle, Play } from "lucide-react";
import { Button } from "./ui/button";
import { toast } from "sonner";

export default function BarcodeScanner({ onScan, onClose }) {
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [stream, setStream] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const animationRef = useRef(null);
  const detectorRef = useRef(null);

  // Initialize barcode detector
  useEffect(() => {
    if ('BarcodeDetector' in window) {
      detectorRef.current = new window.BarcodeDetector({
        formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'qr_code', 'itf']
      });
    }
  }, []);

  // Start camera
  const startCamera = useCallback(async () => {
    try {
      setHasError(false);
      setErrorMessage("");
      
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
          setIsScanning(true);
          startScanning();
        };
      }
    } catch (err) {
      console.error("Camera error:", err);
      setHasError(true);
      if (err.name === "NotAllowedError") {
        setErrorMessage("Camera access was denied. Please allow camera permissions in your browser settings.");
      } else if (err.name === "NotFoundError") {
        setErrorMessage("No camera found on this device.");
      } else {
        setErrorMessage(err.message || "Could not access camera");
      }
    }
  }, []);

  // Scan for barcodes
  const startScanning = useCallback(() => {
    if (!detectorRef.current) {
      // Fallback message if BarcodeDetector not supported
      toast.info("Live scanning not supported. Please upload a barcode image.");
      return;
    }

    const scanFrame = async () => {
      if (!videoRef.current || !isScanning) return;
      
      try {
        const barcodes = await detectorRef.current.detect(videoRef.current);
        if (barcodes.length > 0) {
          const barcode = barcodes[0].rawValue;
          toast.success(`Barcode detected: ${barcode}`);
          stopCamera();
          onScan(barcode);
          return;
        }
      } catch (err) {
        // Ignore detection errors, continue scanning
      }
      
      animationRef.current = requestAnimationFrame(scanFrame);
    };
    
    scanFrame();
  }, [isScanning, onScan]);

  // Stop camera
  const stopCamera = useCallback(() => {
    setIsScanning(false);
    
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, [stream]);

  // Handle close
  const handleClose = () => {
    stopCamera();
    onClose();
  };

  // Handle file upload
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      if ('BarcodeDetector' in window) {
        const detector = new window.BarcodeDetector({
          formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'qr_code', 'itf']
        });
        
        const barcodes = await detector.detect(img);
        
        if (barcodes.length > 0) {
          toast.success(`Barcode detected: ${barcodes[0].rawValue}`);
          handleClose();
          onScan(barcodes[0].rawValue);
          return;
        }
      }
      
      toast.error("Could not detect barcode in image. Please try a clearer image or enter manually.");
    } catch (error) {
      console.error("File scan error:", error);
      toast.error("Failed to scan image. Please try again.");
    }
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Start camera on mount
  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  // Restart scanning when isScanning changes
  useEffect(() => {
    if (isScanning && detectorRef.current) {
      startScanning();
    }
  }, [isScanning, startScanning]);

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 animate-fade-in">
      <div className="relative w-full max-w-lg">
        {/* Close button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute -top-12 right-0 text-white hover:bg-white/20 transition-all"
          onClick={handleClose}
          data-testid="close-scanner"
        >
          <X className="h-6 w-6" />
        </Button>

        <div className="bg-background rounded-2xl overflow-hidden shadow-2xl border border-border/50">
          {/* Header */}
          <div className="p-4 border-b bg-gradient-to-r from-primary/10 to-secondary/10">
            <h3 className="font-heading font-semibold flex items-center gap-2">
              <Camera className="h-5 w-5 text-primary" />
              Scan Barcode
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Point your camera at the barcode or upload an image
            </p>
          </div>

          {/* Video/Error Area */}
          <div className="relative aspect-video bg-black overflow-hidden">
            {hasError ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-gray-900 to-black text-white p-6 text-center">
                <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mb-4">
                  <Camera className="h-10 w-10 text-red-400" />
                </div>
                <p className="text-lg font-medium mb-2">Camera Access Required</p>
                <p className="text-sm text-gray-400 mb-6 max-w-xs">{errorMessage}</p>
                <div className="flex gap-3">
                  <Button onClick={startCamera} variant="secondary" size="sm" className="gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Retry
                  </Button>
                  <Button onClick={() => fileInputRef.current?.click()} variant="outline" size="sm" className="gap-2">
                    <Upload className="h-4 w-4" />
                    Upload Image
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {/* Video element */}
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  playsInline
                  muted
                  autoPlay
                />
                
                {/* Hidden canvas for processing */}
                <canvas ref={canvasRef} className="hidden" />
                
                {/* Scanner overlay */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="relative w-64 h-40 border-2 border-primary/50 rounded-lg">
                    {/* Scanning line animation */}
                    {isScanning && (
                      <div className="absolute inset-x-2 top-2 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent animate-[scan_2s_ease-in-out_infinite]" 
                        style={{
                          animation: "scan 2s ease-in-out infinite"
                        }}
                      />
                    )}
                    
                    {/* Corner brackets */}
                    <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-primary rounded-tl-lg" />
                    <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-primary rounded-tr-lg" />
                    <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-primary rounded-bl-lg" />
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-primary rounded-br-lg" />
                  </div>
                </div>

                {/* Status indicator */}
                <div className="absolute bottom-4 left-4 right-4 flex justify-center">
                  <div className="bg-black/70 backdrop-blur-sm rounded-full px-4 py-2 flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${isScanning ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`} />
                    <span className="text-white text-sm">
                      {isScanning ? "Scanning..." : "Initializing..."}
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 bg-muted/30">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {!('BarcodeDetector' in window) && "Upload an image to scan"}
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => fileInputRef.current?.click()}
                className="gap-2 hover:bg-primary hover:text-primary-foreground transition-colors"
                data-testid="upload-barcode"
              >
                <Upload className="h-4 w-4" />
                Upload Image
              </Button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes scan {
          0%, 100% { transform: translateY(0); opacity: 0.5; }
          50% { transform: translateY(140px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
