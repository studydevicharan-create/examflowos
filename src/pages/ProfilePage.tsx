import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { signOut, updatePassword } from '@/lib/auth';
import { useAuth } from '@/lib/authContext';
import { supabase, UserProfile } from '@/lib/supabase';
import { LogOut } from 'lucide-react';

export default function ProfilePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadProfile();
  }, [user]);

  async function loadProfile() {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setProfile(data);
        setDisplayName(data.display_name || '');
      }
    } catch (error: any) {
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateProfile() {
    if (!user || !displayName.trim()) {
      toast.error('Display name is required');
      return;
    }

    setUpdating(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ display_name: displayName })
        .eq('id', user.id);

      if (error) throw error;
      setProfile((p) => p && { ...p, display_name: displayName });
      toast.success('Profile updated');
    } catch (error: any) {
      toast.error('Failed to update profile');
    } finally {
      setUpdating(false);
    }
  }

  async function handleUpdatePassword() {
    if (!newPassword || !confirmPassword) {
      toast.error('Please fill in both password fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setUpdating(true);
    try {
      await updatePassword(newPassword);
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Password updated');
    } catch (error: any) {
      toast.error('Failed to update password');
    } finally {
      setUpdating(false);
    }
  }

  async function handleLogout() {
    try {
      await signOut();
      navigate('/login');
    } catch (error: any) {
      toast.error('Logout failed');
    }
  }

  if (loading) {
    return <div className="p-4 text-center">Loading profile...</div>;
  }

  return (
    <div className="space-y-6 p-4 pb-24">
      <div>
        <h1 className="text-3xl font-bold mb-2">Profile</h1>
        <p className="text-slate-600">{user?.email}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Display Name</label>
            <Input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              disabled={updating}
            />
          </div>
          <Button onClick={handleUpdateProfile} disabled={updating} className="w-full">
            {updating ? 'Updating...' : 'Update Profile'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>Enter a new password to secure your account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">New Password</label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={updating}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Confirm Password</label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={updating}
            />
          </div>
          <Button onClick={handleUpdatePassword} disabled={updating} className="w-full">
            {updating ? 'Updating...' : 'Change Password'}
          </Button>
        </CardContent>
      </Card>

      {profile && (
        <Card>
          <CardHeader>
            <CardTitle>Storage Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm">
                Using{' '}
                <span className="font-semibold">
                  {Math.round(profile.storage_used_bytes / 1024 / 1024 * 100) / 100} MB
                </span>{' '}
                of your available storage
              </p>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${Math.min((profile.storage_used_bytes / (1024 * 1024 * 1024)) * 100, 100)}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Button onClick={handleLogout} variant="destructive" className="w-full">
        <LogOut className="w-4 h-4 mr-2" />
        Logout
      </Button>
    </div>
  );
}
