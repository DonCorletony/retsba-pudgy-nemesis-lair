interface MemeData {
  id: string;
  imageUrl: string;
  title?: string;
  uploadDate?: string;
}

export class MemeDepotService {
  private static readonly CORS_PROXY = 'https://api.allorigins.win/raw?url=';
  private static readonly RETSBA_URL = 'https://memedepot.com/d/retsba';

  static async fetchMemes(): Promise<MemeData[]> {
    try {
      console.log('Fetching memes from memedepot...');
      
      // Since we can't easily scrape the main page, let's try to construct URLs
      // based on known patterns and test a few meme IDs
      const knownMemeIds = ['LBcl1A']; // We know this one works from your example
      
      // Try to fetch additional meme IDs by checking common patterns
      const potentialIds = [
        'LBcl1A', // Known working one
        // Add more as we discover them
      ];
      
      const memes: MemeData[] = [];
      
      for (const memeId of potentialIds) {
        try {
          const memeData = await this.fetchIndividualMeme(memeId);
          if (memeData) {
            memes.push(memeData);
          }
        } catch (error) {
          console.warn(`Failed to fetch meme ${memeId}:`, error);
        }
      }
      
      // If we couldn't get any memes, return fallback
      if (memes.length === 0) {
        return this.getFallbackMemes();
      }
      
      return memes;
    } catch (error) {
      console.error('Error fetching memes:', error);
      return this.getFallbackMemes();
    }
  }

  private static async fetchIndividualMeme(memeId: string): Promise<MemeData | null> {
    try {
      const memeUrl = `https://memedepot.com/d/retsba/${memeId}`;
      console.log(`Fetching individual meme: ${memeUrl}`);
      
      let response;
      try {
        response = await fetch(memeUrl);
      } catch (error) {
        console.log('Direct fetch failed, trying with CORS proxy...');
        response = await fetch(`${this.CORS_PROXY}${encodeURIComponent(memeUrl)}`);
      }
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const html = await response.text();
      
      // Extract the CDN image URL from the HTML
      const imageRegex = /https:\/\/memedepot\.com\/cdn-cgi\/imagedelivery\/[^"'\s]+\/width=\d+,quality=\d+/g;
      const matches = html.match(imageRegex);
      
      if (matches && matches[0]) {
        const imageUrl = matches[0];
        
        // Extract title from the HTML
        const titleMatch = html.match(/<p class="font-medium[^>]*>([^<]+)<\/p>/);
        const title = titleMatch ? titleMatch[1] : `RETSBA Meme ${memeId}`;
        
        return {
          id: memeId,
          imageUrl: imageUrl,
          title: title,
          uploadDate: new Date().toISOString()
        };
      }
      
      return null;
    } catch (error) {
      console.error(`Error fetching individual meme ${memeId}:`, error);
      return null;
    }
  }

  private static getFallbackMemes(): MemeData[] {
    console.log('Using fallback memes...');
    return [
      {
        id: 'example-1',
        imageUrl: 'https://memedepot.com/cdn-cgi/imagedelivery/naCPMwxXX46-hrE49eZovw/f127b9b4-1040-4d4b-baaf-6c4f0d7f2b00/width=640,quality=100',
        title: 'Summoning bad vibes (1).png'
      },
      {
        id: 'fallback-1',
        imageUrl: 'https://images.unsplash.com/photo-1588681664899-f142ff2dc9b1?w=400&h=300&fit=crop',
        title: 'RETSBA Community Meme 1'
      },
      {
        id: 'fallback-2', 
        imageUrl: 'https://images.unsplash.com/photo-1611915387288-fd8d2f5f928b?w=400&h=300&fit=crop',
        title: 'RETSBA Community Meme 2'
      },
      {
        id: 'fallback-3',
        imageUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop',
        title: 'RETSBA Community Meme 3'
      },
    ];
  }

  static async refreshMemes(): Promise<MemeData[]> {
    return this.fetchMemes();
  }
}