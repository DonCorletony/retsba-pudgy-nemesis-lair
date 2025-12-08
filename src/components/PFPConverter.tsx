import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Download, RefreshCw, AlertCircle, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import Template from '@/assets/pfp-templates/Template.png';
import Template_2 from '@/assets/pfp-templates/Template_2.png';

// Head traits that require Template_2 instead of the default Template
const TEMPLATE_2_HEAD_TRAITS = [
  'Headband',
  'Backwards_Hat_Red',
  'Jester_Hat',
  'Sideways_Blue',
  'Blue_Durag',
  'Red_Durag',
  'Ninja_Headband',
  'Backwards_Hat_Blue',
  'Sideways_Red',
];

// Face traits that require Template_2 instead of the default Template
const TEMPLATE_2_FACE_TRAITS = [
  'Villain_Mask',
];

// Import all head trait overlays
import Afro_with_Pick from '@/assets/pfp-traits/head/Afro_with_Pick.png';
import Backwards_Hat_Blue from '@/assets/pfp-traits/head/Backwards_Hat_Blue.png';
import Backwards_Hat_Red from '@/assets/pfp-traits/head/Backwards_Hat_Red.png';
import Banana_Suit from '@/assets/pfp-traits/head/Banana_Suit.png';
import Beanie_Gray from '@/assets/pfp-traits/head/Beanie_Gray.png';
import Beanie_Orange from '@/assets/pfp-traits/head/Beanie_Orange.png';
import Biker_Helmet from '@/assets/pfp-traits/head/Biker_Helmet.png';
import Blue_Durag from '@/assets/pfp-traits/head/Blue_Durag.png';
import Bucket_Hat_Green from '@/assets/pfp-traits/head/Bucket_Hat_Green.png';
import Bucket_Hat_Tan from '@/assets/pfp-traits/head/Bucket_Hat_Tan.png';
import Camo_Helmet from '@/assets/pfp-traits/head/Camo_Helmet.png';
import Cowboy_Hat from '@/assets/pfp-traits/head/Cowboy_Hat.png';
import Crown from '@/assets/pfp-traits/head/Crown.png';
import Egg from '@/assets/pfp-traits/head/Egg.png';
import Egg_Gold from '@/assets/pfp-traits/head/Egg_Gold.png';
import Fish_Blue from '@/assets/pfp-traits/head/Fish_Blue.png';
import Fish_Gold from '@/assets/pfp-traits/head/Fish_Gold.png';
import Fish_Green from '@/assets/pfp-traits/head/Fish_Green.png';
import Fish_Orange from '@/assets/pfp-traits/head/Fish_Orange.png';
import Flat_Cap_Black from '@/assets/pfp-traits/head/Flat_Cap_Black.png';
import Flat_Cap_Blue from '@/assets/pfp-traits/head/Flat_Cap_Blue.png';
import Flat_Cap_Tan from '@/assets/pfp-traits/head/Flat_Cap_Tan.png';
import Flower_Crown from '@/assets/pfp-traits/head/Flower_Crown.png';
import Ghost from '@/assets/pfp-traits/head/Ghost.png';
import Grizzly_Bear_Hat from '@/assets/pfp-traits/head/Grizzly_Bear_Hat.png';
import Hat_Blue from '@/assets/pfp-traits/head/Hat_Blue.png';
import Hat_Red from '@/assets/pfp-traits/head/Hat_Red.png';
import Hatched from '@/assets/pfp-traits/head/Hatched.png';
import Hatched_Gold from '@/assets/pfp-traits/head/Hatched_Gold.png';
import Headband from '@/assets/pfp-traits/head/Headband.png';
import Hippy_Hair from '@/assets/pfp-traits/head/Hippy_Hair.png';
import Ice_Crown from '@/assets/pfp-traits/head/Ice_Crown.png';
import Jester_Hat from '@/assets/pfp-traits/head/Jester_Hat.png';
import Macaroni from '@/assets/pfp-traits/head/Macaroni.png';
import Mohawk_Green from '@/assets/pfp-traits/head/Mohawk_Green.png';
import Mohawk_Purple from '@/assets/pfp-traits/head/Mohawk_Purple.png';
import Ninja_Headband from '@/assets/pfp-traits/head/Ninja_Headband.png';
import Panda_Hat from '@/assets/pfp-traits/head/Panda_Hat.png';
import Party_Hat from '@/assets/pfp-traits/head/Party_Hat.png';
import Pineapple from '@/assets/pfp-traits/head/Pineapple.png';
import Pink_Beanie from '@/assets/pfp-traits/head/Pink_Beanie.png';
import Pirate_Hat from '@/assets/pfp-traits/head/Pirate_Hat.png';
import Polar_Bear_Hat from '@/assets/pfp-traits/head/Polar_Bear_Hat.png';
import Red_Durag from '@/assets/pfp-traits/head/Red_Durag.png';
import Rice_Hat from '@/assets/pfp-traits/head/Rice_Hat.png';
import Santa_Hat from '@/assets/pfp-traits/head/Santa_Hat.png';
import Shark_Suit from '@/assets/pfp-traits/head/Shark_Suit.png';
import Sideways_Blue from '@/assets/pfp-traits/head/Sideways_Blue.png';
import Sideways_Red from '@/assets/pfp-traits/head/Sideways_Red.png';
import Sombrero from '@/assets/pfp-traits/head/Sombrero.png';
import Top_Hat from '@/assets/pfp-traits/head/Top_Hat.png';
import Viking_Hat from '@/assets/pfp-traits/head/Viking_Hat.png';
import Wizard_Hat from '@/assets/pfp-traits/head/Wizard_Hat.png';

