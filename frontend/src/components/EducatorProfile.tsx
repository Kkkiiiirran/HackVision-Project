import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Users } from "lucide-react";

interface EducatorProfileProps {
  name: string;
  bio?: string | null;
  modulesCount?: number;
  studentsCount?: number;
}

export function EducatorProfile({ 
  name, 
  bio, 
  modulesCount = 0, 
  studentsCount = 0 
}: EducatorProfileProps) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="bg-card border-b border-border">
      <div className="container mx-auto px-4 py-8">
        <Card className="border-0 shadow-none">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
              <Avatar className="w-20 h-20">
                <AvatarFallback className="bg-gradient-primary text-primary-foreground text-2xl">
                  {initials}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold text-foreground">{name}</h1>
                  <Badge variant="secondary">Educator</Badge>
                </div>
                {bio && (
                  <p className="text-muted-foreground mb-4 leading-relaxed">
                    {bio}
                  </p>
                )}
                <div className="flex gap-6">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <BookOpen className="w-4 h-4" />
                    <span className="font-medium">{modulesCount} Modules</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="w-4 h-4" />
                    <span className="font-medium">{studentsCount} Students</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

