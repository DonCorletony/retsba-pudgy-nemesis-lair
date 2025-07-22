import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Camera, Edit3, MapPin, Calendar, Loader2 } from 'lucide-react';
import NavBar from '@/components/NavBar';

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
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (!session?.user) {
          navigate('/');
        } else {
          setTimeout(() => {
            fetchProfile(session.user.id);
          }, 0);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (!session?.user) {
        navigate('/');
      } else {
        fetchProfile(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
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
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file);

    if (uploadError) {
      console.error('Error uploading image:', uploadError);
      return null;
    }

    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'banner') => {
    const file = event.target.files?.[0];
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
      <NavBar />
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
          onClick={() => bannerInputRef.current?.click()}
          disabled={uploading}
          className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white border-0"
          size="sm"
        >
          <Camera className="h-4 w-4 mr-2" />
          {uploading ? 'Uploading...' : 'Edit Banner'}
        </Button>
        
        <input
          ref={bannerInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => handleImageUpload(e, 'banner')}
          className="hidden"
        />
      </div>

      {/* Profile Content */}
      <div className="max-w-4xl mx-auto px-4 -mt-16 relative z-10">
        {/* Profile Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-8">
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
                onClick={() => avatarInputRef.current?.click()}
                disabled={uploading}
                className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0"
                size="sm"
              >
                <Camera className="h-4 w-4" />
              </Button>
              
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleImageUpload(e, 'avatar')}
                className="hidden"
              />
            </div>

            {/* User Info */}
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl md:text-3xl font-bold text-white drop-shadow-lg">
                  {profile?.display_name || profile?.username || 'Anonymous User'}
                </h1>
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-white/80 hover:text-white transition-colors p-1"
                  disabled={isEditing}
                >
                  <Edit3 className="h-4 w-4" />
                </button>
              </div>
              <p className="text-white/80 drop-shadow">@{profile?.username || 'anonymous'}</p>
            </div>
          </div>

          {/* Action Buttons */}
          {isEditing && (
            <div className="flex space-x-2">
              <Button onClick={updateProfile} disabled={loading} className="bg-white/10 backdrop-blur-sm border-white/20">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
              </Button>
              <Button variant="outline" onClick={() => setIsEditing(false)} className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20">
                Cancel
              </Button>
            </div>
          )}
        </div>

        {/* Profile Details Section */}
        {/* Bio Section */}
        {isEditing ? (
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium mb-2 text-white">Display Name</label>
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your display name"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-white">Bio</label>
              <Textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell the world about yourself..."
                rows={3}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
              />
            </div>
          </div>
        ) : (
          <>
            {profile?.bio && (
              <p className="text-white whitespace-pre-wrap mb-4">{profile.bio}</p>
            )}
            
            {/* Profile Info */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-white/80">
              <div className="flex items-center space-x-1">
                <MapPin className="h-4 w-4" />
                <span>Abstract Network</span>
              </div>
              <div className="flex items-center space-x-1">
                <Calendar className="h-4 w-4" />
                <span>Joined {profile?.created_at ? formatDate(profile.created_at) : 'Recently'}</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Profile;