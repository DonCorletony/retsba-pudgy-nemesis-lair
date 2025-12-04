import React, { useState, useRef } from 'react';
import NavBar from '../components/NavBar';
import FooterSection from '../components/FooterSection';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Upload, Download } from 'lucide-react';
import { toast } from 'sonner';

// Fixed dimensions - same for UI and canvas
const CARD_WIDTH = 560;
const CARD_HEIGHT = 350;

// Positions in pixels (based on 560x350 card)
const PHOTO_SIZE = 42; // reduced by 20%
const PHOTO_LEFT = 24;
const PHOTO_BOTTOM = 142;
const USERNAME_FONT = 22;
const USERNAME_GAP = 12;
const XP_FONT = 54;
const XP_LEFT = 24;
const XP_BOTTOM = 72; // from bottom of card, just above "Earned this week"

const XPCard = () => {
  const [username, setUsername] = useState('');
  const [xpAmount, setXpAmount] = useState('');
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
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
    try {
      const scale = 2;
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = CARD_WIDTH * scale;
      canvas.height = CARD_HEIGHT * scale;
      ctx.scale(scale, scale);

      // Load and draw template
      const templateImg = new Image();
      templateImg.crossOrigin = 'anonymous';
      
      await new Promise<void>((resolve, reject) => {
        templateImg.onload = () => resolve();
        templateImg.onerror = reject;
        templateImg.src = '/images/xp-template-v2.png';
      });
      
      ctx.drawImage(templateImg, 0, 0, CARD_WIDTH, CARD_HEIGHT);

      // Draw profile photo (circular) with object-cover behavior
      if (profilePhoto) {
        const profileImg = new Image();
        profileImg.crossOrigin = 'anonymous';
        
        await new Promise<void>((resolve, reject) => {
          profileImg.onload = () => resolve();
          profileImg.onerror = reject;
          profileImg.src = profilePhoto;
        });

        const photoX = PHOTO_LEFT;
        const photoY = CARD_HEIGHT - PHOTO_BOTTOM;

        // Calculate object-cover crop (center crop to square)
        const imgW = profileImg.naturalWidth;
        const imgH = profileImg.naturalHeight;
        const minDim = Math.min(imgW, imgH);
        const srcX = (imgW - minDim) / 2;
        const srcY = (imgH - minDim) / 2;

        ctx.save();
        ctx.beginPath();
        ctx.arc(photoX + PHOTO_SIZE / 2, photoY + PHOTO_SIZE / 2, PHOTO_SIZE / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(profileImg, srcX, srcY, minDim, minDim, photoX, photoY, PHOTO_SIZE, PHOTO_SIZE);
        ctx.restore();
      }

      // Draw username
      if (username) {
        const textX = profilePhoto ? PHOTO_LEFT + PHOTO_SIZE + USERNAME_GAP : PHOTO_LEFT;
        const textY = CARD_HEIGHT - PHOTO_BOTTOM + PHOTO_SIZE / 2; // center with photo

        ctx.font = `500 ${USERNAME_FONT}px -apple-system, BlinkMacSystemFont, sans-serif`;
        ctx.fillStyle = 'white';
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetY = 2;
        ctx.textBaseline = 'middle';
        ctx.fillText(username, textX, textY);
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
      }

      // Draw XP amount
      if (xpAmount) {
        const textX = XP_LEFT;
        const textY = CARD_HEIGHT - XP_BOTTOM;

        ctx.font = `400 ${XP_FONT}px Calibri, Carlito, sans-serif`;
        ctx.fillStyle = 'white';
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 8;
        ctx.shadowOffsetY = 2;
        ctx.textBaseline = 'middle';
        ctx.fillText(`${xpAmount} XP`, textX, textY);
      }

      // Download
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
    const numericValue = value.replace(/[^0-9]/g, '');
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
          </motion.div>

          <motion.div
            className="bg-black/40 backdrop-blur-sm rounded-2xl p-6 md:p-8 max-w-6xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8">
              {/* Card Preview - Left Side */}
              <div className="flex flex-col items-center">
                <h2 className="text-xl font-semibold mb-4 text-white/80">Preview</h2>
                <div 
                  className="relative rounded-lg overflow-hidden shadow-2xl [zoom:0.5] sm:[zoom:0.65] md:[zoom:0.8] lg:[zoom:1]"
                  style={{ 
                    width: `${CARD_WIDTH}px`, 
                    height: `${CARD_HEIGHT}px`
                  }}
                >
                  {/* Template Background */}
                  <img 
                    src="/images/xp-template-v2.png" 
                    alt="XP Card Template"
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Profile Photo */}
                  {profilePhoto && (
                    <div 
                      className="absolute rounded-full overflow-hidden"
                      style={{ 
                        width: `${PHOTO_SIZE}px`, 
                        height: `${PHOTO_SIZE}px`,
                        left: `${PHOTO_LEFT}px`,
                        bottom: `${PHOTO_BOTTOM - PHOTO_SIZE}px`
                      }}
                    >
                      <img 
                        src={profilePhoto} 
                        alt="Profile" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {/* Username */}
                  {username && (
                    <span 
                      className="absolute text-white font-medium"
                      style={{ 
                        fontSize: `${USERNAME_FONT}px`,
                        left: profilePhoto ? `${PHOTO_LEFT + PHOTO_SIZE + USERNAME_GAP}px` : `${PHOTO_LEFT}px`,
                        bottom: `${PHOTO_BOTTOM - PHOTO_SIZE / 2 - USERNAME_FONT / 2}px`,
                        textShadow: '0 2px 4px rgba(0,0,0,0.5)'
                      }}
                    >
                      {username}
                    </span>
                  )}

                  {/* XP Amount */}
                  {xpAmount && (
                    <div 
                      className="absolute"
                      style={{
                        left: `${XP_LEFT}px`,
                        bottom: `${XP_BOTTOM - XP_FONT / 2}px`,
                        fontSize: `${XP_FONT}px`,
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
                      <button
                        onClick={() => setProfilePhoto(null)}
                        className="text-red-400 hover:text-red-300 text-sm underline"
                      >
                        Remove
                      </button>
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