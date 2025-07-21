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
      
      // Try direct fetch first
      let response;
      try {
        response = await fetch(this.RETSBA_URL);
      } catch (error) {
        console.log('Direct fetch failed, trying with CORS proxy...');
        response = await fetch(`${this.CORS_PROXY}${encodeURIComponent(this.RETSBA_URL)}`);
      }
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const html = await response.text();
      console.log('HTML fetched, parsing for images...');
      
      return this.parseMemesFromHTML(html);
    } catch (error) {
      console.error('Error fetching memes:', error);
      return this.getFallbackMemes();
    }
  }

  private static parseMemesFromHTML(html: string): MemeData[] {
    const memes: MemeData[] = [];
    
    // Parse for memedepot image URLs
    const imageRegex = /https:\/\/memedepot\.com\/cdn-cgi\/imagedelivery\/[^"'\s]+/g;
    const matches = html.match(imageRegex);
    
    if (matches) {
      matches.forEach((url, index) => {
        // Clean up the URL and get higher quality version
        let cleanUrl = url;
        
        // Replace small dimensions with larger ones
        if (cleanUrl.includes('width=200') || cleanUrl.includes('height=90')) {
          cleanUrl = cleanUrl.replace(/width=\d+,height=\d+/, 'width=800,height=600');
        }
        
        memes.push({
          id: `meme-${index}`,
          imageUrl: cleanUrl,
          title: `RETSBA Meme ${index + 1}`,
          uploadDate: new Date().toISOString()
        });
      });
    }
    
    // Also look for other image patterns
    const altImageRegex = /"(https:\/\/[^"]*\.(?:jpg|jpeg|png|gif|webp)[^"]*)"/gi;
    const altMatches = html.match(altImageRegex);
    
    if (altMatches) {
      altMatches.forEach((match, index) => {
        const url = match.replace(/"/g, '');
        if (url.includes('memedepot.com') && !memes.some(m => m.imageUrl === url)) {
          memes.push({
            id: `alt-meme-${index}`,
            imageUrl: url,
            title: `RETSBA Meme Alt ${index + 1}`,
            uploadDate: new Date().toISOString()
          });
        }
      });
    }
    
    console.log(`Parsed ${memes.length} memes from HTML`);
    return memes;
  }

  private static getFallbackMemes(): MemeData[] {
    console.log('Using fallback memes...');
    return [
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
      // Add more fallback memes as needed
    ];
  }

  static async refreshMemes(): Promise<MemeData[]> {
    return this.fetchMemes();
  }
}