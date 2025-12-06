import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Sparkles, Download, RefreshCw, AlertCircle, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import retsbaBase from '@/assets/retsba-base.png';

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

  const generateRetsbafiedImage = async (traits: DetectedTraits) => {
    // For now, we'll create a placeholder composite
    // In the future, this will layer actual Retsba trait assets
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 1000;
    canvas.height = 1000;

    // Load base Retsba image
    const baseImg = new Image();
    baseImg.crossOrigin = 'anonymous';
    
    await new Promise<void>((resolve, reject) => {
      baseImg.onload = () => {
        ctx.drawImage(baseImg, 0, 0, 1000, 1000);
        resolve();
      };
      baseImg.onerror = reject;
      // Using the main Retsba image as base
      baseImg.src = '/lovable-uploads/e836e80c-7019-443e-bdf3-bafb4f35aa92.png';
    });

    // Add trait overlay text (placeholder until actual assets are added)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(20, canvas.height - 180, canvas.width - 40, 160);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px system-ui';
    ctx.fillText('RETSBAFIED', 40, canvas.height - 140);
    
    ctx.font = '16px system-ui';
    ctx.fillStyle = '#aaaaaa';
    let y = canvas.height - 110;
    
    Object.entries(traits.traits).forEach(([key, value]) => {
      if (value) {
        ctx.fillText(`${key}: ${value}`, 40, y);
        y += 25;
      }
    });

    const dataUrl = canvas.toDataURL('image/png');
    setRetsbafiedImage(dataUrl);
    setStep('complete');
    toast.success('Your Pudgy has been Retsbafied!');
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
                      <div key={key} className="bg-white rounded-lg p-2 border border-black/10">
                        <p className="text-black/40 text-xs uppercase tracking-wide">{key}</p>
                        <p className="text-black text-sm">{value}</p>
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
                    src={retsbaBase}
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
              <span className="text-primary font-semibold">Note:</span> Trait overlays are being developed. 
              Currently showing a preview with detected traits. Full trait layering coming soon!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PFPConverter;
