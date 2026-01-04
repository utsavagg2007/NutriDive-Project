import { Link } from "react-router-dom";
import { Waves, Scan, Shield, Activity, ArrowRight, Sparkles, Zap } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { useAuth } from "../context/AuthContext";

export default function LandingPage() {
  const { user } = useAuth();

  const features = [
    { icon: Scan, title: "Smart Scanning", description: "Scan any barcode with your camera or upload an image", color: "from-blue-500 to-cyan-500" },
    { icon: Activity, title: "AI Health Analysis", description: "GPT-powered deep analysis of ingredients and nutrition", color: "from-green-500 to-emerald-500" },
    { icon: Shield, title: "Allergen Alerts", description: "Personalized warnings for your dietary restrictions", color: "from-orange-500 to-red-500" },
  ];

  return (
    <div className="min-h-[calc(100vh-8rem)] overflow-hidden">
      {/* Hero Section */}
      <section className="relative py-20 md:py-32">
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-primary/5 to-secondary/5 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 md:px-8 lg:px-12 relative">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary/20 to-secondary/20 border border-primary/30 text-sm mb-8 animate-fade-in backdrop-blur-sm">
              <Sparkles className="h-4 w-4 text-primary animate-pulse" />
              <span>AI-Powered Food Analysis</span>
              <Zap className="h-4 w-4 text-secondary" />
            </div>

            <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 animate-fade-in stagger-1">
              Dive Deep Into
              <span className="block bg-gradient-to-r from-primary via-green-500 to-secondary bg-clip-text text-transparent">
                What You Eat
              </span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto animate-fade-in stagger-2">
              Scan any food product to instantly unlock AI-powered health insights, 
              ingredient analysis, and personalized allergen warnings.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in stagger-3">
              {user ? (
                <Link to="/scan">
                  <Button size="lg" className="h-14 px-8 rounded-full font-semibold text-lg group">
                    Start Scanning
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              ) : (
                <>
                  <Link to="/register">
                    <Button size="lg" className="h-14 px-8 rounded-full font-semibold text-lg group bg-gradient-to-r from-primary to-green-600 hover:opacity-90">
                      Get Started Free
                      <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                  <Link to="/login">
                    <Button size="lg" variant="outline" className="h-14 px-8 rounded-full font-semibold text-lg">
                      Sign In
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 relative">
        <div className="container mx-auto px-4 md:px-8 lg:px-12">
          <div className="text-center mb-16">
            <h2 className="font-heading text-3xl md:text-4xl font-bold mb-4">
              Everything You Need to Know
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Make informed decisions about the food you consume with our comprehensive analysis tools
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card 
                key={feature.title} 
                className="group relative overflow-hidden border-0 bg-gradient-to-b from-muted/50 to-background hover:shadow-2xl transition-all duration-500 hover:-translate-y-2"
                style={{ animationDelay: `${0.1 * (index + 1)}s` }}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
                <CardContent className="p-8 relative">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="font-heading font-semibold text-xl mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-muted/30 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="container mx-auto px-4 md:px-8 lg:px-12 relative">
          <div className="text-center mb-16">
            <h2 className="font-heading text-3xl md:text-4xl font-bold mb-4">
              How It Works
            </h2>
            <p className="text-muted-foreground">Three simple steps to healthier choices</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { step: "1", title: "Scan or Upload", desc: "Use your camera or upload a barcode image", icon: "📸" },
              { step: "2", title: "AI Analyzes", desc: "Our AI examines all ingredients in seconds", icon: "🤖" },
              { step: "3", title: "Get Insights", desc: "Receive personalized health recommendations", icon: "✨" },
            ].map((item, i) => (
              <div key={item.step} className="relative text-center group">
                {i < 2 && (
                  <div className="hidden md:block absolute top-12 left-1/2 w-full h-0.5 bg-gradient-to-r from-primary/50 to-transparent" />
                )}
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center mx-auto mb-6 text-4xl group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  {item.icon}
                </div>
                <h3 className="font-heading font-semibold text-lg mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 md:px-8 lg:px-12">
          <Card className="relative overflow-hidden border-0 bg-gradient-to-r from-primary to-green-600">
            <div className="absolute inset-0 bg-grid-pattern opacity-10" />
            <CardContent className="p-12 md:p-16 text-center relative">
              <Waves className="h-16 w-16 mx-auto mb-6 text-white/80" />
              <h2 className="font-heading text-3xl md:text-4xl font-bold text-white mb-4">
                Ready to Dive In?
              </h2>
              <p className="text-white/80 mb-8 max-w-xl mx-auto">
                Join thousands of health-conscious consumers making better food choices every day.
              </p>
              <Link to={user ? "/scan" : "/register"}>
                <Button size="lg" variant="secondary" className="h-14 px-8 rounded-full font-semibold text-lg">
                  {user ? "Start Scanning" : "Create Free Account"}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
