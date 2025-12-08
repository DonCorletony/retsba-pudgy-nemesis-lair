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
        model: "google/gemini-2.5-pro",
        messages: [
          {
            role: "system",
            content: `You are an expert at analyzing Pudgy Penguin and Lil Pudgy NFT images. Your task is to identify the head, face, and body traits/accessories visible in the image.

SPECIAL PENGUIN DETECTION - CHECK FIRST:
Before analyzing traits, determine if this is a special penguin type:
- "left_facing" penguin: The penguin is facing LEFT (looking to the left side of the image) AND has its eyes CLOSED. This is a rare backwards-facing penguin variant.
- "gold_kimono_special" penguin: A penguin with ALL of these features: Gold/shiny metallic skin, wearing a RED BACKWARDS HAT with blue brim, WINKING (one eye open, one closed), ORANGE background, and wearing a gold-colored shiny garment/kimono that matches the gold skin color. This is the only penguin with both Gold skin AND Kimono Gold.

If the penguin matches "left_facing", set "isSpecialPenguin" to "left_facing" and set all traits to null.
If the penguin matches "gold_kimono_special", set "isSpecialPenguin" to "gold_kimono_special" - this will trigger special handling.

GOLD SKIN DETECTION - CRITICAL (CHECK THE HEAD COLOR):
To detect gold skin, look at the penguin's HEAD and CHEEKS area (NOT the belly/chest which is always white on all penguins).
- STANDARD penguins: The HEAD/FACE area is WHITE or CREAM colored (same as the belly)
- GOLD penguins: The HEAD/FACE area is BRIGHT YELLOW or GOLDEN colored (the belly is still white, but head is yellow/gold)

If the penguin's HEAD and CHEEKS are YELLOW/GOLD colored, set "skin" to "Gold". 
The gold color is often bright yellow with possible sparkle/shine effects on the head area.
Example: A penguin with a yellow/golden head wearing an orange kimono and headband = Gold skin penguin.

ICE SKIN DETECTION (CHECK THE HEAD COLOR):
To detect ice skin, look at the penguin's HEAD and CHEEKS area.
- ICE penguins: The HEAD/FACE area is LIGHT BLUE or ICY colored (crystalline appearance)
If the penguin's HEAD is light blue/icy colored, set "skin" to "Ice".

IMPORTANT: For the "head" trait, you MUST return one of these EXACT values (or null if no head trait):
${headTraitsList}

IMPORTANT: For the "face" trait, you MUST return one of these EXACT values (or null if no face trait):
${faceTraitsList}

IMPORTANT: For the "body" trait, you MUST return one of these EXACT values (or null if no body trait):
${bodyTraitsList}

These are the only valid trait values. Match the uploaded Pudgy's traits to the closest matching from these lists. Use underscores and exact capitalization as shown.

HEAD TRAIT EXAMPLES:

CRITICAL HAT DISTINCTION - LOOK FOR THE IGLOO LOGO:
- "Hat_Red" / "Hat_Blue" = Forward-facing cap WITH AN IGLOO LOGO visible on the front. The igloo is a white building design on the cap.
- "Backwards_Hat_Red" / "Backwards_Hat_Blue" = Backwards cap with NO IGLOO LOGO visible (plain front, logo is hidden at back)

THE IGLOO LOGO IS THE KEY:
- If you see a WHITE IGLOO LOGO on the front of the cap → "Hat_Red" or "Hat_Blue"
- If there is NO igloo logo visible (plain cap front) → "Backwards_Hat_Red" or "Backwards_Hat_Blue"
- SIDEWAYS CAP with brim to the side → "Sideways_Blue" or "Sideways_Red"

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

IMPORTANT - NECKLACES AND BODY TRAITS CAN BE PARTIALLY HIDDEN:
When a face trait like "Beard" is present, it may partially cover body traits like necklaces. Look CAREFULLY at the neck/chest area for any visible necklaces or pendants peeking out from behind the beard or other face accessories. Common necklaces include:
- Surfboard_Necklace: A small wooden/tan surfboard pendant on a string around the neck - may be partially visible under a beard
- Shark_Tooth: A shark tooth on a cord around the neck
- Tribal_Necklace: A tribal/bone necklace around the neck
- Christmas_Lights: String of colorful lights worn as necklace
Even if only partially visible, if you can identify the necklace type, include it as the body trait.

CRITICAL - SURFBOARD_NECKLACE vs LEI vs BOW_TIE (COMMON CONFUSIONS):
These traits look VERY different - do NOT confuse them:

- "Surfboard_Necklace": A SINGLE SMALL WOODEN SURFBOARD PENDANT (tan/brown/wood colored board shape) hanging on a CORD/STRING around the neck. The surfboard itself is tan/wood colored. The cord may be blue/teal. There is only ONE pendant object - the surfboard. NO FLOWERS.

- "Lei_Blue" / "Lei_Purple" / "Lei_Pink": A HAWAIIAN FLOWER LEI - MULTIPLE FLOWERS (typically 5+ flowers) strung together in a GARLAND that drapes around the neck. Leis have MANY individual flower shapes visible. They look like a floral necklace/garland.

- "Bow_Tie_Blue": A BLUE BOW-SHAPED TIE worn at the collar/neck area. It's a symmetrical bow shape made of fabric. NO pendant, no string with hanging object.

KEY IDENTIFICATION:
- See a SINGLE PENDANT (surfboard shape) on a cord? → "Surfboard_Necklace"
- See MULTIPLE FLOWERS in a garland around the neck? → Lei (Blue/Purple/Pink based on color)
- See a SYMMETRICAL BOW SHAPE at the collar? → Bow_Tie

If there's a beard covering part of the neck, look carefully for what's visible beneath it. A small surfboard pendant peeking out is Surfboard_Necklace, NOT a lei!

BODY TRAIT EXAMPLES:
- Blue FLOWER LEI with MULTIPLE blue flowers in a garland → "Lei_Blue"
- Purple FLOWER LEI with MULTIPLE purple flowers → "Lei_Purple"
- Pink FLOWER LEI with MULTIPLE pink flowers → "Lei_Pink"
- Black hoodie/sweatshirt → "Hoodie_Black"
- Pink hoodie/sweatshirt → "Hoodie_Pink"
- Orange puffer jacket/vest → "Puffer_Orange"
- Blue puffer jacket/vest → "Puffer_Blue"
- Blue bow tie (symmetrical bow shape at collar, NO pendant) → "Bow_Tie_Blue"
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
- Red/maroon CROP TOP - a short tight-fitting top that shows the belly area, casual sleeveless or short-sleeve style, plain solid red/maroon color with NO LOGO → "Crop_Top"
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
- Red/maroon HOODIE or SWEATSHIRT with a WHITE IGLOO/DISCO BALL LOGO on the chest → "Shirt_Red" (MUST have a visible white circular logo/design on the chest)
- Cream/beige/tan terry cloth bathrobe with belt, plain solid color without patterns → "Bathrobe" (NOT Kimono - bathrobes are plain solid color terry cloth with no Japanese patterns)

CRITICAL - CROP_TOP vs SHIRT_RED (YOU MUST GET THIS RIGHT):
- "Crop_Top": A plain solid RED/MAROON top with NO LOGO or design. It's a casual crop top style that exposes the belly area. The garment is PLAIN with no visible markings.
- "Shirt_Red": A red/maroon HOODIE or SWEATSHIRT with a distinctive WHITE CIRCULAR LOGO (looks like an igloo or disco ball) visible on the chest. If there's a WHITE LOGO on the chest → Shirt_Red. If the red top is PLAIN with no logo → Crop_Top.

CRITICAL - KIMONO_GOLD vs BATHROBE (YOU MUST GET THIS RIGHT):
Step 1: Look ONLY at the garment/clothing the penguin is wearing (ignore skin color)
Step 2: Determine the COLOR of the garment fabric:
  - If the garment fabric is GOLD/YELLOW/SHINY METALLIC (bright, reflective, same hue as gold skin) → "Kimono_Gold"
  - If the garment fabric is CREAM/BEIGE/TAN/OFF-WHITE (muted, soft, matte texture) → "Bathrobe"

EXAMPLES:
- Gold skin penguin wearing a GOLD-colored shiny wrap = "Kimono_Gold" (garment is gold)
- Gold skin penguin wearing a CREAM-colored soft robe = "Bathrobe" (garment is cream, NOT gold)
- The garment color determines the trait, NOT the skin color!

Return ONLY valid JSON in this exact format:
{
  "isPudgy": true/false,
  "isSpecialPenguin": "left_facing" or null,
  "garmentMatchesSkinColor": true/false (IMPORTANT: Does the garment/clothing appear to be the SAME COLOR as the skin? If gold skin and gold garment = true. If gold skin and cream garment = false),
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
    
    // SPECIAL HANDLING: gold_kimono_special penguin - override traits
    if (traits.isSpecialPenguin === 'gold_kimono_special') {
      console.log('POST-PROCESSING: gold_kimono_special detected, setting hardcoded traits');
      traits.traits = {
        background: 'Orange',
        skin: 'Gold',
        body: 'Kimono_Gold',
        face: null,
        head: 'Backwards_Hat_Red',
        hand: null
      };
    }
    
    // POST-PROCESSING: Use garmentMatchesSkinColor to fix Kimono_Gold vs Bathrobe confusion
    // If the AI detected Gold skin + Bathrobe, but garment matches skin color, it's Kimono_Gold
    if (traits.garmentMatchesSkinColor === true && 
        traits.traits?.skin?.toLowerCase()?.includes('gold') && 
        traits.traits?.body === 'Bathrobe') {
      console.log('POST-PROCESSING: garmentMatchesSkinColor=true + Gold skin + Bathrobe detected, correcting to Kimono_Gold');
      traits.traits.body = 'Kimono_Gold';
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
