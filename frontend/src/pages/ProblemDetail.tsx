import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Editor from "@monaco-editor/react";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Play, RotateCcw, Loader2, Save, X, Edit } from "lucide-react";
import { toast } from "sonner";
import { problemService } from "@/lib/api";

interface Problem {
  id?: string;
  module_id: string;
  title: string;
  description: string | null;
  difficulty: "easy" | "medium" | "hard" | null;
  image_url?: string | null;
  sample_input?: string | null;
  sample_output?: string | null;
  topics?: string[];
}

const difficultyColors = {
  easy: "bg-green-500/10 text-green-500 border-green-500/20",
  medium: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  hard: "bg-red-500/10 text-red-500 border-red-500/20",
};

interface ProblemDetailProps {
  problemIdProp?: string;
  moduleIdProp?: string;
  educatorIdProp?: string;
  onClose?: () => void;
}

export default function ProblemDetail(props: ProblemDetailProps) {
  const { problemId: paramProblemId, moduleId: paramModuleId, educatorId: paramEducatorId } = useParams();
  // Allow parent components (like ModuleDetail) to embed this page
  // by passing props; otherwise fall back to route params.
  const problemId = props.problemIdProp ?? paramProblemId;
  const moduleId = props.moduleIdProp ?? paramModuleId;
  const educatorId = props.educatorIdProp ?? paramEducatorId;
  const { profile } = useAuth();
  const navigate = useNavigate();
  const isNew = problemId === "new";
  const isEducator = profile?.role === "educator" && ((profile as any)?.user_id || (profile as any)?.id) === educatorId;
  
  const [problem, setProblem] = useState<Problem | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(isNew);
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [consoleOutput, setConsoleOutput] = useState<string>("");

  // Judge0 API config
  const JUDGE0_API_URL = "https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=false&wait=true";
  const JUDGE0_API_KEY = "556ec6358cmsh0ee64f3edf86bd9p1c3bbejsnecd3d98df40c"; // Replace with your RapidAPI key

  // Map frontend language to Judge0 language_id
  const languageMap: Record<string, number> = {
    javascript: 63,
    typescript: 74,
    python: 71,
    java: 62,
    cpp: 54,
  };
async function runCodeWithJudge0() {
  setRunning(true);
  setConsoleOutput(""); // clear previous output

  try {
    const language_id = languageMap[language] || 71; // Default Python 3
    const payload = {
      source_code: code,
      language_id,
      stdin: problem?.sample_input || "",
    };

    // Submit code
    const submitResponse = await fetch(
      "https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=true&wait=false",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-RapidAPI-Key": JUDGE0_API_KEY,
          "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
        },
        body: JSON.stringify(payload),
      }
    );

    if (!submitResponse.ok) throw new Error(`Submission failed: ${submitResponse.statusText}`);
    const { token } = await submitResponse.json();
    if (!token) throw new Error("No token returned from Judge0");

    const decode = (str: string) => (str ? atob(str) : "");

    // Poll for result
    let isCompleted = false;
    while (!isCompleted) {
      const resultResponse = await fetch(
        `https://judge0-ce.p.rapidapi.com/submissions/${token}?base64_encoded=true`,
        {
          headers: {
            "X-RapidAPI-Key": JUDGE0_API_KEY,
            "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
          },
        }
      );

      if (!resultResponse.ok) throw new Error(`Failed to fetch result: ${resultResponse.statusText}`);
      const result = await resultResponse.json();

      // Append stdout line by line
      if (result.stdout) {
        const lines = decode(result.stdout).split("\n");
        setConsoleOutput(prev => prev + lines.map(l => `> ${l}`).join("\n") + "\n");
      }

      // Append runtime/compile errors
      if (result.stderr) setConsoleOutput(prev => prev + `⚠️ Runtime Error:\n${decode(result.stderr)}\n`);
      if (result.compile_output) setConsoleOutput(prev => prev + `💥 Compile Error:\n${decode(result.compile_output)}\n`);

      // Check if finished
      if (result.status?.id >= 3) {
        const time = result.time ? `⏱ Time: ${result.time}s` : "";
        const memory = result.memory ? `💾 Memory: ${result.memory}KB` : "";
        setConsoleOutput(prev => prev + `${time} ${memory}\n`);
        isCompleted = true;
      } else {
        // Wait 0.5s before next poll
        await new Promise(r => setTimeout(r, 500));
      }
    }

    toast.success("✅ Code executed successfully!");
  } catch (error: any) {
    setConsoleOutput(prev => prev + `\nRun failed: ${error.message || error}\n`);
    toast.error("❌ Execution failed");
  } finally {
    setRunning(false);
  }
}











  
  // Code editor state
  const [language, setLanguage] = useState("javascript");
  const [code, setCode] = useState("// Write your solution here\n\n");

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    difficulty: "medium" as "easy" | "medium" | "hard",
    image_url: "",
    sample_input: "",
    sample_output: "",
    topics: ""
  });

  useEffect(() => {
    if (isNew) {
      setLoading(false);
      setIsEditing(true);
    } else {
      fetchProblem();
    }
  }, [problemId]);

  const fetchProblem = async () => {
    try {
      const response = await problemService.getProblemById(problemId!);
      const problemData = response.data;
      setProblem(problemData);
      setFormData({
        title: problemData.title || "",
        description: problemData.description || "",
        difficulty: problemData.difficulty || "medium",
        image_url: problemData.image_url || "",
        sample_input: problemData.sample_input || "",
        sample_output: problemData.sample_output || "",
        topics: Array.isArray(problemData.topics) ? problemData.topics.join(", ") : ""
      });
    } catch (error: any) {
      toast.error("Failed to load problem");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
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
      const problemData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        difficulty: formData.difficulty,
        image_url: formData.image_url.trim() || undefined,
        sample_input: formData.sample_input.trim() || undefined,
        sample_output: formData.sample_output.trim() || undefined,
        topics: formData.topics.trim() 
          ? formData.topics.split(",").map(t => t.trim()).filter(t => t.length > 0)
          : []
      };

      if (isNew) {
        // Create new problem
        const response = await problemService.createProblem(moduleId!, problemData);
        toast.success("Problem created successfully!");
        // Navigate back to the module page to see all problems
        navigate(`/educator/${educatorId}/module/${moduleId}`);
      } else {
        // Update existing problem
        await problemService.updateProblem(problemId!, problemData);
        toast.success("Problem updated successfully!");
        // Navigate back to module page after saving
        navigate(`/educator/${educatorId}/module/${moduleId}`);
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message ||
                          (error.response?.data?.details && error.response.data.details[0]?.message) ||
                          (isNew ? "Failed to create problem" : "Failed to update problem");
      toast.error(errorMessage);
      console.error("Save problem error:", error.response?.data || error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (isNew) {
      // Go back to module detail
      navigate(`/educator/${educatorId}/module/${moduleId}`);
    } else {
      // Reset form to original problem data
      if (problem) {
        setFormData({
          title: problem.title || "",
          description: problem.description || "",
          difficulty: problem.difficulty || "medium",
          image_url: problem.image_url || "",
          sample_input: problem.sample_input || "",
          sample_output: problem.sample_output || "",
          topics: Array.isArray(problem.topics) ? problem.topics.join(", ") : ""
        });
      }
      setIsEditing(false);
    }
  };

  const handleLanguageChange = (newLang: string) => {
    setLanguage(newLang);
    // Reset code when language changes (optional)
    setCode(`// Write your ${newLang} solution here\n\n`);
  };

  const handleReset = () => {
    setCode(`// Write your ${language} solution here\n\n`);
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isNew && !problem) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Problem not found</h2>
          <Button onClick={() => navigate(`/educator/${educatorId}/module/${moduleId}`)}>
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  // Show edit form in a card layout
  if (isEditing) {
    return (
      <div className="min-h-screen bg-gradient-subtle">
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-4xl mx-auto shadow-card-hover">
            <CardHeader>
              <CardTitle className="text-2xl mb-2">
                {isNew ? "Create New Problem" : "Edit Problem"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Enter problem title (min 3 characters)"
                    required
                    minLength={3}
                    maxLength={200}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Enter problem description (min 10 characters)"
                    required
                    minLength={10}
                    className="w-full min-h-[150px] px-3 py-2 text-sm bg-background border border-input rounded-md ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="difficulty">Difficulty</Label>
                  <select
                    id="difficulty"
                    aria-label="difficulty"
                    value={formData.difficulty}
                    onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as "easy" | "medium" | "hard" })}
                    className="w-full px-3 py-2 text-sm bg-background border border-input rounded-md ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="image_url">Image URL (optional)</Label>
                  <Input
                    id="image_url"
                    type="url"
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    placeholder="https://example.com/image.png"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sample_input">Sample Input (optional)</Label>
                  <textarea
                    id="sample_input"
                    value={formData.sample_input}
                    onChange={(e) => setFormData({ ...formData, sample_input: e.target.value })}
                    placeholder="Enter sample input"
                    className="w-full min-h-[100px] px-3 py-2 text-sm bg-background border border-input rounded-md ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sample_output">Sample Output (optional)</Label>
                  <textarea
                    id="sample_output"
                    value={formData.sample_output}
                    onChange={(e) => setFormData({ ...formData, sample_output: e.target.value })}
                    placeholder="Enter sample output"
                    className="w-full min-h-[100px] px-3 py-2 text-sm bg-background border border-input rounded-md ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="topics">Topics (optional, comma-separated)</Label>
                  <Input
                    id="topics"
                    value={formData.topics}
                    onChange={(e) => setFormData({ ...formData, topics: e.target.value })}
                    placeholder="algorithm, data-structures, math"
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <Button type="submit" disabled={saving}>
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {isNew ? "Creating..." : "Saving..."}
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        {isNew ? "Create Problem" : "Save Changes"}
                      </>
                    )}
                  </Button>
                  <Button type="button" variant="outline" onClick={handleCancel} disabled={saving}>
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Show problem view with editor
  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => (props.onClose ? props.onClose() : navigate(`/educator/${educatorId}/module/${moduleId}`))}
                className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-smooth"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="font-medium">Back</span>
              </button>
              <div className="h-6 w-px bg-border" />
              <h1 className="text-xl font-bold text-foreground">{problem?.title}</h1>
              {problem?.difficulty && (
                <Badge variant="outline" className={difficultyColors[problem.difficulty]}>
                  {problem.difficulty.charAt(0).toUpperCase() + problem.difficulty.slice(1)}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-3">
              {isEducator && (
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                  <Edit className="w-4 h-4" />
                  <span className="sr-only">Edit Problem</span>
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={handleReset}>
                <RotateCcw className="w-4 h-4" />
                <span className="sr-only">Reset</span>
              </Button>
              <Button size="sm" onClick={runCodeWithJudge0}>
                <Play className="w-4 h-4" />
                <span className="ml-2">{running ? "Running..." : "Run"}</span>
              </Button>
              <Button size="sm" variant="default" onClick={async () => {
                setSubmitting(true);
                setConsoleOutput(prev => prev + `> Submitting...\n`);
                try {
                  await new Promise((r) => setTimeout(r, 1200));
                  setConsoleOutput(prev => prev + `> Submission queued (stub)\n`);
                  toast.success("Submission sent (stub)");
                } catch (e) {
                  setConsoleOutput(prev => prev + `> Submit failed: ${String(e)}\n`);
                  toast.error("Submit failed");
                } finally {
                  setSubmitting(false);
                }
              }}>
                Submit
              </Button>
            </div>
          </div>
        </div>
      </header>
      {/* Main Content with Resizable Panels */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal">
          {/* Problem Description Panel */}
          <ResizablePanel defaultSize={40} minSize={30}>
            <div className="h-full overflow-auto bg-card">
              <div className="p-8">
                <div className="mb-6">
                  {/* Top summary area left intentionally minimal; full formatted description is available inside the Description tab */}
                  {problem?.topics && problem.topics.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {problem.topics.map((topic, index) => (
                        <span key={index} className="px-3 py-1 bg-primary/10 text-primary text-sm rounded-full">{topic}</span>
                      ))}
                    </div>
                  )}
                </div>

                <Tabs defaultValue="description" className="w-full">
                  <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent">
                    <TabsTrigger 
                      value="description" 
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                    >
                      Description
                    </TabsTrigger>
                    <TabsTrigger 
                      value="hints"
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                    >
                      Hints
                    </TabsTrigger>
                    <TabsTrigger 
                      value="solution"
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                    >
                      Solution
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="description" className="mt-6">
                    <div className="space-y-6">
                      {problem?.description && (
                        <div className="prose prose-slate dark:prose-invert max-w-none">
                          <style dangerouslySetInnerHTML={{ __html: `
                            .problem-description h2 { font-size: 1.125rem; font-weight: 600; margin-top: 1.5rem; margin-bottom: 0.75rem; color: hsl(var(--foreground)); }
                            .problem-description h3 { font-size: 1rem; font-weight: 600; margin-top: 1.25rem; margin-bottom: 0.5rem; color: hsl(var(--foreground)); }
                            .problem-description p { font-size: 0.875rem; line-height: 1.6; margin-bottom: 1rem; color: hsl(var(--foreground) / 0.9); }
                            .problem-description ul { font-size: 0.875rem; line-height: 1.6; margin-left: 1.5rem; margin-bottom: 1rem; list-style-type: disc; }
                            .problem-description li { margin-bottom: 0.5rem; color: hsl(var(--foreground) / 0.9); }
                            .problem-description code { background-color: hsl(var(--muted)); padding: 0.125rem 0.375rem; border-radius: 0.25rem; font-size: 0.813rem; font-family: 'Monaco', 'Menlo', 'Consolas', monospace; }
                            .problem-description pre { background-color: hsl(var(--muted)); padding: 1rem; border-radius: 0.5rem; overflow-x: auto; margin: 1rem 0; font-size: 0.813rem; line-height: 1.5; }
                            .problem-description pre code { background-color: transparent; padding: 0; }
                          ` }} />
                          <div
                            className="problem-description text-foreground whitespace-pre-wrap text-sm leading-relaxed"
                            dangerouslySetInnerHTML={{
                              __html: (problem.description || "")
                                .split('\n')
                                .map(line => {
                                  if (line.startsWith('## ')) return `<h2>${line.replace('## ', '')}</h2>`;
                                  if (line.startsWith('### ')) return `<h3>${line.replace('### ', '')}</h3>`;
                                  if (line.startsWith('```')) return line.replace(/```(\w+)?/, '<pre><code>').replace('```', '</code></pre>');
                                  if (/^\d+\./.test(line)) return `<li>${line.replace(/^\d+\.\s*/, '')}</li>`;
                                  if (line.startsWith('- ')) return `<li>${line.replace('- ', '')}</li>`;
                                  if (line.trim() === '') return '<br/>';
                                  return `<p>${line}</p>`;
                                })
                                .join('')
                                .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
                            }}
                          />
                        </div>
                      )}
                      
                      {problem?.sample_input && (
                        <div>
                          <h3 className="text-sm font-semibold mb-2">Sample Input</h3>
                          <pre className="bg-muted/50 rounded-lg p-4 text-sm overflow-x-auto">
                            {problem.sample_input}
                          </pre>
                        </div>
                      )}
                      
                      {problem?.sample_output && (
                        <div>
                          <h3 className="text-sm font-semibold mb-2">Sample Output</h3>
                          <pre className="bg-muted/50 rounded-lg p-4 text-sm overflow-x-auto">
                            {problem.sample_output}
                          </pre>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="hints" className="mt-6">
                    <div className="space-y-4">
                      <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">
                          💡 Start by understanding the problem requirements carefully
                        </p>
                      </div>
                      <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">
                          💡 Think about edge cases and test your solution with different inputs
                        </p>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="solution" className="mt-6">
                    <div className="p-4 bg-accent/50 rounded-lg border border-accent">
                      <p className="text-sm text-muted-foreground">
                        🔒 Complete the problem to unlock the solution
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Code Editor Panel */}
          <ResizablePanel defaultSize={60} minSize={40}>
            <div className="h-full flex flex-col bg-editor">
              {/* Language Selector */}
              <div className="px-4 py-3 border-b border-border bg-card flex items-center justify-between">
                <Select value={language} onValueChange={handleLanguageChange}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="javascript">JavaScript</SelectItem>
                    <SelectItem value="typescript">TypeScript</SelectItem>
                    <SelectItem value="python">Python</SelectItem>
                    <SelectItem value="java">Java</SelectItem>
                    <SelectItem value="cpp">C++</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-xs text-muted-foreground">
                  Press Ctrl+Space for autocomplete
                </span>
              </div>

              {/* Monaco Editor */}
              <div className="flex-1">
                <Editor
                  height="100%"
                  language={language}
                  value={code}
                  onChange={(value) => setCode(value || "")}
                  theme="vs-dark"
                  options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    lineNumbers: "on",
                    roundedSelection: false,
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    tabSize: 2,
                    wordWrap: "on",
                  }}
                />
              </div>
            </div>
            {/* Console / Output area below editor */}
            <div className="border-t border-border bg-card p-4">
              <h3 className="text-sm font-medium mb-2">Console Output</h3>
              <pre className="bg-muted/50 rounded-md p-3 text-sm h-28 overflow-auto whitespace-pre-wrap">
                {consoleOutput || "No output yet. Click Run or Submit to see results."}
              </pre>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}
