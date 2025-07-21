import NavBar from "@/components/NavBar";
import { useState } from "react";
import { Dialog, DialogContent, DialogOverlay } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X } from "lucide-react";

const Memes = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  // Mock data for now - in real implementation, this would come from memedepot API
  const mockMemes = [
    "https://via.placeholder.com/400x300?text=Meme+1",
    "https://via.placeholder.com/400x300?text=Meme+2", 
    "https://via.placeholder.com/400x300?text=Meme+3",
    "https://via.placeholder.com/400x300?text=Meme+4",
    "https://via.placeholder.com/400x300?text=Meme+5",
    "https://via.placeholder.com/400x300?text=Meme+6",
    "https://via.placeholder.com/400x300?text=Meme+7",
    "https://via.placeholder.com/400x300?text=Meme+8",
    "https://via.placeholder.com/400x300?text=Meme+9",
    "https://via.placeholder.com/400x300?text=Meme+10",
    "https://via.placeholder.com/400x300?text=Meme+11",
    "https://via.placeholder.com/400x300?text=Meme+12",
  ];

  return (
    <div className="min-h-screen bg-retsba">
      <NavBar />
      <div className="container mx-auto px-4 pt-24 pb-8">
        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className="text-6xl font-bold text-white mb-2">MEMES</h1>
          <p className="text-sm text-white/70">powered by memedepot.com</p>
        </div>

        {/* Memes Gallery Container */}
        <div className="w-full max-w-7xl mx-auto">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 h-[70vh] p-6">
            <ScrollArea className="h-full">
              <div className="grid grid-cols-4 gap-4">
                {mockMemes.map((meme, index) => (
                  <div
                    key={index}
                    className="aspect-square bg-white/5 rounded-lg overflow-hidden cursor-pointer hover:bg-white/10 transition-all duration-200 border border-white/10"
                    onClick={() => setSelectedImage(meme)}
                  >
                    <img
                      src={meme}
                      alt={`Meme ${index + 1}`}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                    />
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Full Size Image Modal */}
        <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] p-0 bg-transparent border-0 shadow-none">
            <div className="relative">
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute -top-12 right-0 z-50 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all duration-200"
              >
                <X className="w-6 h-6" />
              </button>
              {selectedImage && (
                <img
                  src={selectedImage}
                  alt="Full size meme"
                  className="w-full h-full object-contain rounded-lg"
                />
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Memes;