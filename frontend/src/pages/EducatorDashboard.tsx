import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/layout/Header";
import ModuleCard from "@/components/dashboard/ModuleCard";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Module {
  id: string;
  educator_id: string;
  title: string;
  description: string | null;
  created_at: string;
  problem_count?: number;
}

export default function EducatorDashboard() {
  const { profile } = useAuth();
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile) {
      fetchModules();
    }
  }, [profile]);

  const fetchModules = async () => {
    try {
      const { data: modulesData, error } = await supabase
        .from("modules")
        .select("*")
        .eq("educator_id", profile?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch problem counts for each module
      const modulesWithCounts = await Promise.all(
        (modulesData || []).map(async (module) => {
          const { count } = await supabase
            .from("problems")
            .select("*", { count: "exact", head: true })
            .eq("module_id", module.id);

          return { ...module, problem_count: count || 0 };
        })
      );

      setModules(modulesWithCounts);
    } catch (error: any) {
      toast.error("Failed to load modules");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const createModule = async () => {
    try {
      const { data, error } = await supabase
        .from("modules")
        .insert({
          educator_id: profile?.id,
          title: "New Module",
          description: "Click to edit this module",
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("Module created!");
      fetchModules();
    } catch (error: any) {
      toast.error("Failed to create module");
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Header />
      <main className="container py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">My Modules</h1>
            <p className="text-muted-foreground">
              Manage your educational content and problems
            </p>
          </div>
          <Button onClick={createModule} size="lg" className="gap-2">
            <Plus className="w-5 h-5" />
            Create Module
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : modules.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
              <Plus className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No modules yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first module to get started
            </p>
            <Button onClick={createModule}>Create Module</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {modules.map((module) => (
              <ModuleCard
                key={module.id}
                id={module.id}
                educatorId={module.educator_id}
                title={module.title}
                description={module.description}
                problemCount={module.problem_count}
                createdAt={module.created_at}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
