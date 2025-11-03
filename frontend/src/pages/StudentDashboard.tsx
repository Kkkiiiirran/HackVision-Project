import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/layout/Header";
import ModuleCard from "@/components/dashboard/ModuleCard";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { studentService } from "@/lib/api";

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
      // Get enrolled modules from backend API
      const response = await studentService.getEnrollments();
      const enrollments = response.data;
      
      if (!enrollments || enrollments.length === 0) {
        setLoading(false);
        return;
      }
      
      // Transform the data to match the expected format
      const modulesWithCounts = enrollments.map((enrollment: any) => ({
        id: enrollment.module.id,
        educator_id: enrollment.module.educator_id,
        title: enrollment.module.title,
        description: enrollment.module.description,
        created_at: enrollment.module.created_at,
        problem_count: enrollment.module.problem_count || 0
      }));
      
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
