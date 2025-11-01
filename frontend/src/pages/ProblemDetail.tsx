import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/layout/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, FileText } from "lucide-react";
import { toast } from "sonner";

interface Problem {
  id: string;
  module_id: string;
  title: string;
  description: string | null;
  difficulty: "easy" | "medium" | "hard" | null;
}

const difficultyColors = {
  easy: "bg-green-500/10 text-green-500 hover:bg-green-500/20",
  medium: "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20",
  hard: "bg-red-500/10 text-red-500 hover:bg-red-500/20",
};

export default function ProblemDetail() {
  const { problemId } = useParams();
  const [problem, setProblem] = useState<Problem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProblem();
  }, [problemId]);

  const fetchProblem = async () => {
    try {
      const { data, error } = await supabase
        .from("problems")
        .select("*")
        .eq("id", problemId)
        .single();

      if (error) throw error;
      setProblem(data as Problem);
    } catch (error: any) {
      toast.error("Failed to load problem");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-subtle">
        <Header />
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="min-h-screen bg-gradient-subtle">
        <Header />
        <div className="container py-8 text-center">
          <h2 className="text-2xl font-bold">Problem not found</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Header />
      <main className="container py-8">
        <Card className="max-w-4xl mx-auto shadow-card-hover">
          <CardHeader>
            <div className="flex items-start gap-4 mb-4">
              <div className="w-16 h-16 rounded-lg bg-secondary/10 flex items-center justify-center">
                <FileText className="w-8 h-8 text-secondary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <CardTitle className="text-3xl">{problem.title}</CardTitle>
                  {problem.difficulty && (
                    <Badge variant="secondary" className={difficultyColors[problem.difficulty]}>
                      {problem.difficulty}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-3">Problem Description</h3>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {problem.description || "No description available"}
              </p>
            </div>

            <div className="border-t border-border pt-6">
              <h3 className="text-lg font-semibold mb-3">Your Solution</h3>
              <div className="bg-muted/50 rounded-lg p-6 text-center text-muted-foreground">
                Solution workspace will appear here
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
