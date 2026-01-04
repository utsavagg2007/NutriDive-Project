import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { 
  ArrowLeft, Loader2, Package, Leaf, AlertTriangle, Activity, Info,
  Circle, Egg, Drumstick, Sparkles, Shield, AlertCircle
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Separator } from "../components/ui/separator";
import { Progress } from "../components/ui/progress";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import NutriScoreBadge from "../components/NutriScoreBadge";
import ConfidenceMeter from "../components/ConfidenceMeter";
import ChatPanel from "../components/ChatPanel";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { toast } from "sonner";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Common allergens to check for
const COMMON_ALLERGENS = {
  nuts: ["nut", "almond", "cashew", "walnut", "pecan", "pistachio", "hazelnut", "peanut"],
  dairy: ["milk", "cream", "cheese", "butter", "lactose", "whey", "casein", "yogurt"],
  gluten: ["wheat", "gluten", "barley", "rye", "oat", "semolina", "spelt"],
  soy: ["soy", "soya", "lecithin"],
  eggs: ["egg", "albumin", "lysozyme", "mayonnaise"],
  shellfish: ["shrimp", "crab", "lobster", "shellfish", "prawn"],
  fish: ["fish", "anchovy", "cod", "salmon", "tuna"],
  sesame: ["sesame", "tahini"]
};

const FoodTypeBadge = ({ type }) => {
  const config = {
    veg: { color: "bg-green-500", label: "Vegetarian", icon: Circle },
    egg: { color: "bg-yellow-500", label: "Contains Egg", icon: Egg },
    "non-veg": { color: "bg-red-500", label: "Non-Vegetarian", icon: Drumstick },
  };
  const { color, label, icon: Icon } = config[type] || config.veg;
  
  return (
    <Badge variant="outline" className="gap-1.5 animate-fade-in group hover:scale-105 transition-transform">
      <span className={`w-3 h-3 rounded-full ${color} group-hover:animate-pulse`} />
      {label}
    </Badge>
  );
};

const detectAllergens = (ingredientsText) => {
  if (!ingredientsText) return [];
  const text = ingredientsText.toLowerCase();
  const found = [];
  
  for (const [allergen, keywords] of Object.entries(COMMON_ALLERGENS)) {
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        found.push({ name: allergen, keyword, color: getAllergenColor(allergen) });
        break;
      }
    }
  }
  return found;
};

const getAllergenColor = (allergen) => {
  const colors = {
    nuts: "bg-amber-500",
    dairy: "bg-blue-400",
    gluten: "bg-orange-500",
    soy: "bg-green-500",
    eggs: "bg-yellow-400",
    shellfish: "bg-red-400",
    fish: "bg-cyan-500",
    sesame: "bg-stone-500"
  };
  return colors[allergen] || "bg-gray-500";
};

