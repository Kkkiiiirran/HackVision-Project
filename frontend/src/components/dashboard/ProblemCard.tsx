import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText } from "lucide-react";

interface ProblemCardProps {
  id: string;
  moduleId: string;
  educatorId: string;
  title: string;
  description: string | null;
  difficulty: "easy" | "medium" | "hard" | null;
}

const difficultyColors = {
  easy: "bg-green-500/10 text-green-500 hover:bg-green-500/20",
  medium: "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20",
  hard: "bg-red-500/10 text-red-500 hover:bg-red-500/20",
};

export default function ProblemCard({
  id,
  moduleId,
  educatorId,
  title,
  description,
  difficulty,
}: ProblemCardProps) {
  return (
    <Link to={`/educator/${educatorId}/module/${moduleId}/problem/${id}`}>
      <Card className="h-full shadow-card hover:shadow-card-hover transition-all hover:-translate-y-1 cursor-pointer">
        <CardHeader className="space-y-2">
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-secondary" />
            </div>
            {difficulty && (
              <Badge variant="secondary" className={difficultyColors[difficulty]}>
                {difficulty}
              </Badge>
            )}
          </div>
          <CardTitle className="line-clamp-2">{title}</CardTitle>
          <CardDescription className="line-clamp-3">
            {description || "No description available"}
          </CardDescription>
        </CardHeader>
      </Card>
    </Link>
  );
}
