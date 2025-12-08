import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Download, RefreshCw, AlertCircle, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import Template from '@/assets/pfp-templates/Template.png';
import Template_2 from '@/assets/pfp-templates/Template_2.png';
import Backwards_Template from '@/assets/pfp-templates/Backwards_Template.png';
import Gold_Template from '@/assets/pfp-templates/Gold_Template.png';
import Gold_Template_2 from '@/assets/pfp-templates/Gold_Template_2.png';
import Ice_Template from '@/assets/pfp-templates/Ice_Template.png';
import Ice_Template_2 from '@/assets/pfp-templates/Ice_Template_2.png';
import Lil_Template from '@/assets/pfp-templates/Lil_Template.png';
// Head traits that require Template_2 instead of the default Template
const TEMPLATE_2_HEAD_TRAITS = [
  'Headband',
  'Backwards_Hat_Red',
  'Backwards_Hat_Blue',
  'Hat_Red',
  'Hat_Blue',
  'Jester_Hat',
  'Sideways_Blue',
  'Sideways_Red',
  'Blue_Durag',
  'Red_Durag',
  'Ninja_Headband',
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

// Import all body trait overlays
import Lei_Blue from '@/assets/pfp-traits/body/Lei_Blue.png';
import Lei_Purple from '@/assets/pfp-traits/body/Lei_Purple.png';
import Lei_Pink from '@/assets/pfp-traits/body/Lei_Pink.png';
import Hoodie_Black from '@/assets/pfp-traits/body/Hoodie_Black.png';
import Hoodie_Pink from '@/assets/pfp-traits/body/Hoodie_Pink.png';
import Puffer_Orange from '@/assets/pfp-traits/body/Puffer_Orange.png';
import Puffer_Blue from '@/assets/pfp-traits/body/Puffer_Blue.png';
import Puffer_Green from '@/assets/pfp-traits/body/Puffer_Green.png';
import Bow_Tie_Blue from '@/assets/pfp-traits/body/Bow_Tie_Blue.png';
import Bowtie_Black from '@/assets/pfp-traits/body/Bowtie_Black.png';
import Bowtie_Pink from '@/assets/pfp-traits/body/Bowtie_Pink.png';
import Turtleneck_Pink from '@/assets/pfp-traits/body/Turtleneck_Pink.png';
import Turtleneck_Green from '@/assets/pfp-traits/body/Turtleneck_Green.png';
import Kimono_Brown from '@/assets/pfp-traits/body/Kimono_Brown.png';
import Kimono_Red from '@/assets/pfp-traits/body/Kimono_Red.png';
import Kimono_White from '@/assets/pfp-traits/body/Kimono_White.png';
import Kimono_Orange from '@/assets/pfp-traits/body/Kimono_Orange.png';
import Kimono_Blue from '@/assets/pfp-traits/body/Kimono_Blue.png';
import Kimono_Abstract from '@/assets/pfp-traits/body/Kimono_Abstract.png';
import Blue_Shirt from '@/assets/pfp-traits/body/Blue_Shirt.png';
import Hawaiian_Shirt from '@/assets/pfp-traits/body/Hawaiian_Shirt.png';
import Bronze_Medal from '@/assets/pfp-traits/body/Bronze_Medal.png';
import Silver_Medal from '@/assets/pfp-traits/body/Silver_Medal.png';
import Gold_Medal from '@/assets/pfp-traits/body/Gold_Medal.png';
import Scarf_Pink from '@/assets/pfp-traits/body/Scarf_Pink.png';
import Overalls from '@/assets/pfp-traits/body/Overalls.png';
import Poncho from '@/assets/pfp-traits/body/Poncho.png';
import Surfboard_Necklace from '@/assets/pfp-traits/body/Surfboard_Necklace.png';
import Christmas_Lights from '@/assets/pfp-traits/body/Christmas_Lights.png';
import Ice_Coat from '@/assets/pfp-traits/body/Ice_Coat.png';
import Tribal_Necklace from '@/assets/pfp-traits/body/Tribal_Necklace.png';
import Heart from '@/assets/pfp-traits/body/Heart.png';
import Crop_Top from '@/assets/pfp-traits/body/Crop_Top.png';
import Biker_Jacket from '@/assets/pfp-traits/body/Biker_Jacket.png';
import Swordman from '@/assets/pfp-traits/body/Swordman.png';
import Kimono_Pink from '@/assets/pfp-traits/body/Kimono_Pink.png';
import Kimono_Gold from '@/assets/pfp-traits/body/Kimono_Gold.png';
import Kimono_Ice from '@/assets/pfp-traits/body/Kimono_Ice.png';
import Suit_Blue from '@/assets/pfp-traits/body/Suit_Blue.png';
import Suit_Red from '@/assets/pfp-traits/body/Suit_Red.png';
import Pudgy_Man from '@/assets/pfp-traits/body/Pudgy_Man.png';
import Lei_Assorted from '@/assets/pfp-traits/body/Lei_Assorted.png';
import I_Love_Fish from '@/assets/pfp-traits/body/I_Love_Fish.png';
import Big_P from '@/assets/pfp-traits/body/Big_P.png';
import Shark_Tooth from '@/assets/pfp-traits/body/Shark_Tooth.png';
import Christmas_Sweater_Red from '@/assets/pfp-traits/body/Christmas_Sweater_Red.png';
import Christmas_Sweater_Blue from '@/assets/pfp-traits/body/Christmas_Sweater_Blue.png';
import The_Huddle from '@/assets/pfp-traits/body/The_Huddle.png';
import Tanktop_Yellow from '@/assets/pfp-traits/body/Tanktop_Yellow.png';
import Tanktop_Blue from '@/assets/pfp-traits/body/Tanktop_Blue.png';
import Vote_4_Pudgy from '@/assets/pfp-traits/body/Vote_4_Pudgy.png';
import Turtleneck_Gray from '@/assets/pfp-traits/body/Turtleneck_Gray.png';
import Turtleneck_Blue from '@/assets/pfp-traits/body/Turtleneck_Blue.png';
import Labcoat from '@/assets/pfp-traits/body/Labcoat.png';
import Apron from '@/assets/pfp-traits/body/Apron.png';
import Scarf_Blue from '@/assets/pfp-traits/body/Scarf_Blue.png';
import Scarf_Green from '@/assets/pfp-traits/body/Scarf_Green.png';
import Shirt_Red from '@/assets/pfp-traits/body/Shirt_Red.png';
import Bathrobe from '@/assets/pfp-traits/body/Bathrobe.png';

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

// Mapping of body trait names to imported images
const BODY_TRAIT_MAP: Record<string, string> = {
  Lei_Blue,
  Lei_Purple,
  Lei_Pink,
  Hoodie_Black,
  Hoodie_Pink,
  Puffer_Orange,
  Puffer_Blue,
  Puffer_Green,
  Bow_Tie_Blue,
  Bowtie_Black,
  Bowtie_Pink,
  Turtleneck_Pink,
  Turtleneck_Green,
  Kimono_Brown,
  Kimono_Red,
  Kimono_White,
  Kimono_Orange,
  Kimono_Blue,
  Kimono_Abstract,
  Blue_Shirt,
  Hawaiian_Shirt,
  Bronze_Medal,
  Silver_Medal,
  Gold_Medal,
  Scarf_Pink,
  Overalls,
  Poncho,
  Surfboard_Necklace,
  Christmas_Lights,
  Ice_Coat,
  Tribal_Necklace,
  Heart,
  Crop_Top,
  Biker_Jacket,
  Swordman,
  Kimono_Pink,
  Kimono_Gold,
  Kimono_Ice,
  Suit_Blue,
  Suit_Red,
  Pudgy_Man,
  Lei_Assorted,
  I_Love_Fish,
  Big_P,
  Shark_Tooth,
  Christmas_Sweater_Red,
  Christmas_Sweater_Blue,
  The_Huddle,
  Tanktop_Yellow,
  Tanktop_Blue,
  Vote_4_Pudgy,
  Turtleneck_Gray,
  Turtleneck_Blue,
  Labcoat,
  Apron,
  Scarf_Blue,
  Scarf_Green,
  Shirt_Red,
  Bathrobe,
};

interface DetectedTraits {
  isPudgy: boolean;
  isSpecialPenguin?: 'left_facing' | 'gold_kimono_special' | null;
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
  const [isLilMode, setIsLilMode] = useState(false);
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
      // Check for special penguins first - these use unique templates with NO trait overlays
      if (traits.isSpecialPenguin === 'left_facing') {
        console.log('Special penguin detected: Left-Facing. Using Backwards_Template with no overlays.');
        const baseImg = await loadImage(Backwards_Template);
        ctx.drawImage(baseImg, 0, 0, 1000, 1000);
        const dataUrl = canvas.toDataURL('image/png');
        setRetsbafiedImage(dataUrl);
        setStep('complete');
        toast.success('Special Left-Facing Penguin detected! Retsbafied with Backwards Template.');
        return;
      }
      
      // Gold Kimono Special penguin - uses Gold_Template_2 with Kimono_Gold overlay
      if (traits.isSpecialPenguin === 'gold_kimono_special') {
        console.log('Special penguin detected: Gold Kimono Special. Using Gold_Template_2 with Kimono_Gold and Backwards_Hat_Red overlays.');
        // Use Gold_Template_2 as base (for backwards hat compatibility)
        const baseImg = await loadImage(Gold_Template_2);
        ctx.drawImage(baseImg, 0, 0, 1000, 1000);
        
        // Apply Kimono_Gold body overlay
        if (BODY_TRAIT_MAP['Kimono_Gold']) {
          const bodyOverlay = await loadImage(BODY_TRAIT_MAP['Kimono_Gold']);
          ctx.drawImage(bodyOverlay, 0, 0, 1000, 1000);
        }
        
        // Apply Backwards_Hat_Red head overlay
        if (HEAD_TRAIT_MAP['Backwards_Hat_Red']) {
          const headOverlay = await loadImage(HEAD_TRAIT_MAP['Backwards_Hat_Red']);
          ctx.drawImage(headOverlay, 0, 0, 1000, 1000);
        }
        
        const dataUrl = canvas.toDataURL('image/png');
        setRetsbafiedImage(dataUrl);
        setStep('complete');
        toast.success('Special Gold Kimono Penguin detected! Retsbafied with Gold Template.');
        return;
      }
      
      // Determine which template to use based on skin, head, or face trait
      const headTrait = traits.traits.head;
      const faceTrait = traits.traits.face;
      const bodyTrait = traits.traits.body;
      const skinTrait = traits.traits.skin?.toLowerCase() || '';
      
      // Check for special skin types
      const isGoldSkin = skinTrait.includes('gold') || skinTrait.includes('golden');
      const isIceSkin = skinTrait.includes('ice');
      
      // Check if Template_2 traits are present
      const hasTemplate2Trait = (headTrait && TEMPLATE_2_HEAD_TRAITS.includes(headTrait)) || 
                                (faceTrait && TEMPLATE_2_FACE_TRAITS.includes(faceTrait));
      
      let templateSrc = Template;
      let templateName = 'Template';
      
      if (isIceSkin && hasTemplate2Trait) {
        // Ice skin + Template_2 trait = Ice_Template_2
        templateSrc = Ice_Template_2;
        templateName = 'Ice_Template_2';
      } else if (isIceSkin) {
        // Ice skin only = Ice_Template
        templateSrc = Ice_Template;
        templateName = 'Ice_Template';
      } else if (isGoldSkin && hasTemplate2Trait) {
        // Gold skin + Template_2 trait = Gold_Template_2
        templateSrc = Gold_Template_2;
        templateName = 'Gold_Template_2';
      } else if (isGoldSkin) {
        // Gold skin only = Gold_Template
        templateSrc = Gold_Template;
        templateName = 'Gold_Template';
      } else if (hasTemplate2Trait) {
        // Template_2 trait only = Template_2
        templateSrc = Template_2;
        templateName = 'Template_2';
      }
      
      console.log(`Using template: ${templateName} for skin: ${skinTrait}, head: ${headTrait}, face: ${faceTrait}, body: ${bodyTrait}`);
      
      // Load and draw base template
      const baseImg = await loadImage(templateSrc);
      ctx.drawImage(baseImg, 0, 0, 1000, 1000);

      // LAYERING ORDER: body (bottom) → face → head (top)
      
      // 1. Apply body trait overlay first (bottom layer)
      if (bodyTrait && BODY_TRAIT_MAP[bodyTrait]) {
        console.log(`Applying body trait: ${bodyTrait}`);
        const bodyOverlay = await loadImage(BODY_TRAIT_MAP[bodyTrait]);
        ctx.drawImage(bodyOverlay, 0, 0, 1000, 1000);
      } else if (bodyTrait) {
        console.log(`No overlay found for body trait: ${bodyTrait}`);
      }

      // 2. Apply face trait overlay (middle layer)
      if (faceTrait && FACE_TRAIT_MAP[faceTrait]) {
        console.log(`Applying face trait: ${faceTrait}`);
        const faceOverlay = await loadImage(FACE_TRAIT_MAP[faceTrait]);
        ctx.drawImage(faceOverlay, 0, 0, 1000, 1000);
      } else if (faceTrait) {
        console.log(`No overlay found for face trait: ${faceTrait}`);
      }

      // 3. Apply head trait overlay last (top layer)
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
      case 'analyzing': return 'Assimilating...';
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

  // Determine if we should show the result view on mobile (after upload started)
  const showMobileResult = step !== 'idle' && uploadedImage;

  return (
    <div className="w-full">
      <canvas ref={canvasRef} className="hidden" />
      
      {/* Mobile Layout - Single unified window */}
      <div className="lg:hidden space-y-4">
        {/* Mobile Toggle */}
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-black dark:text-white">
            {showMobileResult ? 'Retsbafied' : isLilMode ? 'Your Lil' : 'Your Pudgy'}
          </h2>
          <div className="flex items-center gap-2 bg-black/5 dark:bg-white/5 rounded-full px-3 py-1.5">
            <span className={`text-xs font-medium transition-colors ${!isLilMode ? 'text-black dark:text-white' : 'text-black/40 dark:text-white/40'}`}>
              Big
            </span>
            <Switch
              checked={isLilMode}
              onCheckedChange={setIsLilMode}
              className="data-[state=checked]:bg-primary scale-90"
            />
            <span className={`text-xs font-medium transition-colors ${isLilMode ? 'text-black dark:text-white' : 'text-black/40 dark:text-white/40'}`}>
              Lil
            </span>
          </div>
        </div>
        <p className="text-black/60 dark:text-white/60 text-sm -mt-2">
          {showMobileResult ? 'Your Retsba' : isLilMode ? 'Upload your Lil Pudgy NFT' : 'Upload your Pudgy Penguin NFT'}
        </p>

        <div 
          className={`relative border-2 rounded-xl p-6 transition-all duration-300 min-h-[320px] flex items-center justify-center ${
            showMobileResult 
              ? 'border-black/10 dark:border-white/20 bg-gradient-to-br from-primary/5 to-transparent'
              : isDragging 
                ? 'border-primary bg-primary/10 border-dashed cursor-pointer' 
                : 'border-black/20 dark:border-white/20 hover:border-black/40 dark:hover:border-white/40 bg-black/5 dark:bg-white/5 border-dashed cursor-pointer'
          }`}
          onDragOver={!showMobileResult ? handleDragOver : undefined}
          onDragLeave={!showMobileResult ? handleDragLeave : undefined}
          onDrop={!showMobileResult ? handleDrop : undefined}
          onClick={!showMobileResult ? () => fileInputRef.current?.click() : undefined}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          <AnimatePresence mode="wait">
            {/* Upload state - no image yet */}
            {step === 'idle' && !uploadedImage && (
              <motion.div
                key="mobile-upload"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center"
              >
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-black/10 dark:bg-white/10 flex items-center justify-center">
                  <Upload className="w-8 h-8 text-black/40 dark:text-white/40" />
                </div>
                <p className="text-black dark:text-white font-medium mb-2">Drop your {isLilMode ? 'Lil' : 'Pudgy'} here</p>
                <p className="text-black/40 dark:text-white/40 text-sm">or click to browse</p>
              </motion.div>
            )}

            {/* Processing state */}
            {(step === 'uploading' || step === 'analyzing' || step === 'compositing') && (
              <motion.div
                key="mobile-processing"
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
                <p className="text-black dark:text-white font-medium">{getStepMessage()}</p>
              </motion.div>
            )}

            {/* Error state */}
            {step === 'error' && (
              <motion.div
                key="mobile-error"
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
                  className="mt-4 border-black/20 dark:border-white/20 text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/10"
                >
                  Try Again
                </Button>
              </motion.div>
            )}

            {/* Complete state - show result */}
            {step === 'complete' && retsbafiedImage && (
              <motion.div
                key="mobile-result"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="relative w-full"
              >
                <img
                  src={retsbafiedImage}
                  alt="Retsbafied Pudgy"
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
            )}
          </AnimatePresence>
        </div>

        {/* Mobile Download Button */}
        <Button
          onClick={handleDownload}
          disabled={step !== 'complete'}
          className="w-full bg-red-500 hover:bg-red-600 text-white"
        >
          <Download className="w-4 h-4 mr-2" />
          Download
        </Button>
      </div>

      {/* Desktop Layout - Two columns side by side */}
      <div className="hidden lg:block">
        {/* Headers row with toggle in center */}
        <div className="grid grid-cols-2 gap-6 mb-4">
          <div className="text-left">
            <h2 className="text-xl font-semibold text-black dark:text-white mb-1">{isLilMode ? 'Your Lil' : 'Your Pudgy'}</h2>
            <p className="text-black/60 dark:text-white/60 text-sm">{isLilMode ? 'Upload your Lil Pudgy NFT' : 'Upload your Pudgy Penguin NFT'}</p>
          </div>
          <div className="flex items-start justify-between">
            <div className="text-left">
              <h2 className="text-xl font-semibold text-black dark:text-white mb-1">Retsbafied</h2>
              <p className="text-black/60 dark:text-white/60 text-sm">Your Retsba</p>
            </div>
            <div className="flex items-center gap-3 bg-black/5 dark:bg-white/5 rounded-full px-4 py-2">
              <span className={`text-sm font-medium transition-colors ${!isLilMode ? 'text-black dark:text-white' : 'text-black/40 dark:text-white/40'}`}>
                Big
              </span>
              <Switch
                checked={isLilMode}
                onCheckedChange={setIsLilMode}
                className="data-[state=checked]:bg-primary"
              />
              <span className={`text-sm font-medium transition-colors ${isLilMode ? 'text-black dark:text-white' : 'text-black/40 dark:text-white/40'}`}>
                Lil
              </span>
            </div>
          </div>
        </div>

        {/* Content grid */}
        <div className="grid grid-cols-2 gap-6">
        {/* Left Side - Upload & Original */}
        <div className="space-y-4">

          <motion.div
            className={`relative border-2 border-dashed rounded-xl p-6 transition-all duration-300 cursor-pointer min-h-[320px] flex items-center justify-center ${
              isDragging 
                ? 'border-primary bg-primary/10' 
                : 'border-black/20 dark:border-white/20 hover:border-black/40 dark:hover:border-white/40 bg-black/5 dark:bg-white/5'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            <input
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
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-black/10 dark:bg-white/10 flex items-center justify-center">
                    <Upload className="w-8 h-8 text-black/40 dark:text-white/40" />
                  </div>
                  <p className="text-black dark:text-white font-medium mb-2">Drop your {isLilMode ? 'Lil' : 'Pudgy'} here</p>
                  <p className="text-black/40 dark:text-white/40 text-sm">or click to browse</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Detected Traits - Desktop only */}
          <AnimatePresence>
            {detectedTraits && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl p-4"
              >
                <div className="flex items-center gap-2 mb-3">
                  <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                  <h3 className="font-semibold text-black dark:text-white text-sm">Detected Traits</h3>
                  <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${
                    detectedTraits.confidence === 'high' 
                      ? 'bg-green-500/20 text-green-600 dark:text-green-400' 
                      : detectedTraits.confidence === 'medium'
                      ? 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400'
                      : 'bg-red-500/20 text-red-600 dark:text-red-400'
                  }`}>
                    {detectedTraits.confidence} confidence
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(detectedTraits.traits).map(([key, value]) => (
                    value && (
                      <div key={key} className={`bg-white dark:bg-retsba rounded-lg p-2 border ${
                        (key === 'head' && HEAD_TRAIT_MAP[value]) || (key === 'face' && FACE_TRAIT_MAP[value])
                          ? 'border-green-500/50 bg-green-50 dark:bg-green-500/10' 
                          : 'border-black/10 dark:border-white/10'
                      }`}>
                        <p className="text-black/40 dark:text-white/40 text-xs uppercase tracking-wide">{key}</p>
                        <p className="text-black dark:text-white text-sm">{formatTraitName(value)}</p>
                        {key === 'head' && HEAD_TRAIT_MAP[value] && (
                          <p className="text-green-600 dark:text-green-400 text-xs mt-0.5">✓ Overlay applied</p>
                        )}
                        {key === 'face' && FACE_TRAIT_MAP[value] && (
                          <p className="text-green-600 dark:text-green-400 text-xs mt-0.5">✓ Overlay applied</p>
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

          <div className="relative border-2 border-black/10 dark:border-white/20 rounded-xl p-6 bg-gradient-to-br from-primary/5 to-transparent min-h-[320px] flex items-center justify-center">
            <AnimatePresence mode="wait">
              {step === 'idle' && (
                <motion.div
                  key={`waiting-${isLilMode ? 'lil' : 'big'}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="w-full"
                >
                  <img
                    src={isLilMode ? Lil_Template : Template}
                    alt={isLilMode ? "Lil Retsba Template" : "Retsba Base Template"}
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
                  <p className="text-black dark:text-white font-medium">{getStepMessage()}</p>
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
                    className="mt-4 border-black/20 dark:border-white/20 text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/10"
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

          {/* Action Button */}
          <Button
            onClick={handleDownload}
            disabled={step !== 'complete'}
            className="w-full bg-red-500 hover:bg-red-600 text-white"
          >
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
        </div>
        </div>
      </div>
    </div>
  );
};

export default PFPConverter;
