import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { History, Trash2, Loader2, Package, ChevronRight, Circle } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { NutriScoreSimple } from "../components/NutriScoreBadge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../components/ui/alert-dialog";
import axios from "axios";
import { toast } from "sonner";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const FoodTypeIndicator = ({ type }) => {
  const colors = { veg: "bg-green-500", egg: "bg-yellow-500", "non-veg": "bg-red-500" };
  return <span className={`w-3 h-3 rounded-full ${colors[type] || colors.veg}`} />;
};

export default function HistoryPage() {
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await axios.get(`${API}/history`);
      setHistory(response.data);
    } catch (err) {
      toast.error("Failed to load history");
    } finally {
      setIsLoading(false);
    }
  };

  const deleteItem = async (id) => {
    try {
      await axios.delete(`${API}/history/${id}`);
      setHistory((prev) => prev.filter((item) => item.id !== id));
      toast.success("Item deleted");
    } catch (err) {
      toast.error("Failed to delete");
    }
  };

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit",
      });
    } catch { return "Unknown date"; }
  };

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="py-8" data-testid="history-page">
      <div className="container mx-auto px-4 md:px-8 lg:px-12">
        <div className="mb-8 animate-fade-in">
          <h1 className="font-heading text-2xl md:text-3xl font-bold flex items-center gap-3">
            <History className="h-7 w-7" />
            Scan History
          </h1>
          <p className="text-muted-foreground mt-1">Your previously analyzed products</p>
        </div>

        {history.length === 0 ? (
          <Card className="text-center py-12 animate-fade-in">
            <CardContent>
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-heading font-semibold text-lg mb-2">No products scanned yet</h3>
              <p className="text-muted-foreground mb-6">Start scanning products to build your history</p>
              <Link to="/"><Button data-testid="scan-first-product">Scan Your First Product</Button></Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {history.map((item, index) => (
              <Card
                key={item.id}
                className="animate-fade-in hover:shadow-md transition-shadow"
                style={{ animationDelay: `${0.05 * index}s` }}
                data-testid={`history-item-${item.barcode}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0 flex items-center gap-2">
                      <NutriScoreSimple score={item.nutriscore} grade={item.nutriscore} />
                      <FoodTypeIndicator type={item.food_type} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-heading font-medium truncate">{item.product_name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm text-muted-foreground">{item.brand}</span>
                        <Badge variant="outline" className="font-mono text-xs">{item.barcode}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{formatDate(item.created_at)}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link to={`/analysis/${item.barcode}`}>
                        <Button variant="ghost" size="sm" data-testid={`view-${item.barcode}`}>
                          View<ChevronRight className="ml-1 h-4 w-4" />
                        </Button>
                      </Link>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" data-testid={`delete-${item.barcode}`}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete this item?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will remove "{item.product_name}" from your history.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteItem(item.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
