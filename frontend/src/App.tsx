import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ScreeningProvider } from "@/hooks/useScreening";
import { ThemeProvider } from "@/hooks/useTheme";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import PatientDashboard from "./pages/PatientDashboard";
import ScreeningPage from "./pages/ScreeningPage";
import ProcessingPage from "./pages/ProcessingPage";
import ResultsPage from "./pages/ResultsPage";
import HistoryPage from "./pages/HistoryPage";
import MedicinePage from "./pages/MedicinePage";
import ActivityPage from "./pages/ActivityPage";
import DoctorDashboard from "./pages/DoctorDashboard";
import DoctorPatientReview from "./pages/DoctorPatientReview";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes — survives page navigation
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ThemeProvider>
        <AuthProvider>
          <ScreeningProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
                <Route path="/patient" element={<PatientDashboard />} />
                <Route path="/screening" element={<ScreeningPage />} />
                <Route path="/processing" element={<ProcessingPage />} />
                <Route path="/results" element={<ResultsPage />} />
                <Route path="/history" element={<HistoryPage />} />
                <Route path="/medicines" element={<MedicinePage />} />
                <Route path="/activity" element={<ActivityPage />} />
                <Route path="/doctor" element={<DoctorDashboard />} />
                <Route path="/doctor/patient/:patientId" element={<DoctorPatientReview />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </ScreeningProvider>
        </AuthProvider>
      </ThemeProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
