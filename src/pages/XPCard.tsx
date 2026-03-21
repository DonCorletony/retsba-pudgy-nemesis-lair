import React, { useState, useRef, useEffect, useCallback } from 'react';
import FooterSection from '../components/FooterSection';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Upload, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import { useLanguage } from '@/contexts/LanguageContext';

// Import English All-Time templates
import AllTime1 from '@/assets/xp-templates/All_Time_1.png';
import AllTime2 from '@/assets/xp-templates/All_Time_2.png';

// Import Spanish templates
import XPTemplate1_ES from '@/assets/xp-cards/es/XP_Template_1.png';
import XPTemplate2_ES from '@/assets/xp-cards/es/XP_Template_2.png';
import XPTemplate3_ES from '@/assets/xp-cards/es/XP_Template_3.png';
import XPTemplate4_ES from '@/assets/xp-cards/es/XP_Template_4.png';
import XPTemplate5_ES from '@/assets/xp-cards/es/XP_Template_5.png';
import XPTemplate6_ES from '@/assets/xp-cards/es/XP_Template_6.png';
import AllTime1_ES from '@/assets/xp-cards/es/All_Time_1.png';
import AllTime2_ES from '@/assets/xp-cards/es/All_Time_2.png';

// Import Japanese templates
import XPTemplate1_JA from '@/assets/xp-cards/ja/XP_Template_1.png';
import XPTemplate2_JA from '@/assets/xp-cards/ja/XP_Template_2.png';
import XPTemplate3_JA from '@/assets/xp-cards/ja/XP_Template_3.png';
import XPTemplate4_JA from '@/assets/xp-cards/ja/XP_Template_4.png';
import XPTemplate5_JA from '@/assets/xp-cards/ja/XP_Template_5.png';
import XPTemplate6_JA from '@/assets/xp-cards/ja/XP_Template_6.png';
import AllTime1_JA from '@/assets/xp-cards/ja/All_Time_1.png';
import AllTime2_JA from '@/assets/xp-cards/ja/All_Time_2.png';

// Import Korean templates
import XPTemplate1_KO from '@/assets/xp-cards/ko/XP_Template_1.png';
import XPTemplate2_KO from '@/assets/xp-cards/ko/XP_Template_2.png';
import XPTemplate3_KO from '@/assets/xp-cards/ko/XP_Template_3.png';
import XPTemplate4_KO from '@/assets/xp-cards/ko/XP_Template_4.png';
import XPTemplate5_KO from '@/assets/xp-cards/ko/XP_Template_5.png';
import XPTemplate6_KO from '@/assets/xp-cards/ko/XP_Template_6.png';
import AllTime1_KO from '@/assets/xp-cards/ko/All_Time_1.png';
import AllTime2_KO from '@/assets/xp-cards/ko/All_Time_2.png';

// Import Chinese templates
import XPTemplate1_ZH from '@/assets/xp-cards/zh/XP_Template_1.png';
import XPTemplate2_ZH from '@/assets/xp-cards/zh/XP_Template_2.png';
import XPTemplate3_ZH from '@/assets/xp-cards/zh/XP_Template_3.png';
import XPTemplate4_ZH from '@/assets/xp-cards/zh/XP_Template_4.png';
import XPTemplate5_ZH from '@/assets/xp-cards/zh/XP_Template_5.png';
import XPTemplate6_ZH from '@/assets/xp-cards/zh/XP_Template_6.png';
import AllTime1_ZH from '@/assets/xp-cards/zh/All_Time_1.png';
import AllTime2_ZH from '@/assets/xp-cards/zh/All_Time_2.png';

// Import French templates
import XPTemplate1_FR from '@/assets/xp-cards/fr/XP_Template_1.png';
import XPTemplate2_FR from '@/assets/xp-cards/fr/XP_Template_2.png';
import XPTemplate3_FR from '@/assets/xp-cards/fr/XP_Template_3.png';
import XPTemplate4_FR from '@/assets/xp-cards/fr/XP_Template_4.png';
import XPTemplate5_FR from '@/assets/xp-cards/fr/XP_Template_5.png';
import XPTemplate6_FR from '@/assets/xp-cards/fr/XP_Template_6.png';
import AllTime1_FR from '@/assets/xp-cards/fr/All_Time_1.png';
import AllTime2_FR from '@/assets/xp-cards/fr/All_Time_2.png';

