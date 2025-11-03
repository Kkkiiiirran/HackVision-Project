import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Circle, FileText } from "lucide-react";

export interface Problem {
  id: string;
  module_id: string;
  title: string;
  description: string | null;
  difficulty: "easy" | "medium" | "hard" | null;
  topics?: string[];
}

interface ProblemCardProps {
  problem: Problem;
  educatorId: string;
  onClick?: () => void;
}

const difficultyColors = {
  easy: "bg-green-500/10 text-green-500 border-green-500/20",
  medium: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  hard: "bg-red-500/10 text-red-500 border-red-500/20",
};

export function ProblemCard({ problem, educatorId, onClick }: ProblemCardProps) {
  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  const commonClass = "block w-full bg-card border border-border rounded-lg p-6 shadow-sm hover:shadow-md hover:border-primary/50 transition-smooth group";

  const content = (
    <div className={commonClass}>
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-muted/50 flex items-center justify-center">
          <FileText className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title & Difficulty */}
          <div className="flex items-start justify-between gap-4 mb-2">
            <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-smooth line-clamp-2">
              {problem.title}
            </h3>
            {problem.difficulty && (
              <Badge 
                variant="outline" 
                className={`flex-shrink-0 capitalize ${difficultyColors[problem.difficulty as keyof typeof difficultyColors]}`}
              >
                {problem.difficulty}
              </Badge>
            )}
          </div>
          
          {/* Description */}
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {problem.description || "No description available"}
          </p>
          
          {/* Topics */}
          {problem.topics && problem.topics.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {problem.topics.slice(0, 3).map((topic, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {topic}
                </Badge>
              ))}
              {problem.topics.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{problem.topics.length - 3} more
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // If a parent provided onClick, render non-navigation interactive element
  if (onClick) {
    return (
      <div onClick={handleClick} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleClick(); }}>
        {content}
      </div>
    );
  }

  // Default: link to problem detail route
  return (
    <Link 
      to={`/educator/${educatorId}/module/${problem.module_id}/problem/${problem.id}`}
      onClick={handleClick}
      className="block"
    >
      {content}
    </Link>
  );
}

// Keep the old component for backward compatibility
export default function LegacyProblemCard({
  id,
  moduleId,
  educatorId,
  title,
  description,
  difficulty,
}: {
  id: string;
  moduleId: string;
  educatorId: string;
  title: string;
  description: string | null;
  difficulty: "easy" | "medium" | "hard" | null;
}) {
  return (
    <ProblemCard
      problem={{
        id,
        module_id: moduleId,
        title,
        description,
        difficulty,
      }}
      educatorId={educatorId}
    />
  );
}
