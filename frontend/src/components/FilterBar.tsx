import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FilterBarProps {
  selectedStatus: string[];
  selectedDifficulty: string[];
  onStatusChange: (status: string[]) => void;
  onDifficultyChange: (difficulty: string[]) => void;
}

export function FilterBar({
  selectedStatus,
  selectedDifficulty,
  onStatusChange,
  onDifficultyChange,
}: FilterBarProps) {
  const difficultyOptions = ["easy", "medium", "hard"];

  const toggleDifficulty = (difficulty: string) => {
    if (selectedDifficulty.includes(difficulty)) {
      onDifficultyChange(selectedDifficulty.filter((d) => d !== difficulty));
    } else {
      onDifficultyChange([...selectedDifficulty, difficulty]);
    }
  };

  const clearFilters = () => {
    onDifficultyChange([]);
    onStatusChange([]);
  };

  const hasActiveFilters = selectedDifficulty.length > 0 || selectedStatus.length > 0;

  return (
    <Card className="sticky top-8">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Filters</CardTitle>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-auto p-0 text-xs"
            >
              Clear all
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Difficulty Filter */}
        <div>
          <h3 className="text-sm font-semibold mb-3">Difficulty</h3>
          <div className="space-y-2">
            {difficultyOptions.map((difficulty) => {
              const isSelected = selectedDifficulty.includes(difficulty);
              const colorClasses = {
                easy: "bg-green-500/10 text-green-500 border-green-500/20",
                medium: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
                hard: "bg-red-500/10 text-red-500 border-red-500/20",
              };
              
              return (
                <button
                  key={difficulty}
                  onClick={() => toggleDifficulty(difficulty)}
                  className={`w-full text-left px-3 py-2 rounded-lg border transition-colors ${
                    isSelected
                      ? colorClasses[difficulty as keyof typeof colorClasses]
                      : "border-border hover:bg-muted"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium capitalize">
                      {difficulty}
                    </span>
                    {isSelected && (
                      <X className="w-4 h-4" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

