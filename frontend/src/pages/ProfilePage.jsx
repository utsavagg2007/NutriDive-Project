import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User, Shield, Loader2, Check } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Checkbox } from "../components/ui/checkbox";
import { Label } from "../components/ui/label";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";

const ALLERGENS = [
  { id: "nuts", label: "Nuts", description: "Peanuts, tree nuts, almonds, etc." },
  { id: "dairy", label: "Dairy", description: "Milk, cheese, butter, lactose" },
  { id: "gluten", label: "Gluten", description: "Wheat, barley, rye" },
  { id: "soy", label: "Soy", description: "Soy, soya, lecithin" },
  { id: "eggs", label: "Eggs", description: "Eggs, albumin" },
  { id: "shellfish", label: "Shellfish", description: "Shrimp, crab, lobster" },
];

export default function ProfilePage() {
  const { user, updateAllergens, isLoading: authLoading } = useAuth();
  const [selectedAllergens, setSelectedAllergens] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    } else if (user) {
      setSelectedAllergens(user.allergens || []);
    }
  }, [user, authLoading, navigate]);

  const toggleAllergen = (id) => {
    setSelectedAllergens((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateAllergens(selectedAllergens);
      toast.success("Allergens updated successfully!");
    } catch (error) {
      toast.error("Failed to update allergens");
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="container mx-auto px-4 md:px-8 lg:px-12 max-w-2xl">
        {/* Profile Info */}
        <Card className="mb-6 animate-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-heading">
              <User className="h-5 w-5" />
              Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Name</span>
              <span className="font-medium">{user.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email</span>
              <span className="font-medium">{user.email}</span>
            </div>
          </CardContent>
        </Card>

        {/* Allergen Settings */}
        <Card className="animate-fade-in stagger-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-heading">
              <Shield className="h-5 w-5" />
              Allergen Settings
            </CardTitle>
            <CardDescription>
              Select your allergens to receive warnings when scanning products
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {ALLERGENS.map((allergen, i) => (
                <div
                  key={allergen.id}
                  className="flex items-start space-x-3 p-4 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors animate-fade-in cursor-pointer"
                  style={{ animationDelay: `${i * 0.1}s` }}
                  onClick={() => toggleAllergen(allergen.id)}
                >
                  <Checkbox
                    id={allergen.id}
                    checked={selectedAllergens.includes(allergen.id)}
                    onCheckedChange={() => toggleAllergen(allergen.id)}
                    data-testid={`allergen-${allergen.id}`}
                  />
                  <div className="flex-1">
                    <Label htmlFor={allergen.id} className="font-medium cursor-pointer">
                      {allergen.label}
                    </Label>
                    <p className="text-sm text-muted-foreground">{allergen.description}</p>
                  </div>
                  {selectedAllergens.includes(allergen.id) && (
                    <Check className="h-5 w-5 text-primary" />
                  )}
                </div>
              ))}
            </div>

            <Button onClick={handleSave} className="w-full mt-6" disabled={isSaving} data-testid="save-allergens">
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save Allergen Settings
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
