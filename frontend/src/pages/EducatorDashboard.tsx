import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/layout/Header";
import ModuleCard from "@/components/dashboard/ModuleCard";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { educatorService, moduleService } from "@/lib/api";

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
  const navigate = useNavigate();
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile) {
      fetchModules();
    }
  }, [profile]);

  const fetchModules = async () => {
    try {
      if (!profile) return;
      
      const educatorId = (profile as any)?.user_id || (profile as any)?.id || (profile as any)?.userId;
      if (!educatorId) {
        toast.error("Unable to identify educator ID");
        setLoading(false);
        return;
      }
      
      const response = await educatorService.getModules(educatorId);
      const modulesData = response.data;
      
      // Transform the data to match the expected format
      const modulesWithCounts = modulesData.map((module: any) => ({
        id: module.id,
        educator_id: module.educator_id,
        title: module.title,
        description: module.description,
        created_at: module.created_at,
        problem_count: module.problem_count || 0
      }));
      
      setModules(modulesWithCounts);
    } catch (error: any) {
      toast.error("Failed to load modules");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const createModule = () => {
    // Navigate to create module page instead of creating directly
    const educatorId = (profile as any)?.user_id || (profile as any)?.id || (profile as any)?.userId;
    if (educatorId) {
      navigate(`/educator/${educatorId}/module/new`);
    } else {
      toast.error("Unable to identify educator ID");
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