// Import German templates
import XPTemplate1_DE from '@/assets/xp-cards/de/XP_Template_1.png';
import XPTemplate2_DE from '@/assets/xp-cards/de/XP_Template_2.png';
import XPTemplate3_DE from '@/assets/xp-cards/de/XP_Template_3.png';
import XPTemplate4_DE from '@/assets/xp-cards/de/XP_Template_4.png';
import XPTemplate5_DE from '@/assets/xp-cards/de/XP_Template_5.png';
import XPTemplate6_DE from '@/assets/xp-cards/de/XP_Template_6.png';
import AllTime1_DE from '@/assets/xp-cards/de/All_Time_1.png';
import AllTime2_DE from '@/assets/xp-cards/de/All_Time_2.png';

// Import Portuguese templates
import XPTemplate1_PT from '@/assets/xp-cards/pt/XP_Template_1.png';
import XPTemplate2_PT from '@/assets/xp-cards/pt/XP_Template_2.png';
import XPTemplate3_PT from '@/assets/xp-cards/pt/XP_Template_3.png';
import XPTemplate4_PT from '@/assets/xp-cards/pt/XP_Template_4.png';
import XPTemplate5_PT from '@/assets/xp-cards/pt/XP_Template_5.png';
import XPTemplate6_PT from '@/assets/xp-cards/pt/XP_Template_6.png';
import AllTime1_PT from '@/assets/xp-cards/pt/All_Time_1.png';
import AllTime2_PT from '@/assets/xp-cards/pt/All_Time_2.png';

// Import Arabic templates
import XPTemplate1_AR from '@/assets/xp-cards/ar/XP_Template_1.png';
import XPTemplate2_AR from '@/assets/xp-cards/ar/XP_Template_2.png';
import XPTemplate3_AR from '@/assets/xp-cards/ar/XP_Template_3.png';
import XPTemplate4_AR from '@/assets/xp-cards/ar/XP_Template_4.png';
import XPTemplate5_AR from '@/assets/xp-cards/ar/XP_Template_5.png';
import XPTemplate6_AR from '@/assets/xp-cards/ar/XP_Template_6.png';
import AllTime1_AR from '@/assets/xp-cards/ar/All_Time_1.png';
import AllTime2_AR from '@/assets/xp-cards/ar/All_Time_2.png';

// Import Russian templates
import XPTemplate1_RU from '@/assets/xp-cards/ru/XP_Template_1.png';
import XPTemplate2_RU from '@/assets/xp-cards/ru/XP_Template_2.png';
import XPTemplate3_RU from '@/assets/xp-cards/ru/XP_Template_3.png';
import XPTemplate4_RU from '@/assets/xp-cards/ru/XP_Template_4.png';
import XPTemplate5_RU from '@/assets/xp-cards/ru/XP_Template_5.png';
import XPTemplate6_RU from '@/assets/xp-cards/ru/XP_Template_6.png';
import AllTime1_RU from '@/assets/xp-cards/ru/All_Time_1.png';
import AllTime2_RU from '@/assets/xp-cards/ru/All_Time_2.png';

// Import new templates (English only for now)
import XPTemplateFrankyGO from '@/assets/xp-cards/XP_Template_FrankyGO.png';
import XPTemplateTollan from '@/assets/xp-templates/XP_Template_Tollan.png';
import XPTemplate8 from '@/assets/xp-templates/XP_Template_8.png';
import XPTemplate9 from '@/assets/xp-templates/XP_Template_9.png';
import XPTemplate10 from '@/assets/xp-templates/XP_Template_10.png';
import XPTemplate11 from '@/assets/xp-templates/XP_Template_11.png';

// Track which templates should show "NEW" badge (last two templates)
const NEW_TEMPLATE_INDICES = new Set<number>();
// Fixed dimensions - same for UI and canvas
const CARD_WIDTH = 560;
const CARD_HEIGHT = 350;

// Positions in pixels (based on 560x350 card)
const PHOTO_SIZE = 42;
const PHOTO_LEFT = 24;
const PHOTO_BOTTOM = 142;
const USERNAME_FONT = 22;
const USERNAME_GAP = 12;
const XP_FONT = 54;
const XP_LEFT = 24;
const XP_BOTTOM = 72;

// English Weekly templates (default)
const WEEKLY_TEMPLATES_EN = [
  XPTemplateFrankyGO,
  XPTemplateTollan,
  XPTemplate8,
  XPTemplate9,
  '/images/xp-template-v2.png',
  '/images/xp-template-2.png',
  '/images/xp-template-3.png',
  '/images/xp-template-4.png',
  '/images/xp-template-6.png',
  '/images/xp-template-7.png',
  XPTemplate10,
  XPTemplate11,
];