// Import all face trait overlays
import Handlebar_Bear from '@/assets/pfp-traits/face/Handlebar_Bear.png';
import Football from '@/assets/pfp-traits/face/Football.png';
import Goggles from '@/assets/pfp-traits/face/Goggles.png';
import Moustache from '@/assets/pfp-traits/face/Moustache.png';
import Hero_Mask_Blue from '@/assets/pfp-traits/face/Hero_Mask_Blue.png';
import Hero_Mask_Red from '@/assets/pfp-traits/face/Hero_Mask_Red.png';
import Star_Glasses from '@/assets/pfp-traits/face/Star_Glasses.png';
import Villain_Mask from '@/assets/pfp-traits/face/Villain_Mask.png';
import Circle_Glasses from '@/assets/pfp-traits/face/Circle_Glasses.png';
import Blush from '@/assets/pfp-traits/face/Blush.png';
import Scouter from '@/assets/pfp-traits/face/Scouter.png';
import Star_Eyes from '@/assets/pfp-traits/face/Star_Eyes.png';
import Clout_Goggles from '@/assets/pfp-traits/face/Clout_Goggles.png';
import Aviators from '@/assets/pfp-traits/face/Aviators.png';
import Beard from '@/assets/pfp-traits/face/Beard.png';
import Scar from '@/assets/pfp-traits/face/Scar.png';
import Cucumbers from '@/assets/pfp-traits/face/Cucumbers.png';
import Eye_Patch from '@/assets/pfp-traits/face/Eye_Patch.png';
import Squad from '@/assets/pfp-traits/face/Squad.png';
import Monacle from '@/assets/pfp-traits/face/Monacle.png';

