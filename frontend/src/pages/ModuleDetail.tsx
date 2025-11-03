
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { EducatorProfile } from "@/components/EducatorProfile";
import { FilterBar } from "@/components/FilterBar";
import { ProblemCard } from "@/components/dashboard/ProblemCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Plus, Loader2, BookOpen, Save, X, Edit } from "lucide-react";
import { toast } from "sonner";
import { moduleService, problemService, enrollmentService, educatorService } from "@/lib/api";

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
  topics?: string[];
}

interface EducatorInfo {
  name: string;
  bio?: string | null;
  modulesCount?: number;
  studentsCount?: number;
}

export default function ModuleDetail() {
  const { educatorId, moduleId } = useParams();
  const { profile, user } = useAuth();
  const navigate = useNavigate();

  // Determine if this is a new module
  const isNew = moduleId === "new" || moduleId === undefined;

  // Get current user ID safely - use 'id' from user object which is set by AuthContext
  const currentUserId = user?.id;
  
  // Determine if current user is the educator
  const isEducator = profile?.role === "educator" && currentUserId === educatorId;

  // State for module data
  const [module, setModule] = useState<Module | null>(null);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(isNew);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [educatorInfo, setEducatorInfo] = useState<EducatorInfo | null>(null);

  // Filter state
  const [selectedDifficulty, setSelectedDifficulty] = useState<string[]>([]);

  // Form state for module editing
  const [formData, setFormData] = useState({
    title: "",
    description: ""
  });

  /**
   * Load module data on component mount or when moduleId changes
   */
  useEffect(() => {
    if (isNew) {
      setLoading(false);
      setIsEditing(true);
    } else {
      fetchModuleData();
      if (profile?.role === "student") {
        checkSubscription();
      }
    }
  }, [moduleId, profile]);

  /**
   * Fetch educator info when module is loaded
   */
  useEffect(() => {
    if (!isNew && module && educatorId) {
      fetchEducatorInfo();
    }
  }, [module, educatorId, isNew]);

  /**
   * Fetch educator information and module count
   */
  const fetchEducatorInfo = async () => {
    try {
      if (isEducator && profile) {
        // Current user is the educator - use their profile
        try {
          const modulesResponse = await educatorService.getModules(educatorId!);
          
          // Safely extract modules count
          let modulesCount = 0;
          if (modulesResponse.data) {
            if (Array.isArray(modulesResponse.data)) {
              modulesCount = modulesResponse.data.length;
            } else if (modulesResponse.data.items && Array.isArray(modulesResponse.data.items)) {
              modulesCount = modulesResponse.data.items.length;
            } else if (typeof modulesResponse.data.total === 'number') {
              modulesCount = modulesResponse.data.total;
            }
          }

          setEducatorInfo({
            name: profile.name || "Educator",
            bio: (profile as any).bio || null,
            modulesCount: modulesCount,
            studentsCount: 0
          });
        } catch (error: any) {
          console.error("[ModuleDetail] Failed to fetch modules:", error.message);
          
          // Fallback to just profile data
          setEducatorInfo({
            name: profile.name || "Educator",
            bio: (profile as any).bio || null,
            modulesCount: 0,
            studentsCount: 0
          });
        }
      } else {
        // Current user is not the educator - set minimal info
        setEducatorInfo({
          name: "Educator",
          bio: null,
          modulesCount: 0,
          studentsCount: 0
        });
      }
    } catch (error: any) {
      console.error("[ModuleDetail] Error in fetchEducatorInfo:", error.message);
      
      // Fallback
      setEducatorInfo({
        name: "Educator",
        bio: null,
        modulesCount: 0,
        studentsCount: 0
      });
    }
  };

  /**
   * Fetch module and problems data
   */
  const fetchModuleData = async () => {
    if (!moduleId || moduleId === "new") {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log("[ModuleDetail] Fetching module:", moduleId);

      // Fetch module
      const moduleResponse = await moduleService.getModuleById(moduleId);
      const moduleData = moduleResponse.data;

      if (!moduleData) {
        throw new Error("Module data is empty");
      }

      setModule(moduleData);
      setFormData({
        title: moduleData.title || "",
        description: moduleData.description || ""
      });

      console.log("[ModuleDetail] Module loaded:", moduleData.id);

      // Fetch problems - handle different response formats
      const problemsResponse = await problemService.getProblems(moduleId);
      
      // Safely extract problems array
      let problemsData = [];
      
      if (problemsResponse.data) {
        if (Array.isArray(problemsResponse.data)) {
          problemsData = problemsResponse.data;
        } else if (problemsResponse.data.items && Array.isArray(problemsResponse.data.items)) {
          problemsData = problemsResponse.data.items;
        } else if (typeof problemsResponse.data === 'object') {
          // Try to extract array from nested structure
          const keys = Object.keys(problemsResponse.data);
          for (const key of keys) {
            if (Array.isArray(problemsResponse.data[key])) {
              problemsData = problemsResponse.data[key];
              break;
            }
          }
        }
      }

      // Ensure it's an array
      const finalProblemsData = Array.isArray(problemsData) ? problemsData : [];
      setProblems(finalProblemsData);

      console.log("[ModuleDetail] Problems loaded:", finalProblemsData.length);
    } catch (error: any) {
      const errorMessage = error.response?.data?.error ||
        error.response?.data?.message ||
        error.message ||
        "Failed to load module";

      console.error("[ModuleDetail] Error fetching data:", error.response?.data || error.message);
      toast.error(errorMessage);
      setProblems([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  /**
   * Check if student is subscribed to this module
   */
  const checkSubscription = async () => {
    if (!moduleId || moduleId === "new") return;

    try {
      const response = await enrollmentService.getEnrollmentStatus(moduleId);
      setIsSubscribed(response.data?.isEnrolled || false);
    } catch (error: any) {
      console.error("[ModuleDetail] Subscription check error:", error.message);
      setIsSubscribed(false);
    }
  };

  /**
   * Toggle subscription status
   */
  const toggleSubscription = async () => {
    try {
      if (isSubscribed) {
        await enrollmentService.unenrollFromModule(moduleId!);
        toast.success("Unsubscribed from module");
        setIsSubscribed(false);
      } else {
        await enrollmentService.enrollInModule(moduleId!);
        toast.success("Subscribed to module!");
        setIsSubscribed(true);
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message ||
        error.response?.data?.error ||
        "Failed to update subscription";

      console.error("[ModuleDetail] Subscription error:", error.response?.data || error.message);
      toast.error(errorMessage);
    }
  };

  /**
   * Save module (create or update)
   */
  const handleSaveModule = async () => {
    // Validation
    if (!formData.title.trim() || formData.title.length < 3) {
      toast.error("Title must be at least 3 characters long");
      return;
    }

    if (!formData.description.trim() || formData.description.length < 10) {
      toast.error("Description must be at least 10 characters long");
      return;
    }

    setSaving(true);

    try {
      if (isNew) {
        // Create new module
        const moduleData = {
          title: formData.title.trim(),
          description: formData.description.trim(),
          price_cents: 0,
          currency: "INR",
          tags: [],
          topics: []
        };

        console.log("[ModuleDetail] Creating module with data:", moduleData);
        const response = await moduleService.createModule(moduleData);

        // Safely extract module data from response
        const createdModule = response.data?.module || response.data;

        if (!createdModule || !createdModule.id) {
          throw new Error("Invalid response: module ID not found");
        }

        const newModuleId = createdModule.id;
        const moduleEducatorId = createdModule.educator_id || currentUserId;

        if (!moduleEducatorId) {
          throw new Error("Cannot determine educator ID");
        }

        console.log("[ModuleDetail] Module created successfully:", newModuleId);
        toast.success("Module created successfully!");

        // Navigate to the newly created module
        navigate(`/educator/${moduleEducatorId}/module/${newModuleId}`);
      } else {
        // Update existing module
        if (!moduleId) {
          throw new Error("Module ID is required for update");
        }

        console.log("[ModuleDetail] Updating module:", moduleId);
        await moduleService.updateModule(moduleId, {
          title: formData.title.trim(),
          description: formData.description.trim()
        });

        toast.success("Module updated successfully!");
        setIsEditing(false);
        await fetchModuleData();
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error ||
        error.response?.data?.message ||
        error.message ||
        (isNew ? "Failed to create module" : "Failed to update module");

      console.error("[ModuleDetail] Save error:", error.response?.data || error.message);
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  /**
   * Generate module using AI
   */
  const handleGenerateModule = async () => {
    if (!isNew) {
      toast.error("Can only generate modules in create mode");
      return;
    }

    if (!formData.description.trim()) {
      toast.error("Please enter a description for AI generation");
      return;
    }

    setGenerating(true);

    try {
      console.log("[ModuleDetail] Generating module with description:", formData.description);

      const payload = { description: formData.description.trim() };
      const response = await moduleService.generateModule(payload);

      // Safely extract module data
      const responseData = response.data?.data || response.data;
      const createdModule = responseData?.module || responseData;

      if (!createdModule || !createdModule.id) {
        throw new Error("Invalid response: module ID not found");
      }

      const moduleIdCreated = createdModule.id;
      const moduleEducatorId = createdModule.educator_id || currentUserId;

      if (!moduleEducatorId) {
        throw new Error("Cannot determine educator ID");
      }

      console.log("[ModuleDetail] AI generation successful:", moduleIdCreated);
      toast.success("AI generated module created successfully!");

      navigate(`/educator/${moduleEducatorId}/module/${moduleIdCreated}`);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Failed to generate module";

      console.error("[ModuleDetail] Generation error:", error.response?.data || error.message);
      toast.error(errorMessage);
    } finally {
      setGenerating(false);
    }
  };

  /**
   * Cancel editing
   */
  const handleCancelEdit = () => {
    if (isNew) {
      navigate("/");
    } else {
      if (module) {
        setFormData({
          title: module.title || "",
          description: module.description || ""
        });
      }
      setIsEditing(false);
    }
  };

  /**
   * Navigate to create problem page
   */
  const createProblem = () => {
    if (moduleId && moduleId !== "new") {
      navigate(`/educator/${educatorId}/module/${moduleId}/problem/new`);
    }
  };

  /**
   * Filter problems based on selected filters
   */
  const filteredProblems = problems.filter((problem) => {
    if (selectedDifficulty.length === 0) return true;
    return problem.difficulty && selectedDifficulty.includes(problem.difficulty);
  });

  // Loading state
  if (loading && !isNew) {
    return (
      <div className="min-h-screen bg-gradient-subtle">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  // Module not found
  if (!isNew && !loading && !module) {
    return (
      <div className="min-h-screen bg-gradient-subtle">
        <div className="container py-8 text-center">
          <h2 className="text-2xl font-bold">Module not found</h2>
          <Button onClick={() => navigate("/")} className="mt-4">
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Back Button */}
      <div className="container mx-auto px-4 pt-8">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Back to Modules</span>
        </button>
      </div>

      {/* Educator Profile (when viewing existing module, not editing) */}
      {!isNew && !isEditing && module && educatorInfo && (
        <EducatorProfile
          name={educatorInfo.name}
          bio={educatorInfo.bio}
          modulesCount={educatorInfo.modulesCount}
          studentsCount={educatorInfo.studentsCount}
        />
      )}

      {/* Module Edit Form */}
      {isEditing && (
        <div className="container mx-auto px-4 py-8">
          <Card className="mb-8 shadow-card-hover">
            <CardHeader>
              <CardTitle className="text-2xl mb-4">
                {isNew ? "Create New Module" : "Edit Module"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="module-title">Title *</Label>
                  <Input
                    id="module-title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Enter module title (min 3 characters)"
                    required
                    minLength={3}
                    maxLength={200}
                    disabled={saving || generating}
                  />
                  <p className="text-xs text-muted-foreground">
                    {formData.title.length}/200 characters
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="module-description">Description *</Label>
                  <textarea
                    id="module-description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Enter module description (min 10 characters)"
                    required
                    minLength={10}
                    disabled={saving || generating}
                    className="w-full min-h-[100px] px-3 py-2 text-sm bg-background border border-input rounded-md ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <p className="text-xs text-muted-foreground">
                    {formData.description.length} characters (min 10)
                  </p>
                </div>

                <div className="flex gap-4 pt-4">
                  <Button
                    onClick={handleSaveModule}
                    disabled={saving || generating}
                    className="flex-1"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {isNew ? "Creating..." : "Saving..."}
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        {isNew ? "Create Module" : "Save Changes"}
                      </>
                    )}
                  </Button>

                  {isNew && (
                    <Button
                      onClick={handleGenerateModule}
                      disabled={generating || saving || !formData.description.trim()}
                      variant="secondary"
                      className="flex-1"
                    >
                      {generating ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <BookOpen className="w-4 h-4 mr-2" />
                          Generate with AI
                        </>
                      )}
                    </Button>
                  )}

                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancelEdit}
                    disabled={saving || generating}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Module View with Problems */}
      {!isEditing && (
        <div className="container mx-auto px-4 py-12">
          <div className="grid lg:grid-cols-[300px_1fr] gap-8">
            {/* Filter Sidebar */}
            {problems.length > 0 && (
              <aside className="lg:sticky lg:top-8 h-fit">
                <FilterBar
                  selectedStatus={[]}
                  selectedDifficulty={selectedDifficulty}
                  onStatusChange={() => {}}
                  onDifficultyChange={setSelectedDifficulty}
                />
              </aside>
            )}

            {/* Main Content */}
            <main className="space-y-6">
              <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
                <div>
                  <h2 className="text-3xl font-bold text-foreground mb-2">
                    {module?.title || "Module"}
                  </h2>
                  {module?.description && (
                    <p className="text-muted-foreground max-w-2xl">
                      {module.description}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground mt-2">
                    {filteredProblems.length} {filteredProblems.length === 1 ? "problem" : "problems"}
                  </p>
                </div>

                <div className="flex gap-2">
                  {isEducator && (
                    <>
                      <Button onClick={createProblem} className="gap-2">
                        <Plus className="w-5 h-5" />
                        Add Problem
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setIsEditing(true)}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                    </>
                  )}
                  {!isEducator && (
                    <Button
                      onClick={toggleSubscription}
                      variant={isSubscribed ? "outline" : "default"}
                    >
                      {isSubscribed ? "Unsubscribe" : "Subscribe"}
                    </Button>
                  )}
                </div>
              </div>

              {/* Problems List */}
              {filteredProblems.length === 0 ? (
                <div className="text-center py-12">
                  {problems.length === 0 ? (
                    <>
                      <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                        <Plus className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <h3 className="text-xl font-semibold mb-2">No problems yet</h3>
                      <p className="text-muted-foreground mb-4">
                        {isEducator
                          ? "Create your first problem to get started"
                          : "Check back later for problems"}
                      </p>
                      {isEducator && (
                        <Button onClick={createProblem}>Add Problem</Button>
                      )}
                    </>
                  ) : (
                    <p className="text-muted-foreground text-lg">
                      No problems match your filters. Try adjusting your selection.
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredProblems.map((problem) => (
                    <ProblemCard
                      key={problem.id}
                      problem={problem}
                      educatorId={educatorId!}
                    />
                  ))}
                </div>
              )}
            </main>
          </div>
        </div>
      )}
    </div>
  );
}