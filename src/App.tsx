import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AnimatePresence } from "framer-motion";
import { ErrorBoundary } from "@/components/ErrorBoundary";
// Pages
import Login from "./pages/Login";
// Signup removed - only admins can create users via Staff form
import Dashboard from "./pages/Dashboard";
import Tasks from "./pages/Tasks";
import TaskDetail from "./pages/TaskDetail";
import TaskForm from "./pages/TaskForm";
import TasksCalendar from "./pages/TasksCalendar";
import ShoppingLists from "./pages/ShoppingLists";
import ShoppingListDetail from "./pages/ShoppingListDetail";
import ShoppingListForm from "./pages/ShoppingListForm";
import Staff from "./pages/Staff";
import StaffForm from "./pages/StaffForm";
import Projects from "./pages/Projects";
import ProjectDetail from "./pages/ProjectDetail";
import ProjectForm from "./pages/ProjectForm";
import Suggestions from "./pages/Suggestions";
import SuggestionForm from "./pages/SuggestionForm";
import ActivityLog from "./pages/ActivityLog";
import Notifications from "./pages/Notifications";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// Public Route Component (redirect if already logged in)
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public Routes */}
        <Route path="/login" element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        } />
        {/* Signup disabled - redirect to login */}
        <Route path="/signup" element={<Navigate to="/login" replace />} />

        {/* Protected Routes */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        
        {/* Tasks */}
        <Route path="/tasks" element={
          <ProtectedRoute>
            <Tasks />
          </ProtectedRoute>
        } />
        <Route path="/tasks/new" element={
          <ProtectedRoute>
            <TaskForm />
          </ProtectedRoute>
        } />
        <Route path="/tasks/:id" element={
          <ProtectedRoute>
            <TaskDetail />
          </ProtectedRoute>
        } />
        <Route path="/tasks/:id/edit" element={
          <ProtectedRoute>
            <TaskForm />
          </ProtectedRoute>
        } />
        <Route path="/tasks/calendar" element={
          <ProtectedRoute>
            <TasksCalendar />
          </ProtectedRoute>
        } />

        {/* Shopping Lists */}
        <Route path="/shopping-lists" element={
          <ProtectedRoute>
            <ShoppingLists />
          </ProtectedRoute>
        } />
        <Route path="/shopping-lists/new" element={
          <ProtectedRoute>
            <ShoppingListForm />
          </ProtectedRoute>
        } />
        <Route path="/shopping-lists/:id" element={
          <ProtectedRoute>
            <ShoppingListDetail />
          </ProtectedRoute>
        } />
        <Route path="/shopping-lists/:id/edit" element={
          <ProtectedRoute>
            <ShoppingListForm />
          </ProtectedRoute>
        } />

        {/* Staff */}
        <Route path="/staff" element={
          <ProtectedRoute>
            <Staff />
          </ProtectedRoute>
        } />
        <Route path="/staff/new" element={
          <ProtectedRoute>
            <StaffForm />
          </ProtectedRoute>
        } />

        {/* Projects */}
        <Route path="/projects" element={
          <ProtectedRoute>
            <Projects />
          </ProtectedRoute>
        } />
        <Route path="/projects/new" element={
          <ProtectedRoute>
            <ProjectForm />
          </ProtectedRoute>
        } />
        <Route path="/projects/:id" element={
          <ProtectedRoute>
            <ProjectDetail />
          </ProtectedRoute>
        } />
        <Route path="/projects/:id/edit" element={
          <ProtectedRoute>
            <ProjectForm />
          </ProtectedRoute>
        } />

        {/* Suggestions */}
        <Route path="/suggestions" element={
          <ProtectedRoute>
            <Suggestions />
          </ProtectedRoute>
        } />
        <Route path="/suggestions/new" element={
          <ProtectedRoute>
            <SuggestionForm />
          </ProtectedRoute>
        } />

        {/* Activity Log */}
        <Route path="/activity" element={
          <ProtectedRoute>
            <ActivityLog />
          </ProtectedRoute>
        } />

        {/* Notifications */}
        <Route path="/notifications" element={
          <ProtectedRoute>
            <Notifications />
          </ProtectedRoute>
        } />

        {/* Settings */}
        <Route path="/settings" element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        } />

        {/* Redirect root to dashboard or login */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>
  );
}

// Check for required environment variables
const SUPBASE_URL = import.meta.env.VITE_SUPBASE_URL;
const SUPBASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPBASE_PUBLISHABLE_KEY;

const MissingEnvVars = () => (
  <div className="min-h-screen flex items-center justify-center bg-background p-6">
    <div className="max-w-md w-full text-center space-y-4">
      <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
        <svg className="h-8 w-8 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h1 className="text-2xl font-bold">Configuration Error</h1>
      <p className="text-muted-foreground">
        Missing required environment variables. Please set the following in Railway:
      </p>
      <div className="bg-secondary p-4 rounded-lg text-left space-y-2 font-mono text-sm">
        {!SUPBASE_URL && <div className="text-destructive">✗ VITE_SUPBASE_URL</div>}
        {!SUPBASE_PUBLISHABLE_KEY && <div className="text-destructive">✗ VITE_SUPBASE_PUBLISHABLE_KEY</div>}
      </div>
      <p className="text-sm text-muted-foreground">
        Go to Railway Dashboard → Your Project → Variables → Add Variable
      </p>
    </div>
  </div>
);

const App = () => {
  // Show error if environment variables are missing
  if (!SUPBASE_URL || !SUPBASE_PUBLISHABLE_KEY) {
    return <MissingEnvVars />;
  }

  return (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);
};

export default App;