// Mapping of trait names to imported images
const HEAD_TRAIT_MAP: Record<string, string> = {
  Afro_with_Pick,
  Backwards_Hat_Blue,
  Backwards_Hat_Red,
  Banana_Suit,
  Beanie_Gray,
  Beanie_Orange,
  Biker_Helmet,
  Blue_Durag,
  Bucket_Hat_Green,
  Bucket_Hat_Tan,
  Camo_Helmet,
  Cowboy_Hat,
  Crown,
  Egg,
  Egg_Gold,
  Fish_Blue,
  Fish_Gold,
  Fish_Green,
  Fish_Orange,
  Flat_Cap_Black,
  Flat_Cap_Blue,
  Flat_Cap_Tan,
  Flower_Crown,
  Ghost,
  Grizzly_Bear_Hat,
  Hat_Blue,
  Hat_Red,
  Hatched,
  Hatched_Gold,
  Headband,
  Hippy_Hair,
  Ice_Crown,
  Jester_Hat,
  Macaroni,
  Mohawk_Green,
  Mohawk_Purple,
  Ninja_Headband,
  Panda_Hat,
  Party_Hat,
  Pineapple,
  Pink_Beanie,
  Pirate_Hat,
  Polar_Bear_Hat,
  Red_Durag,
  Rice_Hat,
  Santa_Hat,
  Shark_Suit,
  Sideways_Blue,
  Sideways_Red,
  Sombrero,
  Top_Hat,
  Viking_Hat,
  Wizard_Hat,
};

// Mapping of face trait names to imported images
const FACE_TRAIT_MAP: Record<string, string> = {
  Handlebar_Bear,
  Football,
  Goggles,
  Moustache,
  Hero_Mask_Blue,
  Hero_Mask_Red,
  Star_Glasses,
  Villain_Mask,
  Circle_Glasses,
  Blush,
  Scouter,
  Star_Eyes,
  Clout_Goggles,
  Aviators,
  Beard,
  Scar,
  Cucumbers,
  Eye_Patch,
  Squad,
  Monacle,
};

interface DetectedTraits {
  isPudgy: boolean;
  traits: {
    background: string | null;
    skin: string | null;
    body: string | null;
    face: string | null;
    head: string | null;
    hand: string | null;
  };
  confidence: 'high' | 'medium' | 'low';
  description: string;
}

type AnalysisStep = 'idle' | 'uploading' | 'analyzing' | 'compositing' | 'complete' | 'error';