export default function AnalysisPage() {
  const { barcode } = useParams();
  const { user } = useAuth();
  const [analysis, setAnalysis] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [detectedAllergens, setDetectedAllergens] = useState([]);

  useEffect(() => {
    const fetchAnalysis = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await axios.post(`${API}/analyze/${barcode}`);
        setAnalysis(response.data);
        
        // Detect common allergens
        const rawIngredients = response.data.raw_product_data?.ingredients || "";
        setDetectedAllergens(detectAllergens(rawIngredients));
      } catch (err) {
        const message = err.response?.data?.detail || "Failed to analyze product";
        setError(message);
        toast.error(message);
      } finally {
        setIsLoading(false);
      }
    };
    if (barcode) fetchAnalysis();
  }, [barcode]);

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center">
        <div className="text-center">
          <div className="relative inline-block">
            <div className="w-20 h-20 rounded-full bg-gradient-to-r from-primary to-secondary animate-spin opacity-20" />
            <Loader2 className="h-12 w-12 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-spin text-primary" />
          </div>
          <p className="text-lg font-medium mt-6 animate-pulse">Analyzing product...</p>
          <p className="text-sm text-muted-foreground mt-1">AI is diving deep into ingredients</p>
          <div className="flex justify-center gap-1 mt-4">
            {[0, 1, 2].map(i => (
              <div key={i} className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center">
        <div className="text-center max-w-md animate-fade-in">
          <div className="w-20 h-20 rounded-full bg-destructive/20 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="h-10 w-10 text-destructive" />
          </div>
          <h2 className="text-xl font-heading font-semibold mb-2">Analysis Failed</h2>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Link to="/scan"><Button data-testid="back-home"><ArrowLeft className="mr-2 h-4 w-4" />Try Another Product</Button></Link>
        </div>
      </div>
    );
  }

  if (!analysis) return null;

  const { product_summary, relevant_ingredients, all_ingredients, minority_ingredients, nutritional_insights, nutriscore, confidence_meter, nutrition_facts, allergen_warnings } = analysis;

  return (
    <div className="py-8 relative" data-testid="analysis-page">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 md:px-8 lg:px-12 relative">
        <Link to="/scan"><Button variant="ghost" className="mb-6 animate-fade-in hover:bg-primary/10" data-testid="back-btn"><ArrowLeft className="mr-2 h-4 w-4" />Back to Scanner</Button></Link>

        {/* Product Header */}
        <div className="mb-8 animate-fade-in">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="font-mono bg-muted/50">{barcode}</Badge>
                <FoodTypeBadge type={product_summary?.food_type || "veg"} />
              </div>
              <h1 className="font-heading text-2xl md:text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                {product_summary?.name || "Unknown Product"}
              </h1>
              <p className="text-muted-foreground">{product_summary?.brand || "Unknown Brand"} • {product_summary?.quantity || ""}</p>
              {product_summary?.categories?.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {product_summary.categories.slice(0, 3).map((cat, i) => (
                    <Badge key={i} variant="secondary" className="text-xs animate-fade-in hover:scale-105 transition-transform" style={{ animationDelay: `${i * 0.1}s` }}>{cat.trim()}</Badge>
                  ))}
                </div>
              )}
            </div>
            <div className="flex-shrink-0 animate-fade-in stagger-2">
              <NutriScoreBadge score={nutriscore?.score_out_of_5} grade={nutriscore?.grade} size="large" />
            </div>
          </div>
        </div>

        {/* User's Allergen Warnings */}
        {allergen_warnings?.length > 0 && (
          <Card className="mb-6 border-destructive bg-gradient-to-r from-destructive/10 to-destructive/5 animate-fade-in overflow-hidden" data-testid="allergen-warnings">
            <div className="absolute top-0 right-0 w-32 h-32 bg-destructive/10 rounded-full blur-2xl" />
            <CardHeader className="pb-2">
              <CardTitle className="text-destructive flex items-center gap-2"><AlertTriangle className="h-5 w-5 animate-pulse" />Personal Allergen Alert!</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">Based on your profile, this product contains:</p>
              <div className="flex flex-wrap gap-2">
                {allergen_warnings.map((w, i) => (
                  <Badge key={i} variant="destructive" className="animate-pulse text-sm">{w.allergen}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Common Allergens Found */}
        {detectedAllergens.length > 0 && (
          <Card className="mb-6 border-orange-500/30 bg-gradient-to-r from-orange-500/10 to-amber-500/5 animate-fade-in stagger-1" data-testid="common-allergens">
            <CardHeader className="pb-2">
              <CardTitle className="text-orange-600 dark:text-orange-400 flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Common Allergens Detected
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">This product may contain or be processed with:</p>
              <div className="flex flex-wrap gap-2">
                {detectedAllergens.map((a, i) => (
                  <Badge 
                    key={i} 
                    className={`${a.color} text-white capitalize animate-fade-in hover:scale-105 transition-transform`}
                    style={{ animationDelay: `${i * 0.1}s` }}
                  >
                    {a.name}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Tabs for Ingredients & Nutrition */}
            <Card className="animate-fade-in stagger-1 overflow-hidden" data-testid="main-card">
              <Tabs defaultValue="key-ingredients" className="w-full">
                <CardHeader className="bg-gradient-to-r from-muted/50 to-transparent">
                  <TabsList className="grid w-full grid-cols-3 bg-muted/50">
                    <TabsTrigger value="key-ingredients" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Key Ingredients</TabsTrigger>
                    <TabsTrigger value="all-ingredients" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">All Ingredients</TabsTrigger>
                    <TabsTrigger value="nutrition" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Nutrition</TabsTrigger>
                  </TabsList>
                </CardHeader>
                <CardContent className="p-6">
                  <TabsContent value="key-ingredients" className="space-y-3 mt-0">
                    {relevant_ingredients?.length > 0 ? (
                      <Accordion type="single" collapsible className="w-full">
                        {relevant_ingredients.map((ing, i) => (
                          <AccordionItem key={i} value={`ing-${i}`} className="border rounded-xl px-4 mb-2 animate-fade-in hover:shadow-md transition-shadow" style={{ animationDelay: `${i * 0.1}s` }}>
                            <AccordionTrigger className="hover:no-underline py-4">
                              <div className="flex items-center gap-3 text-left">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                                  <Leaf className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                  <p className="font-heading font-medium">{ing.name}</p>
                                  <p className="text-xs text-muted-foreground font-mono">{ing.estimated_concentration}</p>
                                </div>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="pb-4 pl-14 space-y-3">
                              <div className="p-3 rounded-lg bg-muted/30"><p className="text-xs font-medium text-muted-foreground uppercase mb-1">Health Impact</p><p className="text-sm">{ing.health_impact}</p></div>
                              <div className="p-3 rounded-lg bg-muted/30"><p className="text-xs font-medium text-muted-foreground uppercase mb-1">Long-term Effects</p><p className="text-sm">{ing.long_term_effects}</p></div>
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    ) : <p className="text-muted-foreground text-center py-8">No ingredient data available</p>}
                  </TabsContent>

                  <TabsContent value="all-ingredients" className="mt-0">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {(all_ingredients?.length > 0 ? all_ingredients : relevant_ingredients)?.map((ing, i) => (
                        <div key={i} className="p-3 rounded-lg bg-gradient-to-br from-muted/50 to-muted/30 text-sm animate-fade-in hover:scale-[1.02] transition-transform cursor-default" style={{ animationDelay: `${i * 0.03}s` }}>
                          <p className="font-medium">{ing.name}</p>
                          {ing.percentage && <p className="text-xs text-muted-foreground">{ing.percentage}</p>}
                        </div>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="nutrition" className="mt-0">
                    <div className="space-y-1">
                      {nutrition_facts?.length > 0 ? nutrition_facts.map((fact, i) => (
                        <div key={i} className="flex justify-between items-center py-3 px-4 rounded-lg hover:bg-muted/30 transition-colors animate-fade-in" style={{ animationDelay: `${i * 0.05}s` }}>
                          <span className="font-medium">{fact.name}</span>
                          <span className="text-muted-foreground font-mono">{fact.value} {fact.unit}</span>
                        </div>
                      )) : <p className="text-muted-foreground text-center py-8">No nutrition data available</p>}
                    </div>
                  </TabsContent>
                </CardContent>
              </Tabs>
            </Card>

            {/* Trace Ingredients */}
            {minority_ingredients?.length > 0 && (
              <Card className="animate-fade-in stagger-2 border-orange-500/30" data-testid="minority-card">
                <CardHeader className="bg-gradient-to-r from-orange-500/10 to-transparent">
                  <CardTitle className="flex items-center gap-2 font-heading text-orange-600 dark:text-orange-400">
                    <AlertCircle className="h-5 w-5" />
                    Trace Ingredients to Note
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <Accordion type="single" collapsible className="w-full">
                    {minority_ingredients.map((ing, i) => (
                      <AccordionItem key={i} value={`min-${i}`} className="border border-orange-500/20 bg-orange-500/5 rounded-xl px-4 mb-2 animate-fade-in" style={{ animationDelay: `${i * 0.1}s` }}>
                        <AccordionTrigger className="hover:no-underline py-4">
                          <div className="flex items-center gap-3 text-left">
                            <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
                              <AlertTriangle className="h-5 w-5 text-orange-500" />
                            </div>
                            <div>
                              <p className="font-heading font-medium">{ing.name}</p>
                              <Badge variant="outline" className="text-xs border-orange-500/50 text-orange-600">Notable</Badge>
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pb-4 pl-14 space-y-3">
                          <div className="p-3 rounded-lg bg-orange-500/10"><p className="text-xs font-medium text-muted-foreground uppercase mb-1">Why It Matters</p><p className="text-sm">{ing.reason_for_attention}</p></div>
                          <div className="p-3 rounded-lg bg-orange-500/10"><p className="text-xs font-medium text-muted-foreground uppercase mb-1">Long-term Risk</p><p className="text-sm">{ing.potential_long_term_risk}</p></div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            )}

            {/* Health Insights */}
            <Card className="animate-fade-in stagger-3" data-testid="insights-card">
              <CardHeader className="bg-gradient-to-r from-primary/10 to-transparent">
                <CardTitle className="flex items-center gap-2 font-heading"><Activity className="h-5 w-5 text-primary" />Health Insights</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                  <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />Overall Assessment
                  </h4>
                  <p className="text-foreground">{nutritional_insights?.overall_assessment || "No assessment available"}</p>
                </div>
                <div className="p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                  <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-2">Who Should Limit</h4>
                  <p>{nutritional_insights?.who_should_limit_consumption || "No restrictions"}</p>
                </div>
                <div className="p-4 rounded-xl bg-gradient-to-r from-primary/10 to-secondary/10">
                  <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-2">Recommendation</h4>
                  <p className="font-medium">{nutritional_insights?.usage_recommendation || "No recommendations"}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <Card className="animate-fade-in stagger-1 overflow-hidden" data-testid="nutriscore-card">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5" />
              <CardHeader><CardTitle className="font-heading">NutriScore</CardTitle></CardHeader>
              <CardContent className="relative">
                <div className="flex flex-col items-center text-center">
                  <NutriScoreBadge score={nutriscore?.score_out_of_5} grade={nutriscore?.grade} size="large" />
                  <p className="text-5xl font-heading font-bold mt-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    {nutriscore?.score_out_of_5 || "?"}/5
                  </p>
                  <p className="text-sm text-muted-foreground mt-4 leading-relaxed">{nutriscore?.justification || "No justification"}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="animate-fade-in stagger-2" data-testid="confidence-card">
              <CardHeader><CardTitle className="font-heading flex items-center gap-2"><Info className="h-4 w-4" />Analysis Confidence</CardTitle></CardHeader>
              <CardContent><ConfidenceMeter percentage={confidence_meter?.confidence_percentage} explanation={confidence_meter?.confidence_explanation} /></CardContent>
            </Card>

            <Card className="animate-fade-in stagger-3 bg-gradient-to-br from-muted/50 to-background">
              <CardHeader><CardTitle className="font-heading flex items-center gap-2"><Package className="h-4 w-4" />Product Info</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between items-center p-2 rounded-lg hover:bg-muted/50 transition-colors"><span className="text-muted-foreground">Barcode</span><span className="font-mono bg-muted px-2 py-1 rounded">{barcode}</span></div>
                <div className="flex justify-between items-center p-2 rounded-lg hover:bg-muted/50 transition-colors"><span className="text-muted-foreground">Brand</span><span className="font-medium">{product_summary?.brand || "Unknown"}</span></div>
                <div className="flex justify-between items-center p-2 rounded-lg hover:bg-muted/50 transition-colors"><span className="text-muted-foreground">Quantity</span><span>{product_summary?.quantity || "Unknown"}</span></div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <ChatPanel barcode={barcode} productName={product_summary?.name} isOpen={chatOpen} onToggle={() => setChatOpen(!chatOpen)} />
    </div>
  );
}
