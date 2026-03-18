import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { KENYA_COUNTIES } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Radio, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export default function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('citizen');
  const [county, setCounty] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, profile } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isSignUp) {
        if (!fullName || !county) {
          toast.error('Please fill in all fields');
          setLoading(false);
          return;
        }
        await signUp(email, password, { full_name: fullName, role, county });
        toast.success('Account created! Redirecting...');
      } else {
        await signIn(email, password);
        toast.success('Signed in successfully');
      }
      // Redirect will happen via useEffect in App
    } catch (err: any) {
      toast.error(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  // Redirect if already authed
  if (profile) {
    const dest = profile.role === 'citizen' ? '/report' : profile.role === 'responder' ? '/dashboard' : '/admin';
    navigate(dest, { replace: true });
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Radio className="w-8 h-8 text-primary" />
            <span className="text-2xl font-bold text-foreground">Kaa-Rada</span>
          </div>
          <h1 className="text-xl font-semibold text-foreground">
            {isSignUp ? 'Create your account' : 'Sign in to continue'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isSignUp ? 'Join the emergency response network' : 'Access your dashboard'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="glass-card p-6 space-y-4">
          {isSignUp && (
            <>
              <div>
                <Label className="text-foreground">Full Name</Label>
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                  className="bg-background border-border text-foreground mt-1"
                  required
                />
              </div>
              <div>
                <Label className="text-foreground">Role</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger className="bg-background border-border text-foreground mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="citizen">Citizen — Report Incidents</SelectItem>
                    <SelectItem value="responder">Responder — Manage Emergencies</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-foreground">County</Label>
                <Select value={county} onValueChange={setCounty}>
                  <SelectTrigger className="bg-background border-border text-foreground mt-1">
                    <SelectValue placeholder="Select your county" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border max-h-60">
                    {KENYA_COUNTIES.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          <div>
            <Label className="text-foreground">Email</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="bg-background border-border text-foreground mt-1"
              required
            />
          </div>

          <div>
            <Label className="text-foreground">Password</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="bg-background border-border text-foreground mt-1"
              required
              minLength={6}
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
          >
            {loading && <span className="animate-spin">⟳</span>}
            {isSignUp ? 'Create Account' : 'Sign In'}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-primary hover:underline font-medium"
            >
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </p>
        </form>

        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <AlertTriangle className="w-3 h-3" />
          <span>Emergency services: Call 999 for immediate help</span>
        </div>
      </div>
    </div>
  );
}