const PFPConverter = () => {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [detectedTraits, setDetectedTraits] = useState<DetectedTraits | null>(null);
  const [retsbafiedImage, setRetsbafiedImage] = useState<string | null>(null);
  const [step, setStep] = useState<AnalysisStep>('idle');
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      processFile(file);
    } else {
      toast.error('Please upload an image file');
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  }, []);

  const processFile = async (file: File) => {
    setStep('uploading');
    setError(null);
    setDetectedTraits(null);
    setRetsbafiedImage(null);

    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result as string;
      setUploadedImage(base64);
      await analyzeImage(base64);
    };
    reader.readAsDataURL(file);
  };

  const analyzeImage = async (imageBase64: string) => {
    setStep('analyzing');
    
    try {
      const { data, error } = await supabase.functions.invoke('analyze-pudgy', {
        body: { imageBase64 }
      });

      if (error) {
        throw new Error(error.message || 'Failed to analyze image');
      }

      if (data.error) {
        throw new Error(data.error);
      }

      if (!data.isPudgy) {
        setError("This doesn't appear to be a Pudgy Penguin NFT. Please upload a valid Pudgy image.");
        setStep('error');
        return;
      }

      setDetectedTraits(data);
      setStep('compositing');
      
      // Generate the Retsbafied image
      await generateRetsbafiedImage(data);
      
    } catch (err) {
      console.error('Analysis error:', err);
      setError(err instanceof Error ? err.message : 'Failed to analyze image');
      setStep('error');
    }
  };

  const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  };

  const generateRetsbafiedImage = async (traits: DetectedTraits) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 1000;
    canvas.height = 1000;

    try {
      // Determine which template to use based on head or face trait
      const headTrait = traits.traits.head;
      const faceTrait = traits.traits.face;
      const useTemplate2 = (headTrait && TEMPLATE_2_HEAD_TRAITS.includes(headTrait)) || 
                           (faceTrait && TEMPLATE_2_FACE_TRAITS.includes(faceTrait));
      const templateSrc = useTemplate2 ? Template_2 : Template;
      
      console.log(`Using template: ${useTemplate2 ? 'Template_2' : 'Template'} for head: ${headTrait}, face: ${faceTrait}`);
      
      // Load and draw base template
      const baseImg = await loadImage(templateSrc);
      ctx.drawImage(baseImg, 0, 0, 1000, 1000);

      // Check if we have a matching face trait overlay (apply before head so it's behind)
      if (faceTrait && FACE_TRAIT_MAP[faceTrait]) {
        console.log(`Applying face trait: ${faceTrait}`);
        const faceOverlay = await loadImage(FACE_TRAIT_MAP[faceTrait]);
        ctx.drawImage(faceOverlay, 0, 0, 1000, 1000);
      } else if (faceTrait) {
        console.log(`No overlay found for face trait: ${faceTrait}`);
      }

      // Check if we have a matching head trait overlay
      if (headTrait && HEAD_TRAIT_MAP[headTrait]) {
        console.log(`Applying head trait: ${headTrait}`);
        const headOverlay = await loadImage(HEAD_TRAIT_MAP[headTrait]);
        ctx.drawImage(headOverlay, 0, 0, 1000, 1000);
      } else if (headTrait) {
        console.log(`No overlay found for head trait: ${headTrait}`);
      }

      const dataUrl = canvas.toDataURL('image/png');
      setRetsbafiedImage(dataUrl);
      setStep('complete');
      toast.success('Your Pudgy has been Retsbafied!');
    } catch (err) {
      console.error('Compositing error:', err);
      setError('Failed to generate Retsbafied image');
      setStep('error');
    }
  };

  const handleDownload = () => {
    if (!retsbafiedImage) return;
    
    const link = document.createElement('a');
    link.download = 'retsbafied-pudgy.png';
    link.href = retsbafiedImage;
    link.click();
  };

  const handleReset = () => {
    setUploadedImage(null);
    setDetectedTraits(null);
    setRetsbafiedImage(null);
    setStep('idle');
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getStepMessage = () => {
    switch (step) {
      case 'uploading': return 'Uploading your Pudgy...';
      case 'analyzing': return 'AI is detecting traits...';
      case 'compositing': return 'Creating your Retsbafied image...';
      case 'complete': return 'Your Pudgy has been Retsbafied!';
      case 'error': return error || 'Something went wrong';
      default: return '';
    }
  };

  // Format trait name for display
  const formatTraitName = (trait: string | null) => {
    if (!trait) return null;
    return trait.replace(/_/g, ' ');
  };

  return (
    <div className="w-full">
      <canvas ref={canvasRef} className="hidden" />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Side - Upload & Original */}
        <div className="space-y-4">
          <div className="text-center lg:text-left">
            <h2 className="text-xl font-semibold text-black mb-1">Your Pudgy</h2>
            <p className="text-black/60 text-sm">Upload your Pudgy Penguin or Lil Pudgy NFT</p>
          </div>

          <motion.div
            className={`relative border-2 border-dashed rounded-xl p-6 transition-all duration-300 cursor-pointer min-h-[320px] flex items-center justify-center ${
              isDragging 
                ? 'border-primary bg-primary/10' 
                : 'border-black/20 hover:border-black/40 bg-black/5'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />

            <AnimatePresence mode="wait">
              {uploadedImage ? (
                <motion.div
                  key="preview"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="relative w-full"
                >
                  <img
                    src={uploadedImage}
                    alt="Uploaded Pudgy"
                    className="w-full h-auto rounded-lg max-h-[320px] object-contain mx-auto"
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReset();
                    }}
                    className="absolute top-2 right-2 p-2 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key="upload"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center"
                >
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-black/10 flex items-center justify-center">
                    <Upload className="w-8 h-8 text-black/40" />
                  </div>
                  <p className="text-black font-medium mb-2">Drop your Pudgy here</p>
                  <p className="text-black/40 text-sm">or click to browse</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Detected Traits */}
          <AnimatePresence>
            {detectedTraits && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-black/5 border border-black/10 rounded-xl p-4"
              >
                <div className="flex items-center gap-2 mb-3">
                  <Check className="w-4 h-4 text-green-600" />
                  <h3 className="font-semibold text-black text-sm">Detected Traits</h3>
                  <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${
                    detectedTraits.confidence === 'high' 
                      ? 'bg-green-500/20 text-green-600' 
                      : detectedTraits.confidence === 'medium'
                      ? 'bg-yellow-500/20 text-yellow-600'
                      : 'bg-red-500/20 text-red-600'
                  }`}>
                    {detectedTraits.confidence} confidence
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(detectedTraits.traits).map(([key, value]) => (
                    value && (
                      <div key={key} className={`bg-white rounded-lg p-2 border ${
                        (key === 'head' && HEAD_TRAIT_MAP[value]) || (key === 'face' && FACE_TRAIT_MAP[value])
                          ? 'border-green-500/50 bg-green-50' 
                          : 'border-black/10'
                      }`}>
                        <p className="text-black/40 text-xs uppercase tracking-wide">{key}</p>
                        <p className="text-black text-sm">{formatTraitName(value)}</p>
                        {key === 'head' && HEAD_TRAIT_MAP[value] && (
                          <p className="text-green-600 text-xs mt-0.5">✓ Overlay applied</p>
                        )}
                        {key === 'face' && FACE_TRAIT_MAP[value] && (
                          <p className="text-green-600 text-xs mt-0.5">✓ Overlay applied</p>
                        )}
                      </div>
                    )
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Side - Retsbafied Result */}
        <div className="space-y-4">
          <div className="text-center lg:text-left">
            <h2 className="text-xl font-semibold text-black mb-1">Retsbafied</h2>
            <p className="text-black/60 text-sm">Your Pudgy, transformed into a Retsba</p>
          </div>

          <div className="relative border-2 border-black/10 rounded-xl p-6 bg-gradient-to-br from-primary/5 to-transparent min-h-[320px] flex items-center justify-center">
            <AnimatePresence mode="wait">
              {step === 'idle' && (
                <motion.div
                  key="waiting"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="w-full"
                >
                  <img
                    src={Template}
                    alt="Retsba Base Template"
                    className="w-full h-auto rounded-lg max-h-[320px] object-contain mx-auto"
                  />
                </motion.div>
              )}

              {(step === 'uploading' || step === 'analyzing' || step === 'compositing') && (
                <motion.div
                  key="processing"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center"
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    className="w-12 h-12 mx-auto mb-4"
                  >
                    <RefreshCw className="w-12 h-12 text-primary" />
                  </motion.div>
                  <p className="text-black font-medium">{getStepMessage()}</p>
                </motion.div>
              )}

              {step === 'error' && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="text-center"
                >
                  <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
                  <p className="text-red-500 font-medium text-sm">{error}</p>
                  <Button
                    onClick={handleReset}
                    variant="outline"
                    className="mt-4 border-black/20 text-black hover:bg-black/5"
                  >
                    Try Again
                  </Button>
                </motion.div>
              )}

              {step === 'complete' && retsbafiedImage && (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="w-full"
                >
                  <img
                    src={retsbafiedImage}
                    alt="Retsbafied Pudgy"
                    className="w-full h-auto rounded-lg max-h-[320px] object-contain mx-auto"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={handleDownload}
              disabled={step !== 'complete'}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white"
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
            <Button
              onClick={handleReset}
              variant="outline"
              className="flex-1 border-black/20 text-black hover:bg-black/5"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Start Over
            </Button>
          </div>

          {/* Info Notice */}
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
            <p className="text-black/70 text-sm">
              <span className="text-primary font-semibold">Testing Mode:</span> Currently detecting and applying head traits only. 
              More trait categories coming soon!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PFPConverter;
