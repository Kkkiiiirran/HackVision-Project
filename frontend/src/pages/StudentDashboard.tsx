import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/layout/Header";
import ModuleCard from "@/components/dashboard/ModuleCard";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Module {
  id: string;
  educator_id: string;
  title: string;
  description: string | null;
  created_at: string;
  problem_count?: number;
}

export default function StudentDashboard() {
  const { profile } = useAuth();
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile) {
      fetchSubscribedModules();
    }
  }, [profile]);

  const fetchSubscribedModules = async () => {
    try {
      // Get subscribed module IDs
      const { data: subscriptions, error: subError } = await supabase
        .from("subscriptions")
        .select("module_id")
        .eq("student_id", profile?.id);

      if (subError) throw subError;

      if (!subscriptions || subscriptions.length === 0) {
        setLoading(false);
        return;
      }

      const moduleIds = subscriptions.map((sub) => sub.module_id);

      // Fetch module details
      const { data: modulesData, error: modError } = await supabase
        .from("modules")
        .select("*")
        .in("id", moduleIds)
        .order("created_at", { ascending: false });

      if (modError) throw modError;

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

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Header />
      <main className="container py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">My Learning</h1>
          <p className="text-muted-foreground">
            Access your subscribed modules and problems
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : modules.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No subscriptions yet</h3>
            <p className="text-muted-foreground">
              Subscribe to modules to see them here
            </p>
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
