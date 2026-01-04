import { ChevronDown, AlertTriangle, Leaf, Activity } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./ui/accordion";
import { Badge } from "./ui/badge";
import { cn } from "../lib/utils";

export function RelevantIngredientCard({ ingredient, index }) {
  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value={`ingredient-${index}`} className="border rounded-xl px-4">
        <AccordionTrigger className="hover:no-underline py-4">
          <div className="flex items-center gap-3 text-left">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
              <Leaf className="h-4 w-4 text-secondary-foreground" />
            </div>
            <div>
              <p className="font-heading font-medium">{ingredient.name}</p>
              <p className="text-xs text-muted-foreground font-mono">
                {ingredient.estimated_concentration}
              </p>
            </div>
          </div>
        </AccordionTrigger>
        <AccordionContent className="pb-4">
          <div className="space-y-3 pl-11">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                Health Impact
              </p>
              <p className="text-sm">{ingredient.health_impact}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                Long-term Effects (~1 month regular use)
              </p>
              <p className="text-sm">{ingredient.long_term_effects}</p>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

export function MinorityIngredientCard({ ingredient, index }) {
  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem 
        value={`minority-${index}`} 
        className="border border-destructive/30 bg-destructive/5 rounded-xl px-4"
      >
        <AccordionTrigger className="hover:no-underline py-4">
          <div className="flex items-center gap-3 text-left">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-destructive/20 flex items-center justify-center">
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </div>
            <div>
              <p className="font-heading font-medium">{ingredient.name}</p>
              <Badge variant="outline" className="text-xs border-destructive/50 text-destructive">
                Trace Amount - Notable
              </Badge>
            </div>
          </div>
        </AccordionTrigger>
        <AccordionContent className="pb-4">
          <div className="space-y-3 pl-11">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                Why It Matters
              </p>
              <p className="text-sm">{ingredient.reason_for_attention}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                Potential Long-term Risk
              </p>
              <p className="text-sm">{ingredient.potential_long_term_risk}</p>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
