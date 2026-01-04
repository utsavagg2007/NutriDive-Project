import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Scan, Search, Waves, Upload, Camera, Sparkles, Zap } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent } from "../components/ui/card";
import BarcodeScanner from "../components/BarcodeScanner";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";

export default function HomePage() {
  const [barcode, setBarcode] = useState("");
  const [showScanner, setShowScanner] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!barcode.trim()) {
      toast.error("Please enter a barcode");
      return;
    }
    navigate(`/analysis/${barcode.trim()}`);
  };

  const handleScan = (scannedBarcode) => {
    setShowScanner(false);
    setBarcode(scannedBarcode);
    navigate(`/analysis/${scannedBarcode}`);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      if ('BarcodeDetector' in window) {
        const barcodeDetector = new window.BarcodeDetector({
          formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39']
        });
        const img = new Image();
        img.src = URL.createObjectURL(file);
        await new Promise(resolve => img.onload = resolve);
        const barcodes = await barcodeDetector.detect(img);
        if (barcodes.length > 0) {
          toast.success(`Barcode detected: ${barcodes[0].rawValue}`);
          navigate(`/analysis/${barcodes[0].rawValue}`);
          return;
        }
      }
      toast.error("Could not detect barcode. Please try a clearer image or enter manually.");
    } catch (error) {
      toast.error("Barcode detection failed. Please enter manually.");
    }
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-primary/5 to-transparent rounded-full" />
      </div>

      {/* Main Content */}
      <section className="relative py-12 md:py-20">
        <div className="container mx-auto px-4 md:px-8 lg:px-12">
          <div className="max-w-2xl mx-auto">
            {/* Welcome message */}
            <div className="text-center mb-10 animate-fade-in">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary/20 to-secondary/20 border border-primary/30 text-sm mb-6">
                <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                <span>Welcome back, {user?.name}!</span>
              </div>
              <h1 className="font-heading text-3xl md:text-4xl font-bold mb-4">
                Ready to <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Scan</span>?
              </h1>
              <p className="text-muted-foreground">
                Enter a barcode, scan with your camera, or upload an image
              </p>
            </div>

            {/* Main Scanner Card */}
            <Card className="relative overflow-hidden border-2 border-primary/20 shadow-2xl animate-fade-in stagger-1">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
              <CardContent className="p-8 relative">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Barcode Input */}
                  <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                      type="text"
                      placeholder="Enter barcode number..."
                      value={barcode}
                      onChange={(e) => setBarcode(e.target.value)}
                      className="pl-12 h-14 text-lg rounded-xl border-2 focus-visible:ring-primary/50 focus-visible:border-primary transition-all"
                      data-testid="barcode-input"
                    />
                    {barcode && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        <Zap className="h-5 w-5 text-primary animate-pulse" />
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Button
                      type="submit"
                      size="lg"
                      className="h-12 rounded-xl font-semibold bg-gradient-to-r from-primary to-green-600 hover:opacity-90 transition-all hover:scale-[1.02]"
                      disabled={!barcode.trim()}
                      data-testid="analyze-btn"
                    >
                      <Scan className="mr-2 h-5 w-5" />
                      Analyze
                    </Button>
                    
                    <Button
                      type="button"
                      variant="outline"
                      size="lg"
                      onClick={() => setShowScanner(true)}
                      className="h-12 rounded-xl font-semibold hover:bg-primary/10 hover:border-primary transition-all hover:scale-[1.02]"
                      data-testid="scan-btn"
                    >
                      <Camera className="mr-2 h-5 w-5" />
                      Camera
                    </Button>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="lg"
                      onClick={() => fileInputRef.current?.click()}
                      className="h-12 rounded-xl font-semibold hover:bg-secondary/10 hover:border-secondary transition-all hover:scale-[1.02]"
                      data-testid="upload-btn"
                    >
                      <Upload className="mr-2 h-5 w-5" />
                      Upload
                    </Button>
                  </div>
                </form>

                {/* Divider */}
                <div className="relative my-8">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border/50" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-card px-4 text-sm text-muted-foreground">or try a sample</span>
                  </div>
                </div>

                {/* Sample Barcodes */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { code: "3017620422003", name: "Nutella", emoji: "🍫" },
                    { code: "5449000000996", name: "Coca-Cola", emoji: "🥤" },
                    { code: "8001505005592", name: "Barilla Pasta", emoji: "🍝" },
                  ].map((item, i) => (
                    <Button
                      key={item.code}
                      variant="secondary"
                      className="h-auto py-3 px-4 rounded-xl flex flex-col items-center gap-1 hover:bg-primary/10 hover:text-primary transition-all hover:scale-[1.02] animate-fade-in"
                      style={{ animationDelay: `${0.1 * (i + 1)}s` }}
                      onClick={() => navigate(`/analysis/${item.code}`)}
                      data-testid={`sample-${item.code}`}
                    >
                      <span className="text-2xl">{item.emoji}</span>
                      <span className="font-medium text-sm">{item.name}</span>
                      <span className="font-mono text-xs text-muted-foreground">{item.code}</span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Tips */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in stagger-2">
              <Card className="bg-muted/30 border-0">
                <CardContent className="p-4 flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <Camera className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Camera Tips</p>
                    <p className="text-xs text-muted-foreground">Hold steady and ensure good lighting for best results</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-muted/30 border-0">
                <CardContent className="p-4 flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-secondary/20 flex items-center justify-center flex-shrink-0">
                    <Upload className="h-5 w-5 text-secondary-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Upload Tips</p>
                    <p className="text-xs text-muted-foreground">Clear, focused images work best for barcode detection</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {showScanner && <BarcodeScanner onScan={handleScan} onClose={() => setShowScanner(false)} />}
    </div>
  );
}