// Default template index (XP Template 10)
const DEFAULT_TEMPLATE_INDEX = 10;

// Mark last two templates as NEW
NEW_TEMPLATE_INDICES.add(10);
NEW_TEMPLATE_INDICES.add(11);



// English All-Time templates (default)
const ALL_TIME_TEMPLATES_EN = [AllTime1, AllTime2];

// Spanish templates
const WEEKLY_TEMPLATES_ES = [
  XPTemplate1_ES,
  XPTemplate2_ES,
  XPTemplate3_ES,
  XPTemplate4_ES,
  XPTemplate5_ES,
  XPTemplate6_ES,
];
const ALL_TIME_TEMPLATES_ES = [AllTime1_ES, AllTime2_ES];

// Japanese templates
const WEEKLY_TEMPLATES_JA = [
  XPTemplate1_JA,
  XPTemplate2_JA,
  XPTemplate3_JA,
  XPTemplate4_JA,
  XPTemplate5_JA,
  XPTemplate6_JA,
];
const ALL_TIME_TEMPLATES_JA = [AllTime1_JA, AllTime2_JA];

// Korean templates
const WEEKLY_TEMPLATES_KO = [
  XPTemplate1_KO,
  XPTemplate2_KO,
  XPTemplate3_KO,
  XPTemplate4_KO,
  XPTemplate5_KO,
  XPTemplate6_KO,
];
const ALL_TIME_TEMPLATES_KO = [AllTime1_KO, AllTime2_KO];

// Chinese templates
const WEEKLY_TEMPLATES_ZH = [
  XPTemplate1_ZH,
  XPTemplate2_ZH,
  XPTemplate3_ZH,
  XPTemplate4_ZH,
  XPTemplate5_ZH,
  XPTemplate6_ZH,
];
const ALL_TIME_TEMPLATES_ZH = [AllTime1_ZH, AllTime2_ZH];

// French templates
const WEEKLY_TEMPLATES_FR = [
  XPTemplate1_FR,
  XPTemplate2_FR,
  XPTemplate3_FR,
  XPTemplate4_FR,
  XPTemplate5_FR,
  XPTemplate6_FR,
];
const ALL_TIME_TEMPLATES_FR = [AllTime1_FR, AllTime2_FR];

// German templates
const WEEKLY_TEMPLATES_DE = [
  XPTemplate1_DE,
  XPTemplate2_DE,
  XPTemplate3_DE,
  XPTemplate4_DE,
  XPTemplate5_DE,
  XPTemplate6_DE,
];
const ALL_TIME_TEMPLATES_DE = [AllTime1_DE, AllTime2_DE];

// Portuguese templates
const WEEKLY_TEMPLATES_PT = [
  XPTemplate1_PT,
  XPTemplate2_PT,
  XPTemplate3_PT,
  XPTemplate4_PT,
  XPTemplate5_PT,
  XPTemplate6_PT,
];
const ALL_TIME_TEMPLATES_PT = [AllTime1_PT, AllTime2_PT];

// Arabic templates
const WEEKLY_TEMPLATES_AR = [
  XPTemplate1_AR,
  XPTemplate2_AR,
  XPTemplate3_AR,
  XPTemplate4_AR,
  XPTemplate5_AR,
  XPTemplate6_AR,
];
const ALL_TIME_TEMPLATES_AR = [AllTime1_AR, AllTime2_AR];

// Russian templates
const WEEKLY_TEMPLATES_RU = [
  XPTemplate1_RU,
  XPTemplate2_RU,
  XPTemplate3_RU,
  XPTemplate4_RU,
  XPTemplate5_RU,
  XPTemplate6_RU,
];
const ALL_TIME_TEMPLATES_RU = [AllTime1_RU, AllTime2_RU];

// Template map by language code
const WEEKLY_TEMPLATES_BY_LANG: Record<string, string[]> = {
  en: WEEKLY_TEMPLATES_EN,
  es: WEEKLY_TEMPLATES_ES,
  ja: WEEKLY_TEMPLATES_JA,
  ko: WEEKLY_TEMPLATES_KO,
  zh: WEEKLY_TEMPLATES_ZH,
  fr: WEEKLY_TEMPLATES_FR,
  de: WEEKLY_TEMPLATES_DE,
  pt: WEEKLY_TEMPLATES_PT,
  ar: WEEKLY_TEMPLATES_AR,
  ru: WEEKLY_TEMPLATES_RU,
};

