interface MemeData {
  id: string;
  imageUrl: string;
  title?: string;
  uploadDate?: string;
}

export class MemeDepotService {
  private static readonly CORS_PROXIES = [
    'https://api.allorigins.win/raw?url=',
    'https://corsproxy.io/?',
    'https://proxy.cors.sh/',
  ];
  private static readonly RETSBA_URL = 'https://memedepot.com/d/retsba';
  private static readonly RETSBA_FILTERED_URL = 'https://memedepot.com/d/retsba?types=COPYPASTA&types=IMAGE';

  static async fetchMemes(): Promise<MemeData[]> {
    try {
      console.log('Fetching memes from memedepot...');
      
      // First, try to get the main depot page to extract meme IDs
      const memeIds = await this.extractMemeIds();
      console.log('Found meme IDs:', memeIds);
      
      const memes: MemeData[] = [];
      
      // Fetch each individual meme
      for (const memeId of memeIds) {
        try {
          const memeData = await this.fetchIndividualMeme(memeId);
          if (memeData) {
            memes.push(memeData);
            console.log(`Successfully fetched meme ${memeId}`);
          }
        } catch (error) {
          console.warn(`Failed to fetch meme ${memeId}:`, error);
        }
      }
      
      console.log(`Final memes count: ${memes.length}`);
      
      // If we couldn't fetch any memes, return the known working ones
      if (memes.length === 0) {
        console.log('No memes fetched successfully, falling back to known memes');
        return this.getKnownMemes();
      }
      
      return memes;
    } catch (error) {
      console.error('Error fetching memes:', error);
      // Return just the one we know works as fallback
      return this.getKnownMemes();
    }
  }

  private static async extractMemeIds(): Promise<string[]> {
    const knownIds = ['LBcl1A']; // Start with the one we know works
    
    // Try both URLs to extract real meme IDs
    const urlsToTry = [this.RETSBA_FILTERED_URL, this.RETSBA_URL];
    
    for (const url of urlsToTry) {
      console.log(`Trying to extract meme IDs from: ${url}`);
      
      for (const proxy of this.CORS_PROXIES) {
        try {
          console.log(`Trying to fetch depot page with proxy: ${proxy}`);
          const response = await fetch(`${proxy}${encodeURIComponent(url)}`);
          
          if (response.ok) {
            const html = await response.text();
            console.log(`Successfully fetched depot page (${html.length} chars), analyzing structure...`);
            
            // Look for Next.js data or any JSON containing meme data
            const foundIds = new Set(knownIds);
            
            // Try to extract from script tags containing __NEXT_DATA__ or similar
            const scriptMatches = html.match(/<script[^>]*>(.*?)<\/script>/gs);
            if (scriptMatches) {
              console.log(`Found ${scriptMatches.length} script tags, searching for meme data...`);
              
              for (const scriptContent of scriptMatches) {
                // Look for 6-character alphanumeric strings that could be meme IDs
                const idMatches = scriptContent.match(/["']([A-Za-z0-9]{6})["']/g);
                if (idMatches) {
                  for (const match of idMatches) {
                    const id = match.replace(/["']/g, '');
                    // Filter out common non-meme strings
                    if (!id.match(/(width|height|quality|border|margin|padding|center|ffffff|000000)/i)) {
                      foundIds.add(id);
                      console.log(`Extracted potential meme ID: ${id}`);
                    }
                  }
                }
              }
            }
            
            // Also try direct pattern matching for meme URLs
            const urlPattern = /memedepot\.com\/d\/retsba\/([A-Za-z0-9]{6})/g;
            const urlMatches = html.matchAll(urlPattern);
            for (const match of urlMatches) {
              foundIds.add(match[1]);
              console.log(`Found meme ID from URL: ${match[1]}`);
            }
            
            if (foundIds.size > 1) {
              const idArray = Array.from(foundIds);
              console.log(`Extracted ${idArray.length} meme IDs total:`, idArray);
              return idArray;
            }
          }
        } catch (error) {
          console.log(`Proxy ${proxy} failed for ${url}:`, error);
          continue;
        }
      }
    }
    
    console.log('Could not extract meme IDs from page, using known working ID only');
    return knownIds;
  }

  private static async fetchIndividualMeme(memeId: string): Promise<MemeData | null> {
    try {
      const memeUrl = `https://memedepot.com/d/retsba/${memeId}`;
      console.log(`Fetching individual meme: ${memeUrl}`);
      
      // Try multiple proxies for individual meme pages
      for (const proxy of this.CORS_PROXIES) {
        try {
          console.log(`Trying proxy ${proxy} for meme ${memeId}`);
          const response = await fetch(`${proxy}${encodeURIComponent(memeUrl)}`);
          
          if (response.ok) {
            const html = await response.text();
            console.log(`Successfully fetched meme ${memeId}, HTML length: ${html.length}`);
            
            // Extract the CDN image URL from the HTML
            const imageRegex = /https:\/\/memedepot\.com\/cdn-cgi\/imagedelivery\/[^"'\s]+\/width=\d+,quality=\d+/g;
            const matches = html.match(imageRegex);
            
            console.log(`Image regex matches for ${memeId}:`, matches);
            
            if (matches && matches[0]) {
              const imageUrl = matches[0];
              
              // Extract title from the HTML
              const titleMatch = html.match(/<p class="font-medium[^>]*>([^<]+)<\/p>/);
              const title = titleMatch ? titleMatch[1] : `RETSBA Meme ${memeId}`;
              
              console.log(`Created meme data for ${memeId}:`, { id: memeId, imageUrl, title });
              
              return {
                id: memeId,
                imageUrl: imageUrl,
                title: title,
                uploadDate: new Date().toISOString()
              };
            } else {
              console.warn(`No image URL found in HTML for meme ${memeId}`);
            }
            break; // If we got a response, don't try other proxies
          } else {
            console.warn(`Response not ok for meme ${memeId} with proxy ${proxy}: ${response.status}`);
          }
        } catch (error) {
          console.log(`Proxy ${proxy} failed for meme ${memeId}:`, error);
          continue;
        }
      }
      
      return null;
    } catch (error) {
      console.error(`Error fetching individual meme ${memeId}:`, error);
      return null;
    }
  }

  private static getKnownMemes(): MemeData[] {
    console.log('Using known working memes only...');
    return [
      {
        id: 'LBcl1A',
        imageUrl: 'https://memedepot.com/cdn-cgi/imagedelivery/naCPMwxXX46-hrE49eZovw/f127b9b4-1040-4d4b-baaf-6c4f0d7f2b00/width=640,quality=100',
        title: 'Summoning bad vibes (1).png'
      }
    ];
  }

  static async refreshMemes(): Promise<MemeData[]> {
    return this.fetchMemes();
  }
}