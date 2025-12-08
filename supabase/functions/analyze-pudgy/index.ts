import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Available head trait overlays - these must match exactly to the file names
const AVAILABLE_HEAD_TRAITS = [
  "Afro_with_Pick",
  "Backwards_Hat_Blue",
  "Backwards_Hat_Red",
  "Banana_Suit",
  "Beanie_Gray",
  "Beanie_Orange",
  "Biker_Helmet",
  "Blue_Durag",
  "Bucket_Hat_Green",
  "Bucket_Hat_Tan",
  "Camo_Helmet",
  "Cowboy_Hat",
  "Crown",
  "Egg",
  "Egg_Gold",
  "Fish_Blue",
  "Fish_Gold",
  "Fish_Green",
  "Fish_Orange",
  "Flat_Cap_Black",
  "Flat_Cap_Blue",
  "Flat_Cap_Tan",
  "Flower_Crown",
  "Ghost",
  "Grizzly_Bear_Hat",
  "Hat_Blue",
  "Hat_Red",
  "Hatched",
  "Hatched_Gold",
  "Headband",
  "Hippy_Hair",
  "Ice_Crown",
  "Jester_Hat",
  "Macaroni",
  "Mohawk_Green",
  "Mohawk_Purple",
  "Ninja_Headband",
  "Panda_Hat",
  "Party_Hat",
  "Pineapple",
  "Pink_Beanie",
  "Pirate_Hat",
  "Polar_Bear_Hat",
  "Red_Durag",
  "Rice_Hat",
  "Santa_Hat",
  "Shark_Suit",
  "Sideways_Blue",
  "Sideways_Red",
  "Sombrero",
  "Top_Hat",
  "Viking_Hat",
  "Wizard_Hat"
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64 } = await req.json();
    
    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: "No image provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Analyzing Pudgy Penguin image for traits...");

    const headTraitsList = AVAILABLE_HEAD_TRAITS.join(", ");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are an expert at analyzing Pudgy Penguin and Lil Pudgy NFT images. Your task is to identify the head trait/accessory visible in the image.

IMPORTANT: For the "head" trait, you MUST return one of these EXACT values (or null if no head trait):
${headTraitsList}

These are the only valid head trait values. Match the uploaded Pudgy's headwear to the closest matching trait from this list. Use underscores and exact capitalization as shown.

Examples of matching:
- A blue backwards cap → "Backwards_Hat_Blue"
- A red beanie → "Beanie_Orange" (if closest match)
- A viking helmet → "Viking_Hat"
- A cowboy hat → "Cowboy_Hat"
- A crown → "Crown"
- An ice/frozen crown → "Ice_Crown"
- A wizard/witch hat → "Wizard_Hat"
- A pirate hat → "Pirate_Hat"
- A sombrero → "Sombrero"
- A top hat → "Top_Hat"
- A party hat → "Party_Hat"
- A santa hat → "Santa_Hat"
- A panda hood/hat → "Panda_Hat"
- A polar bear hood → "Polar_Bear_Hat"
- A grizzly bear hood → "Grizzly_Bear_Hat"
- A shark costume/suit → "Shark_Suit"
- A banana costume → "Banana_Suit"
- A ghost costume → "Ghost"
- Rice/straw hat → "Rice_Hat"
- Fish on head (any color) → "Fish_Blue", "Fish_Gold", "Fish_Green", or "Fish_Orange"
- Mohawk hairstyle → "Mohawk_Green" or "Mohawk_Purple"
- Afro with pick → "Afro_with_Pick"
- Hippy/long hair → "Hippy_Hair"
- Durag → "Blue_Durag" or "Red_Durag"
- Headband → "Headband" or "Ninja_Headband"
- Bucket hat → "Bucket_Hat_Green" or "Bucket_Hat_Tan"
- Flat cap → "Flat_Cap_Black", "Flat_Cap_Blue", or "Flat_Cap_Tan"
- Beanie → "Beanie_Gray", "Beanie_Orange", or "Pink_Beanie"
- Egg (unhatched) → "Egg" or "Egg_Gold"
- Hatched egg shell → "Hatched" or "Hatched_Gold"
- Flower crown → "Flower_Crown"
- Jester hat → "Jester_Hat"
- Pineapple → "Pineapple"
- Macaroni → "Macaroni"
- Biker/motorcycle helmet → "Biker_Helmet"
- Camo/military helmet → "Camo_Helmet"
- Basic hat/cap → "Hat_Blue", "Hat_Red", "Sideways_Blue", or "Sideways_Red"

Return ONLY valid JSON in this exact format:
{
  "isPudgy": true/false,
  "traits": {
    "background": "description or null",
    "skin": "description or null", 
    "body": "description or null",
    "face": "description or null",
    "head": "EXACT_TRAIT_NAME_FROM_LIST or null",
    "hand": "description or null"
  },
  "confidence": "high/medium/low",
  "description": "Brief overall description of the Pudgy"
}`
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analyze this Pudgy Penguin NFT image and identify the head trait. The head trait value MUST be one of the exact trait names from the provided list, or null if no head accessory is visible."
              },
              {
                type: "image_url",
                image_url: {
                  url: imageBase64
                }
              }
            ]
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add more credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    console.log("AI response:", content);

    // Parse the JSON from the response
    let traits;
    try {
      // Extract JSON from the response (it might be wrapped in markdown code blocks)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        traits = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      return new Response(
        JSON.stringify({ 
          error: "Failed to parse trait analysis",
          rawResponse: content 
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate and normalize the head trait
    if (traits.traits?.head) {
      const headTrait = traits.traits.head;
      // Check if it's a valid trait
      if (!AVAILABLE_HEAD_TRAITS.includes(headTrait)) {
        console.log(`Head trait "${headTrait}" not in available list, attempting to match...`);
        // Try to find a close match
        const normalizedInput = headTrait.toLowerCase().replace(/[\s-]/g, '_');
        const match = AVAILABLE_HEAD_TRAITS.find(t => 
          t.toLowerCase() === normalizedInput ||
          t.toLowerCase().includes(normalizedInput) ||
          normalizedInput.includes(t.toLowerCase())
        );
        if (match) {
          console.log(`Matched to: ${match}`);
          traits.traits.head = match;
        } else {
          console.log(`No match found for "${headTrait}", setting to null`);
          traits.traits.head = null;
        }
      }
    }

    // Add metadata about available traits for the frontend
    traits.availableHeadTraits = AVAILABLE_HEAD_TRAITS;

    return new Response(
      JSON.stringify(traits),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in analyze-pudgy function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "An unexpected error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
