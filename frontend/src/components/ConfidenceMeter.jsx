import { Progress } from "./ui/progress";
import { cn } from "../lib/utils";

export default function ConfidenceMeter({ percentage, explanation }) {
  const numericPercentage = parseInt(percentage) || 0;
  
  const getColor = () => {
    if (numericPercentage >= 80) return "text-green-600 dark:text-green-400";
    if (numericPercentage >= 60) return "text-lime-600 dark:text-lime-400";
    if (numericPercentage >= 40) return "text-yellow-600 dark:text-yellow-400";
    return "text-orange-600 dark:text-orange-400";
  };

  return (
    <div className="space-y-2" data-testid="confidence-meter">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Analysis Confidence</span>
        <span className={cn("font-heading font-bold text-lg", getColor())}>
          {numericPercentage}%
        </span>
      </div>
      <Progress value={numericPercentage} className="h-2" />
      {explanation && (
        <p className="text-xs text-muted-foreground">{explanation}</p>
      )}
    </div>
  );
}
