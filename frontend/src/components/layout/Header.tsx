import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

export function Header() {
  const { user, profile, signOut } = useAuth();

  return (
    <header className="border-b">
      <div className="container flex h-16 items-center justify-between py-4">
        <Link to="/" className="flex items-center gap-2 font-bold text-xl">
          CodeMate
        </Link>
        <nav className="flex items-center gap-4">
          {user ? (
            <>
              <Link to="/">Dashboard</Link>
              <Link to="/profile">Profile</Link>
              <Button variant="outline" onClick={signOut}>
                Logout
              </Button>
            </>
          ) : (
            <>
              <Link to="/auth">Login</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

export default Header;
