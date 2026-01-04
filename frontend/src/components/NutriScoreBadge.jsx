import { cn } from "../lib/utils";

const grades = ["A", "B", "C", "D", "E"];
const gradeColors = {
  A: "bg-green-600",
  B: "bg-lime-500",
  C: "bg-yellow-500",
  D: "bg-orange-500",
  E: "bg-red-600",
};

// Score mapping: A=5, B=4, C=3, D=2, E=1
const scoreToGrade = { 5: "A", 4: "B", 3: "C", 2: "D", 1: "E" };
const gradeToScore = { A: 5, B: 4, C: 3, D: 2, E: 1 };

export default function NutriScoreBadge({ score, grade, size = "default" }) {
  // Determine active grade from either grade prop or score
  let activeGrade = grade?.toUpperCase();
  if (!activeGrade && score) {
    const numScore = parseInt(score) || 3;
    activeGrade = scoreToGrade[numScore] || "C";
  }
  if (!activeGrade) activeGrade = "C";
  
  const activeIndex = grades.indexOf(activeGrade);

  const sizeClasses = {
    small: "w-6 h-6 text-xs",
    default: "w-8 h-8 text-sm",
    large: "w-12 h-12 text-lg",
  };

  return (
    <div className="flex items-center gap-1" data-testid="nutriscore-badge">
      {grades.map((g, index) => (
        <div
          key={g}
          className={cn(
            "rounded flex items-center justify-center font-heading font-bold text-white transition-all duration-300",
            sizeClasses[size],
            gradeColors[g],
            index === activeIndex 
              ? "scale-125 shadow-lg ring-2 ring-offset-2 ring-offset-background animate-pulse" 
              : "opacity-40"
          )}
          data-testid={`nutriscore-${g.toLowerCase()}`}
        >
          {g}
        </div>
      ))}
    </div>
  );
}

export function NutriScoreSimple({ score, grade }) {
  let activeGrade = grade?.toUpperCase();
  if (!activeGrade && score) {
    const numScore = parseInt(score) || 3;
    activeGrade = scoreToGrade[numScore] || "C";
  }
  if (!activeGrade) activeGrade = "C";

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center w-8 h-8 rounded font-heading font-bold text-white",
        gradeColors[activeGrade]
      )}
      data-testid="nutriscore-simple"
    >
      {activeGrade}
    </span>
  );
}
