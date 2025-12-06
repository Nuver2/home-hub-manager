import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AnimatePresence } from "framer-motion";

// Pages
import Login from "./pages/Login";
// Signup removed - only admins can create users via Staff form
import Dashboard from "./pages/Dashboard";
import Tasks from "./pages/Tasks";
import TaskDetail from "./pages/TaskDetail";
import TaskForm from "./pages/TaskForm";
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

const App = () => (
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
);

export default App;
