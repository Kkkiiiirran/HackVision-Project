import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/layout/Header";
import ProblemCard from "@/components/dashboard/ProblemCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Loader2, BookOpen } from "lucide-react";
import { toast } from "sonner";

interface Module {
  id: string;
  educator_id: string;
  title: string;
  description: string | null;
}

interface Problem {
  id: string;
  module_id: string;
  title: string;
  description: string | null;
  difficulty: "easy" | "medium" | "hard" | null;
}

export default function ModuleDetail() {
  const { educatorId, moduleId } = useParams();
  const { profile } = useAuth();
  const [module, setModule] = useState<Module | null>(null);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubscribed, setIsSubscribed] = useState(false);

  const isEducator = profile?.role === "educator" && profile?.id === educatorId;

  useEffect(() => {
    fetchModuleData();
    if (profile?.role === "student") {
      checkSubscription();
    }
  }, [moduleId, profile]);

  const fetchModuleData = async () => {
    try {
      const { data: moduleData, error: moduleError } = await supabase
        .from("modules")
        .select("*")
        .eq("id", moduleId)
        .single();

      if (moduleError) throw moduleError;
      setModule(moduleData);

      const { data: problemsData, error: problemsError } = await supabase
        .from("problems")
        .select("*")
        .eq("module_id", moduleId)
        .order("created_at", { ascending: false });

      if (problemsError) throw problemsError;
      setProblems((problemsData || []) as Problem[]);
    } catch (error: any) {
      toast.error("Failed to load module");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const checkSubscription = async () => {
    try {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("id")
        .eq("student_id", profile?.id)
        .eq("module_id", moduleId)
        .maybeSingle();

      if (error) throw error;
      setIsSubscribed(!!data);
    } catch (error: any) {
      console.error(error);
    }
  };

  const toggleSubscription = async () => {
    try {
      if (isSubscribed) {
        const { error } = await supabase
          .from("subscriptions")
          .delete()
          .eq("student_id", profile?.id)
          .eq("module_id", moduleId);

        if (error) throw error;
        toast.success("Unsubscribed from module");
        setIsSubscribed(false);
      } else {
        const { error } = await supabase
          .from("subscriptions")
          .insert({
            student_id: profile?.id,
            module_id: moduleId,
          });

        if (error) throw error;
        toast.success("Subscribed to module!");
        setIsSubscribed(true);
      }
    } catch (error: any) {
      toast.error("Failed to update subscription");
      console.error(error);
    }
  };

  const createProblem = async () => {
    try {
      const { data, error } = await supabase
        .from("problems")
        .insert({
          module_id: moduleId,
          title: "New Problem",
          description: "Click to edit this problem",
          difficulty: "medium",
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("Problem created!");
      fetchModuleData();
    } catch (error: any) {
      toast.error("Failed to create problem");
      console.error(error);
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

  if (!module) {
    return (
      <div className="min-h-screen bg-gradient-subtle">
        <Header />
        <div className="container py-8 text-center">
          <h2 className="text-2xl font-bold">Module not found</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Header />
      <main className="container py-8">
        <Card className="mb-8 shadow-card-hover">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-lg bg-gradient-primary flex items-center justify-center">
                  <BookOpen className="w-8 h-8 text-primary-foreground" />
                </div>
                <div>
                  <CardTitle className="text-3xl mb-2">{module.title}</CardTitle>
                  <CardDescription className="text-base">
                    {module.description || "No description available"}
                  </CardDescription>
                </div>
              </div>
              {isEducator ? (
                <Button onClick={createProblem} className="gap-2">
                  <Plus className="w-5 h-5" />
                  Add Problem
                </Button>
              ) : (
                <Button
                  onClick={toggleSubscription}
                  variant={isSubscribed ? "outline" : "default"}
                >
                  {isSubscribed ? "Unsubscribe" : "Subscribe"}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              {problems.length} {problems.length === 1 ? "problem" : "problems"}
            </div>
          </CardContent>
        </Card>

        {problems.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
              <Plus className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No problems yet</h3>
            <p className="text-muted-foreground mb-4">
              {isEducator
                ? "Create your first problem to get started"
                : "Check back later for problems"}
            </p>
            {isEducator && <Button onClick={createProblem}>Add Problem</Button>}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {problems.map((problem) => (
              <ProblemCard
                key={problem.id}
                id={problem.id}
                moduleId={problem.module_id}
                educatorId={educatorId!}
                title={problem.title}
                description={problem.description}
                difficulty={problem.difficulty}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
