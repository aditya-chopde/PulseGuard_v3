import { useAuth } from '@/hooks/useAuth';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getRequests } from '@/services/doctorPatientService';
import { LogOut, Menu, X, Home, BarChart3, Activity, Pill, History, Stethoscope, FileText, Users } from 'lucide-react';
import PulseGuardLogo from '@/components/PulseGuardLogo';
import { Button } from '@/components/ui/button';
import ThemeToggle from '@/components/ThemeToggle';
import { useState } from 'react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { role, userName, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const { data: requestsData } = useQuery({
    queryKey: ["patientRequests"],
    queryFn: getRequests,
    enabled: role === 'patient'
  });
  const hasAccepted = requestsData?.data?.some((r: any) => r.status === 'accepted');
  const isPendingOrRejected = role === 'patient' && !hasAccepted;

  const patientLinks = [
    { label: 'Dashboard', path: '/patient', icon: Home },
    ...(!isPendingOrRejected ? [
      { label: 'New Screening', path: '/screening', icon: Stethoscope },
      { label: 'History', path: '/history', icon: History },
      { label: 'Medicines', path: '/medicines', icon: Pill },
      { label: 'Activity', path: '/activity', icon: Activity },
    ] : [])
  ];

  const doctorLinks = [
    { label: 'Overview', path: '/doctor', icon: Home },
    { label: 'Patients', path: '/doctor', icon: Users },
    { label: 'Analytics', path: '/doctor', icon: BarChart3 },
    { label: 'Reports', path: '/doctor', icon: FileText },
    { label: 'Medicines', path: '/medicines', icon: Pill },
  ];

  const links = role === 'doctor' ? doctorLinks : patientLinks;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (isPendingOrRejected && location.pathname !== '/patient') {
    return <Navigate to="/patient" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-14">
          <div className="cursor-pointer" onClick={() => navigate('/')}>
            <PulseGuardLogo size={24} />
          </div>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {links.map((link) => (
              <button
                key={link.path + link.label}
                onClick={() => navigate(link.path)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  location.pathname === link.path
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                <link.icon className="h-3.5 w-3.5" />
                {link.label}
              </button>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-2">
            <ThemeToggle />
            <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-muted/50">
              <div className="w-6 h-6 rounded-full gradient-primary flex items-center justify-center">
                <span className="text-[10px] font-bold text-primary-foreground">{userName?.[0]}</span>
              </div>
              <span className="text-sm text-muted-foreground">{userName}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-foreground">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex md:hidden items-center gap-2">
            <ThemeToggle />
            <button className="p-2 text-muted-foreground" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="md:hidden border-t border-border bg-card px-4 py-3 space-y-1">
            {links.map((link) => (
              <button
                key={link.path + link.label}
                onClick={() => { navigate(link.path); setMobileOpen(false); }}
                className={`flex items-center gap-2 w-full text-left px-3 py-2 rounded-lg text-sm font-medium ${
                  location.pathname === link.path
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground'
                }`}
              >
                <link.icon className="h-4 w-4" />
                {link.label}
              </button>
            ))}
            <div className="pt-2 border-t border-border">
              <span className="text-sm text-muted-foreground block mb-2">{userName}</span>
              <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground">
                <LogOut className="h-4 w-4 mr-1" /> Logout
              </Button>
            </div>
          </div>
        )}
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
    </div>
  );
}
