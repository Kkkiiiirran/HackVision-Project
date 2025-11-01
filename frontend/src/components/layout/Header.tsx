import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Clock } from "lucide-react";

interface ModuleCardProps {
  id: string;
  educatorId: string;
  title: string;
  description: string | null;
  problemCount?: number;
  createdAt: string;
}

export default function ModuleCard({
  id,
  educatorId,
  title,
  description,
  problemCount = 0,
  createdAt,
}: ModuleCardProps) {
  const formattedDate = new Date(createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <Link to={`/educator/${educatorId}/module/${id}`}>
      <Card className="h-full shadow-card hover:shadow-card-hover transition-all hover:-translate-y-1 cursor-pointer">
        <CardHeader className="space-y-2">
          <div className="flex items-start justify-between">
            <div className="w-12 h-12 rounded-lg bg-gradient-primary flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="line-clamp-2">{title}</CardTitle>
          <CardDescription className="line-clamp-2">
            {description || "No description available"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <BookOpen className="w-4 h-4" />
              <span>{problemCount} problems</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{formattedDate}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
