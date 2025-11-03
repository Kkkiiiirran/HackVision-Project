import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import ModuleDetail from "./pages/ModuleDetail";
import ProblemDetail from "./pages/ProblemDetail";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";

export const routes = [
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <Index />
      </ProtectedRoute>
    ),
  },
  {
    path: "/auth",
    element: <Auth />,
  },
  {
    path: "/profile",
    element: (
      <ProtectedRoute>
        <Profile />
      </ProtectedRoute>
    ),
  },
  {
    path: "/educator/:educatorId/module/new",
    element: (
      <ProtectedRoute>
        <ModuleDetail />
      </ProtectedRoute>
    ),
  },
  {
    path: "/educator/:educatorId/module/:moduleId",
    element: (
      <ProtectedRoute>
        <ModuleDetail />
      </ProtectedRoute>
    ),
  },
  {
    path: "/educator/:educatorId/module/:moduleId/problem/:problemId",
    element: (
      <ProtectedRoute>
        <ProblemDetail />
      </ProtectedRoute>
    ),
  },
  {
    path: "*",
    element: <NotFound />,
  },
];