import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/layout/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { User, Mail, Calendar } from "lucide-react";

export default function Profile() {
  const { profile, user } = useAuth();

  if (!profile && !user) {
    return (
      <div className="min-h-screen bg-gradient-subtle">
        <Header />
        <div className="container py-8 text-center">
          <h2 className="text-2xl font-bold">Profile not found</h2>
        </div>
      </div>
    );
  }

  // Handle both possible field names from backend
  const displayName = profile?.name || (user as any)?.name || "User";
  const displayEmail = (profile as any)?.email || user?.email || "No email";
  const displayRole = profile?.role || user?.role || "user";
  // Backend returns created_at (snake_case) not createdAt (camelCase)
  const createdAt = (profile as any)?.created_at || (profile as any)?.createdAt || (user as any)?.created_at || (user as any)?.createdAt;
  
  const roleColor = displayRole === "educator" ? "bg-secondary" : "bg-primary";
  const joinDate = createdAt 
    ? new Date(createdAt).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })
    : "Unknown";

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Header />
      <main className="container py-8">
        <Card className="max-w-2xl mx-auto shadow-card-hover">
          <CardHeader>
            <div className="flex items-start gap-6">
              <Avatar className="w-24 h-24">
                <AvatarFallback className={`${roleColor} text-primary-foreground text-3xl`}>
                  {displayName[0]?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <CardTitle className="text-3xl">{displayName}</CardTitle>
                  <Badge variant="secondary" className="capitalize">
                    {displayRole}
                  </Badge>
                </div>
                <CardDescription>Member since {joinDate}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4">
              <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                <Mail className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{displayEmail}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                <User className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Role</p>
                  <p className="font-medium capitalize">{displayRole}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                <Calendar className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Joined</p>
                  <p className="font-medium">{joinDate}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}