const ALL_TIME_TEMPLATES_BY_LANG: Record<string, string[]> = {
  en: ALL_TIME_TEMPLATES_EN,
  es: ALL_TIME_TEMPLATES_ES,
  ja: ALL_TIME_TEMPLATES_JA,
  ko: ALL_TIME_TEMPLATES_KO,
  zh: ALL_TIME_TEMPLATES_ZH,
  fr: ALL_TIME_TEMPLATES_FR,
  de: ALL_TIME_TEMPLATES_DE,
  pt: ALL_TIME_TEMPLATES_PT,
  ar: ALL_TIME_TEMPLATES_AR,
  ru: ALL_TIME_TEMPLATES_RU,
};

const XPCard = () => {
  const { t, language } = useLanguage();
  const [username, setUsername] = useState('');
  const [xpAmount, setXpAmount] = useState('');
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [currentTemplate, setCurrentTemplate] = useState(DEFAULT_TEMPLATE_INDEX);
  const [isAllTime, setIsAllTime] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get templates based on current language (fallback to English)
  const weeklyTemplates = WEEKLY_TEMPLATES_BY_LANG[language] || WEEKLY_TEMPLATES_EN;
  const allTimeTemplates = ALL_TIME_TEMPLATES_BY_LANG[language] || ALL_TIME_TEMPLATES_EN;
  const templates = isAllTime ? allTimeTemplates : weeklyTemplates;

  const nextTemplate = () => {
    setCurrentTemplate((prev) => (prev + 1) % templates.length);
  };

  const prevTemplate = () => {
    setCurrentTemplate((prev) => (prev - 1 + templates.length) % templates.length);
  };

  const handleModeSwitch = (checked: boolean) => {
    setIsAllTime(checked);
    setCurrentTemplate(checked ? 0 : DEFAULT_TEMPLATE_INDEX); // Reset template when switching modes
  };

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
      const scale = 4; // 4x resolution for high quality output (2240x1400px)
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
        templateImg.src = templates[currentTemplate];
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
      <section className="pt-16 pb-20">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-stroke text-white text-5xl md:text-7xl mb-6">{t('xpCard')}</h1>
          </motion.div>

          <motion.div
            className="bg-white dark:bg-retsba rounded-2xl p-6 md:p-8 max-w-6xl mx-auto border border-transparent dark:border-white/20"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8">
              {/* Card Preview - Left Side */}
              <div className="flex flex-col items-center w-full">
                {/* Header with Preview title and Weekly/All-Time toggle */}
                <div className="flex items-center justify-between w-full mb-4" style={{ maxWidth: `min(${CARD_WIDTH}px, 90vw)` }}>
                  <h2 className="text-xl font-semibold text-black dark:text-white">{t('preview')}</h2>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${!isAllTime ? 'text-black dark:text-white' : 'text-black/50 dark:text-white/50'}`}>
                      {t('weekly')}
                    </span>
                    <Switch 
                      checked={isAllTime} 
                      onCheckedChange={handleModeSwitch}
                    />
                    <span className={`text-sm font-medium ${isAllTime ? 'text-black dark:text-white' : 'text-black/50 dark:text-white/50'}`}>
                      {t('allTime')}
                    </span>
                  </div>
                </div>
                <div 
                  className="relative rounded-lg overflow-hidden shadow-2xl"
                  style={{ 
                    width: `min(${CARD_WIDTH}px, 90vw)`,
                    aspectRatio: `${CARD_WIDTH}/${CARD_HEIGHT}`,
                    WebkitTextSizeAdjust: 'none',
                    textSizeAdjust: 'none'
                  } as React.CSSProperties}
                >
                  {/* NEW Badge - shows for new templates in weekly mode */}
                  {!isAllTime && NEW_TEMPLATE_INDICES.has(currentTemplate) && language === 'en' && (
                    <div className="absolute top-3 right-3 z-10 bg-white text-black text-xs font-bold px-2.5 py-1 rounded-full shadow-lg">
                      NEW
                    </div>
                  )}

                  {/* Template Background */}
                  <img 
                    src={templates[currentTemplate]} 
                    alt="XP Card Template"
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Profile Photo */}
                  {profilePhoto && (
                    <div 
                      className="absolute rounded-full overflow-hidden"
                      style={{ 
                        width: `${(PHOTO_SIZE / CARD_WIDTH) * 100}%`,
                        aspectRatio: '1',
                        left: `${(PHOTO_LEFT / CARD_WIDTH) * 100}%`,
                        bottom: `${((PHOTO_BOTTOM - PHOTO_SIZE) / CARD_HEIGHT) * 100}%`
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
                        fontSize: `clamp(16px, ${(USERNAME_FONT / CARD_WIDTH) * 100}vw, ${USERNAME_FONT}px)`,
                        left: profilePhoto ? `${((PHOTO_LEFT + PHOTO_SIZE + USERNAME_GAP) / CARD_WIDTH) * 100}%` : `${(PHOTO_LEFT / CARD_WIDTH) * 100}%`,
                        bottom: `${((PHOTO_BOTTOM - PHOTO_SIZE / 2 - USERNAME_FONT / 2) / CARD_HEIGHT) * 100}%`,
                        textShadow: '0 2px 4px rgba(0,0,0,0.5)'
                      } as React.CSSProperties}
                    >
                      {username}
                    </span>
                  )}

                  {/* XP Amount */}
                  {xpAmount && (
                    <div 
                      className="absolute"
                      style={{
                        left: `${(XP_LEFT / CARD_WIDTH) * 100}%`,
                        bottom: `${((XP_BOTTOM - XP_FONT / 2) / CARD_HEIGHT) * 100}%`,
                        fontSize: `clamp(24px, ${(XP_FONT / CARD_WIDTH) * 100}vw, ${XP_FONT}px)`,
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
                
                {/* Template Navigation */}
                <div className="flex items-center justify-center gap-4 mt-4">
                  <button
                    onClick={prevTemplate}
                    className="p-1 hover:opacity-70 transition-opacity"
                  >
                    <ChevronLeft className="w-5 h-5 text-black dark:text-white" />
                  </button>
                  
                  <div className="flex items-center gap-2">
                    {templates.map((_, index) => (
                      <React.Fragment key={index}>
                        <button
                          onClick={() => setCurrentTemplate(index)}
                          className={`w-2.5 h-2.5 rounded-full transition-colors border border-black dark:border-white ${
                            index === currentTemplate ? 'bg-black dark:bg-white' : 'bg-white dark:bg-black'
                          }`}
                        />
                        {/* Divider after the first two collab cards in weekly mode */}
                        {!isAllTime && index === 1 && language === 'en' && (
                          <span className="text-black dark:text-white text-sm font-light mx-1">|</span>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                  
                  <button
                    onClick={nextTemplate}
                    className="p-1 hover:opacity-70 transition-opacity"
                  >
                    <ChevronRight className="w-5 h-5 text-black dark:text-white" />
                  </button>
                </div>
              </div>

              {/* Input Controls - Right Side */}
              <div className="flex flex-col justify-center space-y-6">
                <h2 className="text-xl font-semibold mb-2 text-black dark:text-white">{t('customizeYourCard')}</h2>
                
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-black dark:text-white">{t('username')}</Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder={t('enterUsername')}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    maxLength={30}
                    className="bg-white dark:bg-retsba border-black dark:border-white text-black dark:text-white placeholder:text-black/40 dark:placeholder:text-white/40 focus:border-black dark:focus:border-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="xp" className="text-black dark:text-white">{t('xpAmount')}</Label>
                  <Input
                    id="xp"
                    type="text"
                    placeholder="e.g. 60,000"
                    value={xpAmount}
                    onChange={handleXPChange}
                    className="bg-white dark:bg-retsba border-black dark:border-white text-black dark:text-white placeholder:text-black/40 dark:placeholder:text-white/40 focus:border-black dark:focus:border-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-black dark:text-white">{t('profilePhoto')}</Label>
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
                    className="w-full bg-white dark:bg-retsba border-black dark:border-white text-black dark:text-white hover:bg-gray-100 dark:hover:bg-white/10 hover:text-black dark:hover:text-white"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {profilePhoto ? t('changePhoto') : t('uploadProfilePhoto')}
                  </Button>
                  {profilePhoto && (
                    <div className="flex items-center gap-2 mt-2">
                      <div className="w-10 h-10 rounded-full overflow-hidden border border-black dark:border-white">
                        <img src={profilePhoto} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                      <span className="text-black/60 dark:text-white/60 text-sm">{t('photoUploaded')}</span>
                      <button
                        onClick={() => setProfilePhoto(null)}
                        className="text-red-400 hover:text-red-300 text-sm underline"
                      >
                        {t('remove')}
                      </button>
                    </div>
                  )}
                </div>

                <Button
                  onClick={handleDownload}
                  className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-3"
                  disabled={!username && !xpAmount}
                >
                  <Download className="w-4 h-4 mr-2" />
                  {t('downloadCard')}
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