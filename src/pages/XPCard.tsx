import React, { useState, useRef } from 'react';
import NavBar from '../components/NavBar';
import FooterSection from '../components/FooterSection';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Upload, Download } from 'lucide-react';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';

const XPCard = () => {
  const [username, setUsername] = useState('');
  const [xpAmount, setXpAmount] = useState('');
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image must be less than 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setProfilePhoto(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDownload = async () => {
    if (!cardRef.current) return;
    
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
      });
      
      const link = document.createElement('a');
      link.download = `xp-card-${username || 'custom'}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      toast.success('XP Card downloaded!');
    } catch (error) {
      toast.error('Failed to download card');
      console.error(error);
    }
  };

  const formatXP = (value: string) => {
    // Remove non-numeric characters except commas
    const numericValue = value.replace(/[^0-9]/g, '');
    // Add commas for thousands
    return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const handleXPChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatXP(e.target.value);
    setXpAmount(formatted);
  };

  return (
    <div className="min-h-screen bg-retsba text-white overflow-hidden">
      <NavBar />
      
      <section className="pt-24 pb-20">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-stroke text-white text-5xl md:text-7xl mb-6">XP Card</h1>
            <p className="text-stroke text-white text-xl md:text-2xl max-w-2xl mx-auto">
              Create your custom XP card to share your weekly achievements
            </p>
          </motion.div>

          <motion.div
            className="bg-black/40 backdrop-blur-sm rounded-2xl p-6 md:p-8 max-w-6xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Card Preview - Left Side */}
              <div className="flex flex-col items-center">
                <h2 className="text-xl font-semibold mb-4 text-white/80">Preview</h2>
                <div 
                  ref={cardRef}
                  className="relative w-full max-w-[560px] aspect-[1.6/1] rounded-lg overflow-hidden shadow-2xl"
                >
                  {/* Template Background */}
                  <img 
                    src="/images/xp-template-v2.png" 
                    alt="XP Card Template"
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Overlay Content */}
                  <div className="absolute inset-0">
                    {/* Profile Photo & Username Row */}
                    {(profilePhoto || username) && (
                      <div 
                        className="absolute flex items-center gap-[2%]"
                        style={{ left: '4%', bottom: '34%' }}
                      >
                        {profilePhoto && (
                          <div 
                            className="rounded-full overflow-hidden w-[8.5%] aspect-square"
                          >
                            <img 
                              src={profilePhoto} 
                              alt="Profile" 
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        {username && (
                          <span 
                            className="text-white font-medium text-[20px]"
                            style={{ 
                              textShadow: '0 2px 4px rgba(0,0,0,0.5)'
                            }}
                          >
                            {username}
                          </span>
                        )}
                      </div>
                    )}
                    
                    {/* XP Amount */}
                    {xpAmount && (
                      <div 
                        className="absolute text-[48px]"
                        style={{
                          left: '4%',
                          bottom: '16%',
                          fontFamily: 'Calibri, Carlito, sans-serif',
                          fontWeight: '400',
                          color: 'white',
                          textShadow: '0 2px 8px rgba(0,0,0,0.5)',
                          letterSpacing: '-0.02em',
                          lineHeight: '1'
                        }}
                      >
                        {xpAmount} XP
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Input Controls - Right Side */}
              <div className="flex flex-col justify-center space-y-6">
                <h2 className="text-xl font-semibold mb-2 text-white/80">Customize Your Card</h2>
                
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-white/90">Username</Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    maxLength={30}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-white/40"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="xp" className="text-white/90">XP Amount</Label>
                  <Input
                    id="xp"
                    type="text"
                    placeholder="e.g. 60,000"
                    value={xpAmount}
                    onChange={handleXPChange}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-white/40"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-white/90">Profile Photo</Label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {profilePhoto ? 'Change Photo' : 'Upload Profile Photo'}
                  </Button>
                  {profilePhoto && (
                    <div className="flex items-center gap-2 mt-2">
                      <div className="w-10 h-10 rounded-full overflow-hidden border border-white/20">
                        <img src={profilePhoto} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                      <span className="text-white/60 text-sm">Photo uploaded</span>
                    </div>
                  )}
                </div>

                <Button
                  onClick={handleDownload}
                  className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold py-3"
                  disabled={!username && !xpAmount}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download XP Card
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
      
      <FooterSection />
    </div>
  );
};

export default XPCard;
