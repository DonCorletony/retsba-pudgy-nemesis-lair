import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogOverlay } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, RefreshCw } from "lucide-react";
import { MemeDepotService } from "@/services/memeDepotService";

interface MemeData {
  id: string;
  imageUrl: string;
  title?: string;
  uploadDate?: string;
}

const Memes = () => {
  console.log("MEMES COMPONENT IS RENDERING!");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [memes, setMemes] = useState<MemeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadMemes = async () => {
    try {
      setLoading(true);
      const memesData = await MemeDepotService.fetchMemes();
      setMemes(memesData);
    } catch (error) {
      console.error('Failed to load memes:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshMemes = async () => {
    try {
      setRefreshing(true);
      const memesData = await MemeDepotService.refreshMemes();
      setMemes(memesData);
    } catch (error) {
      console.error('Failed to refresh memes:', error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadMemes();
  }, []);

  return (
    <div className="min-h-screen bg-retsba">
      <div className="container mx-auto px-4 pt-24 pb-8">
        {/* Page Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-4 mb-2">
            <h1 className="text-6xl font-bold text-white">MEMES</h1>
            <button
              onClick={refreshMemes}
              disabled={refreshing}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all duration-200 disabled:opacity-50"
              title="Refresh memes"
            >
              <RefreshCw className={`w-6 h-6 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <p className="text-sm text-white/70">powered by memedepot.com</p>
        </div>

        {/* Memes Gallery Container */}
        <div className="w-full max-w-7xl mx-auto">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 h-[70vh] p-6">
            <ScrollArea className="h-full">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-white/70">Loading memes...</div>
                </div>
              ) : memes.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-white/70">No memes found. Check your connection or try refreshing.</div>
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-4">
                  {memes.map((meme, index) => (
                    <div
                      key={meme.id}
                      className="aspect-square bg-white/5 rounded-lg overflow-hidden cursor-pointer hover:bg-white/10 transition-all duration-200 border border-white/10"
                      onClick={() => setSelectedImage(meme.imageUrl)}
                    >
                      <img
                        src={meme.imageUrl}
                        alt={meme.title || `Meme ${index + 1}`}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                        onError={(e) => {
                          // Fallback to a placeholder if image fails to load
                          e.currentTarget.src = `https://images.unsplash.com/photo-1588681664899-f142ff2dc9b1?w=400&h=300&fit=crop&text=RETSBA+${index + 1}`;
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}
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