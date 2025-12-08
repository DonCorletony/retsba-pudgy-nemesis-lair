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

// Available face trait overlays - these must match exactly to the file names
const AVAILABLE_FACE_TRAITS = [
  "Handlebar_Bear",
  "Football",
  "Goggles",
  "Moustache",
  "Hero_Mask_Blue",
  "Hero_Mask_Red",
  "Star_Glasses",
  "Villain_Mask",
  "Circle_Glasses",
  "Blush",
  "Scouter",
  "Star_Eyes",
  "Clout_Goggles",
  "Aviators",
  "Beard",
  "Scar",
  "Cucumbers",
  "Eye_Patch",
  "Squad",
  "Monacle"
];

// Available body trait overlays - these must match exactly to the file names
const AVAILABLE_BODY_TRAITS = [
  "Lei_Blue",
  "Lei_Purple",
  "Lei_Pink",
  "Hoodie_Black",
  "Hoodie_Pink",
  "Puffer_Orange",
  "Puffer_Blue",
  "Puffer_Green",
  "Bow_Tie_Blue",
  "Bowtie_Black",
  "Bowtie_Pink",
  "Turtleneck_Pink",
  "Turtleneck_Green",
  "Kimono_Brown",
  "Kimono_Red",
  "Kimono_White",
  "Kimono_Orange",
  "Kimono_Blue",
  "Kimono_Abstract",
  "Blue_Shirt",
  "Hawaiian_Shirt",
  "Bronze_Medal",
  "Silver_Medal",
  "Gold_Medal",
  "Scarf_Pink",
  "Overalls",
  "Poncho",
  "Surfboard_Necklace",
  "Christmas_Lights",
  "Ice_Coat",
  "Tribal_Necklace",
  "Heart",
  "Crop_Top",
  "Biker_Jacket",
  "Swordman",
  "Kimono_Pink",
  "Kimono_Gold",
  "Kimono_Ice",
  "Suit_Blue",
  "Suit_Red",
  "Pudgy_Man",
  "Lei_Assorted",
  "I_Love_Fish",
  "Big_P",
  "Shark_Tooth",
  "Christmas_Sweater_Red",
  "Christmas_Sweater_Blue",
  "The_Huddle",
  "Tanktop_Yellow",
  "Tanktop_Blue",
  "Vote_4_Pudgy",
  "Turtleneck_Gray",
  "Turtleneck_Blue",
  "Labcoat",
  "Apron",
  "Scarf_Blue",
  "Scarf_Green",
  "Shirt_Red",
  "Bathrobe"
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
    const faceTraitsList = AVAILABLE_FACE_TRAITS.join(", ");
    const bodyTraitsList = AVAILABLE_BODY_TRAITS.join(", ");

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
            content: `You are an expert at analyzing Pudgy Penguin and Lil Pudgy NFT images. Your task is to identify the head, face, and body traits/accessories visible in the image.

SPECIAL PENGUIN DETECTION - CHECK FIRST:
Before analyzing traits, determine if this is a special penguin type:
- "left_facing" penguin: The penguin is facing LEFT (looking to the left side of the image) AND has its eyes CLOSED. This is a rare backwards-facing penguin variant.

If the penguin matches a special type, set "isSpecialPenguin" to that type and set all traits to null. Regular penguins face forward-right with open eyes.

GOLD SKIN DETECTION:
Check if the penguin has "Gold" skin - this is a distinctive shiny golden/yellow metallic body with sparkle effects. The gold skin covers the penguin's body (not just accessories). If detected, set the "skin" field to "Gold". Gold skin penguins still have their other traits detected normally.

IMPORTANT: For the "head" trait, you MUST return one of these EXACT values (or null if no head trait):
${headTraitsList}

IMPORTANT: For the "face" trait, you MUST return one of these EXACT values (or null if no face trait):
${faceTraitsList}

IMPORTANT: For the "body" trait, you MUST return one of these EXACT values (or null if no body trait):
${bodyTraitsList}

These are the only valid trait values. Match the uploaded Pudgy's traits to the closest matching from these lists. Use underscores and exact capitalization as shown.

HEAD TRAIT EXAMPLES:
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

FACE TRAIT EXAMPLES:
- Red/pink cheeks, blushing → "Blush"
- Handlebar mustache (brown/bear style) → "Handlebar_Bear"
- Football eye black marks → "Football"
- Swimming goggles (blue) → "Goggles"
- Curly mustache → "Moustache"
- Blue superhero mask → "Hero_Mask_Blue"
- Red superhero mask → "Hero_Mask_Red"
- Star-shaped glasses/sunglasses → "Star_Glasses"
- Black villain/bandit mask → "Villain_Mask"
- Round circle glasses/sunglasses → "Circle_Glasses"
- Purple/pink scouter device → "Scouter"
- Star eyes (yellow stars for eyes) → "Star_Eyes"
- White clout goggles → "Clout_Goggles"
- Aviator sunglasses → "Aviators"
- Full fluffy beard → "Beard"
- Red scar on face → "Scar"
- Cucumber slices on eyes → "Cucumbers"
- Eye patch (pirate style) → "Eye_Patch"
- Angular/squad sunglasses → "Squad"
- Monocle (single eyeglass) → "Monacle"

BODY TRAIT EXAMPLES:
- Blue flower lei/necklace → "Lei_Blue"
- Purple flower lei/necklace → "Lei_Purple"
- Pink flower lei/necklace → "Lei_Pink"
- Black hoodie/sweatshirt → "Hoodie_Black"
- Pink hoodie/sweatshirt → "Hoodie_Pink"
- Orange puffer jacket/vest → "Puffer_Orange"
- Blue puffer jacket/vest → "Puffer_Blue"
- Blue bow tie → "Bow_Tie_Blue"
- Black bow tie → "Bowtie_Black"
- Pink bow tie → "Bowtie_Pink"
- Pink turtleneck sweater → "Turtleneck_Pink"
- Green turtleneck sweater → "Turtleneck_Green"
- Brown kimono/robe → "Kimono_Brown"
- Red kimono/robe → "Kimono_Red"
- White kimono/robe with black pattern → "Kimono_White"
- Orange kimono/robe with triangles → "Kimono_Orange"
- Blue kimono/robe with flowers → "Kimono_Blue"
- Abstract geometric kimono → "Kimono_Abstract"
- Blue t-shirt/shirt → "Blue_Shirt"
- Hawaiian shirt with palm trees → "Hawaiian_Shirt"
- Bronze medal with ribbon → "Bronze_Medal"
- Silver medal with ribbon → "Silver_Medal"
- Gold medal with ribbon → "Gold_Medal"
- Pink scarf → "Scarf_Pink"
- Blue overalls/dungarees → "Overalls"
- Colorful poncho with pattern → "Poncho"
- Surfboard pendant necklace → "Surfboard_Necklace"
- Christmas lights string necklace → "Christmas_Lights"
- Ice/frost themed coat → "Ice_Coat"
- Tribal/tooth necklace → "Tribal_Necklace"
- Red heart on body → "Heart"
- Red crop top → "Crop_Top"
- Black biker jacket with spikes → "Biker_Jacket"
- Swordsman outfit with sword on back → "Swordman"
- Pink kimono with flowers → "Kimono_Pink"
- Gold/golden shiny kimono with Japanese-style pattern, metallic gold fabric with shine → "Kimono_Gold" (NOT Bathrobe - kimonos have patterns/designs and wrap style)
- Ice blue shiny kimono → "Kimono_Ice"
- Black suit/tuxedo with blue bow tie → "Suit_Blue"
- Black suit/tuxedo with red bow tie → "Suit_Red"
- Blue shirt with PM logo and red cape → "Pudgy_Man"
- Colorful assorted flower lei → "Lei_Assorted"
- White shirt with "I Love Fish" text → "I_Love_Fish"
- Brown bag necklace with P letter → "Big_P"
- Shark tooth necklace → "Shark_Tooth"
- Red Christmas sweater with snowflakes → "Christmas_Sweater_Red"
- Blue Christmas sweater with snowflakes → "Christmas_Sweater_Blue"
- Pink shirt with "The Huddle" text → "The_Huddle"
- Yellow tank top → "Tanktop_Yellow"
- Blue tank top → "Tanktop_Blue"
- White shirt with "Vote 4 Pudgy" text → "Vote_4_Pudgy"
- Gray turtleneck sweater → "Turtleneck_Gray"
- Blue turtleneck sweater → "Turtleneck_Blue"
- White lab coat with blue undershirt → "Labcoat"
- Green apron with "Pudge" text → "Apron"
- Blue scarf → "Scarf_Blue"
- Green scarf → "Scarf_Green"
- Red/maroon shirt with igloo logo → "Shirt_Red"
- Cream/beige/tan terry cloth bathrobe with belt, plain solid color without patterns → "Bathrobe" (NOT Kimono - bathrobes are plain solid color terry cloth with no Japanese patterns)

CRITICAL DISTINCTION - Kimono vs Bathrobe:
- Kimono_Gold: Shiny metallic GOLD fabric, Japanese-style with visible patterns/designs, ornate appearance
- Bathrobe: Plain CREAM/BEIGE/TAN terry cloth, solid color, no patterns, casual loungewear style with belt

Return ONLY valid JSON in this exact format:
{
  "isPudgy": true/false,
  "isSpecialPenguin": "left_facing" or null,
  "traits": {
    "background": "description or null",
    "skin": "description or null", 
    "body": "EXACT_BODY_TRAIT_NAME_FROM_LIST or null",
    "face": "EXACT_FACE_TRAIT_NAME_FROM_LIST or null",
    "head": "EXACT_HEAD_TRAIT_NAME_FROM_LIST or null",
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
                text: "Analyze this Pudgy Penguin NFT image and identify the head, face, and body traits. All trait values MUST be one of the exact trait names from the provided lists, or null if not visible."
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

    // Validate and normalize the face trait
    if (traits.traits?.face) {
      const faceTrait = traits.traits.face;
      // Check if it's a valid trait
      if (!AVAILABLE_FACE_TRAITS.includes(faceTrait)) {
        console.log(`Face trait "${faceTrait}" not in available list, attempting to match...`);
        // Try to find a close match
        const normalizedInput = faceTrait.toLowerCase().replace(/[\s-]/g, '_');
        const match = AVAILABLE_FACE_TRAITS.find(t => 
          t.toLowerCase() === normalizedInput ||
          t.toLowerCase().includes(normalizedInput) ||
          normalizedInput.includes(t.toLowerCase())
        );
        if (match) {
          console.log(`Matched face to: ${match}`);
          traits.traits.face = match;
        } else {
          console.log(`No match found for face trait "${faceTrait}", setting to null`);
          traits.traits.face = null;
        }
      }
    }

    // Validate and normalize the body trait
    if (traits.traits?.body && typeof traits.traits.body === 'string') {
      const bodyTrait = traits.traits.body;
      // Check if it's a valid trait
      if (!AVAILABLE_BODY_TRAITS.includes(bodyTrait)) {
        console.log(`Body trait "${bodyTrait}" not in available list, attempting to match...`);
        // Try to find a close match
        const normalizedInput = bodyTrait.toLowerCase().replace(/[\s-]/g, '_');
        const match = AVAILABLE_BODY_TRAITS.find(t => 
          t.toLowerCase() === normalizedInput ||
          t.toLowerCase().includes(normalizedInput) ||
          normalizedInput.includes(t.toLowerCase())
        );
        if (match) {
          console.log(`Matched body to: ${match}`);
          traits.traits.body = match;
        } else {
          console.log(`No match found for body trait "${bodyTrait}", setting to null`);
          traits.traits.body = null;
        }
      }
    }

    // Add metadata about available traits for the frontend
    traits.availableHeadTraits = AVAILABLE_HEAD_TRAITS;
    traits.availableFaceTraits = AVAILABLE_FACE_TRAITS;
    traits.availableBodyTraits = AVAILABLE_BODY_TRAITS;

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
