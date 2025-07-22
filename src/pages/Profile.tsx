import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Camera, Edit3, MapPin, Calendar, Loader2, ArrowLeft } from 'lucide-react';

interface Profile {
  id: string;
  user_id: string;
  username: string | null;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  wallet_address: string | null;
  created_at: string;
  updated_at: string;
}

const Profile: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    let mounted = true;
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (!session?.user) {
          navigate('/');
        } else {
          setTimeout(() => {
            if (mounted) {
              fetchProfile(session.user.id);
            }
          }, 0);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      
      setSession(session);
      setUser(session?.user ?? null);
      
      if (!session?.user) {
        navigate('/');
      } else {
        fetchProfile(session.user.id);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate]);

  const fetchProfile = async (userId: string): Promise<void> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load profile information."
        });
      } else if (data) {
        setProfile(data);
        setDisplayName(data.display_name || '');
        setBio(data.bio || '');
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const uploadImage = async (file: File, bucket: string): Promise<string | null> => {
    if (!user) return null;

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Math.random()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(fileName, file);

    if (uploadError) {
      console.error('Error uploading image:', uploadError);
      return null;
    }

    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);

    return data.publicUrl;
  };

  const handleImageUpload = async (type: 'avatar' | 'banner') => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    input.onchange = async (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file || !user) return;

      setUploading(true);
      try {
        const bucket = type === 'avatar' ? 'avatars' : 'banners';
        const imageUrl = await uploadImage(file, bucket);
        
        if (imageUrl) {
          const updateField = type === 'avatar' ? 'avatar_url' : 'banner_url';
          
          const { error } = await supabase
            .from('profiles')
            .update({ [updateField]: imageUrl })
            .eq('user_id', user.id);

          if (error) {
            console.error('Error updating profile:', error);
            toast({
              variant: "destructive",
              title: "Error",
              description: "Failed to update profile image."
            });
          } else {
            toast({
              title: "Success",
              description: `${type === 'avatar' ? 'Profile' : 'Banner'} image updated successfully!`
            });
            if (profile) {
              setProfile({
                ...profile,
                [updateField]: imageUrl
              });
            }
          }
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setUploading(false);
      }
    };
    
    input.click();
  };

  const updateProfile = async (): Promise<void> => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: displayName,
          bio: bio,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (error) {
        console.error('Error updating profile:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to update profile."
        });
      } else {
        toast({
          title: "Success",
          description: "Profile updated successfully!"
        });
        if (profile) {
          setProfile({
            ...profile,
            display_name: displayName,
            bio: bio
          });
        }
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred."
      });
    } finally {
      setLoading(false);
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error signing out:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to sign out."
        });
      } else {
        navigate('/');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Simple Navigation Header */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link to="/" className="flex items-center space-x-2 text-primary hover:text-primary/80">
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Home</span>
            </Link>
          </div>
          <h1 className="text-xl font-semibold">Profile</h1>
          <div className="w-24"></div> {/* Spacer for centering */}
        </div>
      </div>

      {/* Banner Section */}
      <div className="relative w-full h-48 md:h-64 bg-gradient-to-r from-primary/20 to-secondary/20 overflow-hidden">
        {profile?.banner_url ? (
          <img 
            src={profile.banner_url} 
            alt="Profile banner" 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-primary/10 to-secondary/10" />
        )}
        
        {/* Banner Upload Button */}
        <Button
          onClick={() => handleImageUpload('banner')}
          disabled={uploading}
          className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white border-0"
          size="sm"
        >
          <Camera className="h-4 w-4 mr-2" />
          {uploading ? 'Uploading...' : 'Edit Banner'}
        </Button>
      </div>

      {/* Profile Content */}
      <div className="max-w-4xl mx-auto px-4 -mt-16 relative z-10">
        <div className="bg-background rounded-lg border shadow-lg p-6">
          {/* Profile Header */}
          <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-6">
            <div className="flex items-end space-x-4 mb-4 md:mb-0">
              {/* Avatar */}
              <div className="relative">
                <Avatar className="h-24 w-24 md:h-32 md:w-32 border-4 border-background shadow-lg">
                  <AvatarImage src={profile?.avatar_url || undefined} />
                  <AvatarFallback className="text-2xl">
                    {profile?.display_name?.charAt(0) || profile?.username?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                
                <Button
                  onClick={() => handleImageUpload('avatar')}
                  disabled={uploading}
                  className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0"
                  size="sm"
                >
                  <Camera className="h-4 w-4" />
                </Button>
              </div>

              {/* User Info */}
              <div className="flex-1">
                <h1 className="text-2xl md:text-3xl font-bold">
                  {profile?.display_name || profile?.username || 'Anonymous User'}
                </h1>
                <p className="text-muted-foreground">@{profile?.username || 'anonymous'}</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-2">
              {isEditing ? (
                <>
                  <Button onClick={updateProfile} disabled={loading}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
                  </Button>
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                </>
              ) : (
                <Button onClick={() => setIsEditing(true)} variant="outline">
                  <Edit3 className="h-4 w-4 mr-2" />
                  Edit profile
                </Button>
              )}
              <Button onClick={signOut} variant="outline">
                Sign Out
              </Button>
            </div>
          </div>

          {/* Bio Section */}
          {isEditing ? (
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium mb-2">Display Name</label>
                <Input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your display name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Bio</label>
                <Textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell the world about yourself..."
                  rows={3}
                />
              </div>
            </div>
          ) : (
            <>
              {profile?.bio && (
                <p className="text-foreground mb-4 whitespace-pre-wrap">{profile.bio}</p>
              )}
            </>
          )}

          {/* Profile Stats */}
          <div className="flex items-center space-x-6 text-sm text-muted-foreground mb-6">
            <div className="flex items-center space-x-1">
              <MapPin className="h-4 w-4" />
              <span>Abstract Network</span>
            </div>
            <div className="flex items-center space-x-1">
              <Calendar className="h-4 w-4" />
              <span>Joined {profile?.created_at ? formatDate(profile.created_at) : 'Recently'}</span>
            </div>
          </div>

          {/* Stats Row */}
          <div className="flex space-x-6 border-t pt-4">
            <div className="text-center">
              <div className="font-bold text-lg">0</div>
              <div className="text-sm text-muted-foreground">Posts</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-lg">0</div>
              <div className="text-sm text-muted-foreground">Following</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-lg">0</div>
              <div className="text-sm text-muted-foreground">Followers</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;