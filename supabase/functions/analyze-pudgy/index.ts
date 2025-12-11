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

// Available face trait overlays for Big Pudgys - these must match exactly to the file names
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

// Available face trait overlays for Lil Pudgys - these must match exactly to the file names
const AVAILABLE_LIL_FACE_TRAITS = [
  "Circle_Glasses",
  "Blushing",
  "Cross_Eyed",
  "Curious",
  "Mad",
  "Normal",
  "Reading_Cute",
  "Winking",
  "Reading_Normal",
  "Reading_Cross_eyed",
  "Nerd_Normal",
  "Nerd_Cute",
  "Nerd_Blushing",
  "Scouter",
  "Goofy_Glasses",
  "Football",
  "Goggles",
  "Goggles_Pink",
  "Goggles_Yellow",
  "Aviators",
  "Clout_Goggles",
  "Ski_Goggles",
  "Squad",
  "Star_Glasses",
  "Shades_Blue",
  "Shades_Yellow",
  "Upsidedown_Orange",
  "Upsidedown_Purple"
];

// Available Lil right flipper trait overlays - these must match exactly to the file names
const AVAILABLE_LIL_RIGHT_FLIPPER_TRAITS = [
  "Chop_Sticks",
  "Kite_Red",
  "Sunflower",
  "Surfboard_Tan",
  "Roses",
  "Carrot",
  "Croissant",
  "Popsicle",
  "Maraca",
  "Football",
  "Surfboard_Blue",
  "Lollipop",
  "Balloon_Sword_Blue",
  "Pickett_Sign",
  "GM_Sign",
  "Golden_Plunger",
  "Sword_Gold",
  "Stick",
  "Kite_Green",
  "Chocolate",
  "Plushie_Green",
  "Plushie_Pink",
  "Plushie_Blue",
  "Plushie_Black",
  "Balloon_Sword_Red",
  "Candycane_Green",
  "Candycane_Red",
  "Bat",
  "Basketball",
  "Cheeseburger",
  "Balloon_Red",
  "Plushie_Red",
  "Balloon_Blue",
  "Plunger",
  "Plushie_Purple",
  "Plushie_Gold",
  "Balloon_Sword_Black",
  "Balloon_Sword_Purple",
  "Sword",
  "Turkey_Leg",
  "Juice_Box",
  "Sword_Ice",
  "Plushie_Ice",
  "Balloon_Gold",
  "Spoon_Gold",
  "Staff_Gold",
  "Rubber_Duck",
  "Star_Wand",
  "Kite_Gold",
  "Spoon",
  "Ice_Cream"
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
    const { imageBase64, expectedMode } = await req.json();
    
    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: "No image provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    console.log(`Analyzing Pudgy Penguin image for traits... Expected mode: ${expectedMode || 'auto-detect'}`);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Analyzing Pudgy Penguin image for traits...");

    const headTraitsList = AVAILABLE_HEAD_TRAITS.join(", ");
    const faceTraitsList = AVAILABLE_FACE_TRAITS.join(", ");
    const lilFaceTraitsList = AVAILABLE_LIL_FACE_TRAITS.join(", ");
    const bodyTraitsList = AVAILABLE_BODY_TRAITS.join(", ");
    const lilRightFlipperTraitsList = AVAILABLE_LIL_RIGHT_FLIPPER_TRAITS.join(", ");

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

1. "pudgy_knight_[COLOR]" - PUDGY KNIGHTS (1:1 Lil Pudgy variants):
   These are EASY to identify by their UNIQUE BACKGROUND: an icy arctic landscape with an IGLOO visible, clouds, and snowy/icy terrain.
   Pudgy Knights are Lil Pudgys wearing hooded cloaks and holding two weapons (swords, batons, or spoons).
   If you see this distinctive igloo background, it is a Pudgy Knight. Identify the color variant:
   - "pudgy_knight_black" = BLACK cloak/hood, holding dark batons
   - "pudgy_knight_ice" = LIGHT BLUE/ICY cloak, holding silver/ice swords, may have ice sparkle on hood
   - "pudgy_knight_blue" = DARK BLUE/ROYAL BLUE cloak, holding blue batons
   - "pudgy_knight_purple" = PURPLE cloak, holding purple batons, may have pink blush
   - "pudgy_knight_white" = WHITE cloak, holding white batons (zebra-stripe pattern visible)
   - "pudgy_knight_gray" = GRAY cloak, holding SPOONS (not swords/batons)
   - "pudgy_knight_gold" = GOLD/YELLOW cloak, holding gold swords, may have sparkle on hood
   - "pudgy_knight_red" = RED cloak, holding red/pink batons
   
   For ANY Pudgy Knight, set "isSpecialPenguin" to the appropriate "pudgy_knight_[color]" value and set all traits to null.

2. "left_facing" penguin: The penguin is facing LEFT (looking to the left side of the image) AND has its eyes CLOSED. This is a rare backwards-facing penguin variant.

3. "gold_kimono_special" penguin: A penguin with ALL of these features: Gold/shiny metallic skin, wearing a RED BACKWARDS HAT with blue brim, WINKING (one eye open, one closed), ORANGE background, and wearing a gold-colored shiny garment/kimono that matches the gold skin color. This is the only penguin with both Gold skin AND Kimono Gold.

4. OTHER 1:1 LIL PUDGY SPECIAL VARIANTS - CHECK FOR THESE DISTINCTIVE LILS:
   - "lil_hot_dog" = A Lil wearing a HOT DOG COSTUME with trees and a RED GRILL in the background. The penguin is inside a hot dog bun with mustard/ketchup visible.
   - "lil_backward" = A BLUE Lil facing AWAY from us (showing its back), looking toward an OCEAN with a MOON in the sky. You see the back of the penguin, not its face.
   - "lil_jetpack" = A BLACK Lil wearing a JETPACK, flying through the SKY with clouds. Flames shooting from the jetpack.
   - "lil_runt" = An EXTRA-SMALL tiny blue Lil on a flat SKYBLUE background. The penguin is very small compared to normal Lils.
   - "lil_taco" = A GRAY Lil in a TACO COSTUME with TACOS floating in the background. Orange/yellow taco-themed background.
   - "lil_tree" = A GRAY Lil wearing a TREE COSTUME on a STAGE with RED CURTAINS on each side. Playground visible in background.
   - "lil_avocado" = A PINK Lil wearing an AVOCADO COSTUME with AVOCADOS in the background. Green avocado-themed background.
   - "lil_stuck" = A BLUE Lil with its HEAD BURIED IN THE SNOW on the ground, FEET UP IN THE AIR. Blue sky with clouds, igloo in background. You see the penguin's butt and feet sticking up.
   - "lil_astronaut" = A Lil in an ASTRONAUT COSTUME on the MOON, holding a BLUE FLAG with an IGLOO LOGO. Rocket ship visible in background, starry space sky.

   For ANY of these special Lil variants, set "isSpecialPenguin" to the appropriate value (e.g., "lil_hot_dog") and set all traits to null.

If the penguin matches "left_facing", set "isSpecialPenguin" to "left_facing" and set all traits to null.
If the penguin matches "gold_kimono_special", set "isSpecialPenguin" to "gold_kimono_special" - this will trigger special handling.
If the penguin matches any "pudgy_knight_*", set "isSpecialPenguin" to the appropriate knight color and set all traits to null.
If the penguin matches any "lil_*" special variant, set "isSpecialPenguin" to the appropriate value and set all traits to null.

GOLD SKIN AND ICE SKIN DETECTION - CRITICAL:

TWO KEY IDENTIFIERS (EITHER ONE = Gold/Ice Skin):
1. WHITE SPARKLES (✨) - 4-pointed white star shapes on body/flippers
2. DISTINCTIVE SKIN COLOR - the unique gold or ice blue color

GOLD SKIN (report "skin": "gold skin"):
- Color: BRIGHT GOLDEN YELLOW body/flippers/head (warm, metallic yellow like gold)
- Sparkles: WHITE 4-pointed star sparkles (✨) may be visible
- EITHER the golden yellow color OR visible sparkles = Gold Skin
- Even if sparkles are covered by clothing, the GOLDEN YELLOW skin color alone = Gold Skin

ICE SKIN (report "skin": "ice skin"):
- Color: LIGHT CYAN/ICY BLUE body/flippers/head (pale, cool, sky blue - MUCH LIGHTER than normal Lil blue)
- Sparkles: WHITE 4-pointed star sparkles (✨) may be visible
- EITHER the light cyan color OR visible sparkles = Ice Skin
- Even if sparkles are covered by clothing, the LIGHT CYAN/ICY BLUE skin color alone = Ice Skin
- CRITICAL DISTINCTION: Ice skin is PALE CYAN (like sky blue/aqua), NOT the standard darker blue of normal Lils

NORMAL (report "skin": "Normal"):
- Color: Standard DARK BLUE or BLUE-GRAY body (the typical Lil Pudgy blue)
- NO sparkles visible
- Standard Lil blue is DARKER and more saturated than Ice Skin

COLOR COMPARISON:
- Normal Lil = DARK/MEDIUM BLUE (like navy or royal blue)
- Ice Skin = PALE CYAN/SKY BLUE (much lighter, like aqua or ice)
- Gold Skin = BRIGHT YELLOW/GOLD (metallic warm yellow)

DECISION:
- Light cyan/icy pale blue body (with or without sparkles) → "ice skin"
- Bright golden yellow body (with or without sparkles) → "gold skin"
- Standard dark blue body + no sparkles → "Normal"



IMPORTANT: For the "head" trait, you MUST return one of these EXACT values (or null if no head trait):
${headTraitsList}

IMPORTANT: For the "face" trait, you MUST return one of these EXACT values (or null if no face trait):
- For BIG PUDGY (larger, rounder penguin with bigger body proportions): ${faceTraitsList}
- For LIL PUDGY (smaller, cuter baby penguin with smaller proportions): ${lilFaceTraitsList}

IMPORTANT: For the "body" trait, you MUST return one of these EXACT values (or null if no body trait):
${bodyTraitsList}

IMPORTANT: For the "right_flipper" trait (LIL PUDGY ONLY), you MUST return one of these EXACT values (or null if no right flipper trait):
${lilRightFlipperTraitsList}

RIGHT FLIPPER TRAITS (LIL PUDGY ONLY):
Right flipper traits appear in the Lil's RIGHT HAND (which appears on the LEFT side of the image from our viewing perspective, since the Lil faces us).
- "Chop_Sticks" = Wooden chopsticks held crossed in the flipper
- "Kite_Red" = A red geometric patterned kite with bows and a curving string
- "Sunflower" = A bouquet of sunflowers with green stems
- "Surfboard_Tan" = A tan/orange surfboard held upright
- "Roses" = A bouquet of colorful roses (red, blue, yellow) with green stems and leaves
- "Carrot" = An orange carrot with green leafy top
- "Croissant" = A golden croissant pastry
- "Popsicle" = A green popsicle on a wooden stick
- "Maraca" = A colorful maraca with zigzag pattern (green, red, pink, yellow) on a wooden handle
- "Football" = A brown American football with white laces
- "Surfboard_Blue" = A blue surfboard held upright
- "Lollipop" = A yellow spiral lollipop on a wooden stick
- "Balloon_Sword_Blue" = A blue balloon animal shaped like a sword with balloon guard/hilt
- "Pickett_Sign" = A wooden picket sign on a pole with "GM!" written on it
- "GM_Sign" = A black arrow-shaped marquee sign with lights around the edge and "GM!" in LED lights
- "Golden_Plunger" = A golden toilet plunger with yellow cup and gold handle
- "Sword_Gold" = A golden sword with pointed blade and gem in the hilt
- "Stick" = A brown wooden stick/branch with small twigs
- "Kite_Green" = A green geometric patterned kite with bows and a curving string (like Kite_Red but green)
- "Chocolate" = A chocolate bar in red wrapper with "P" logo, chocolate squares visible at top


THE KEY DIFFERENCE IS THE BODY VISIBILITY:
- LIL PUDGY: The ENTIRE BODY is visible, including FEET. You can see the penguin from head to toe.
- BIG PUDGY: Only the UPPER HALF of the body is visible. The image is cropped - NO FEET visible.

LIL PUDGY (set isLilPudgy: true):
- FULL BODY visible including feet/flippers at the bottom
- You can see the penguin standing on its feet
- The penguin's entire figure is shown from head to feet

BIG PUDGY (set isLilPudgy: false):
- Only UPPER HALF of body visible (head, shoulders, chest area)
- NO FEET visible - image is cropped at the waist/belly area
- Portrait-style framing showing just the top portion

DECISION RULE: Can you see the penguin's FEET? 
- YES (feet visible) → Lil Pudgy (isLilPudgy: true)
- NO (feet not visible, cropped image) → Big Pudgy (isLilPudgy: false)

${expectedMode === 'lil' ? `
IMPORTANT: The user expects this to be a Lil Pudgy. Focus on analyzing Lil Pudgy traits from the LIL face trait list: ${lilFaceTraitsList}
If the image shows a full-body penguin with feet visible, this is definitely a Lil Pudgy.
` : expectedMode === 'big' ? `
IMPORTANT: The user expects this to be a Big Pudgy. Focus on analyzing Big Pudgy traits from the BIG face trait list: ${faceTraitsList}
If the image shows only the upper body without feet visible, this is definitely a Big Pudgy.
` : ''}

CRITICAL - SKIN TYPE DETECTION (CHECK EARLY - VERY IMPORTANT):
Look at the penguin's SKIN COLOR (body, flippers, head) FIRST before analyzing other traits:

"Gold Skin" → Report in skin field as "gold skin":
- Body/flippers/head are GOLDEN YELLOW color (bright warm yellow, not blue)
- WHITE SPARKLE EFFECTS (✨) - small 4-pointed white stars on body/flippers
- The sparkles are the KEY identifier - look for white star shapes on the yellow body

"Ice Skin" → Report in skin field as "ice skin":
- Body/flippers/head are LIGHT BLUE/CYAN/ICY color (cool light blue, not standard dark blue)
- WHITE SPARKLE EFFECTS (✨) - small 4-pointed white stars on body/flippers
- The sparkles are the KEY identifier - look for white star shapes on the light blue body
- Ice Skin is LIGHTER blue than regular Lil Pudgy blue - more like cyan/sky blue

"Normal" → Regular blue/gray body with NO sparkles

SPARKLE DETECTION IS KEY:
- If you see ANY white 4-pointed star sparkles (✨) on the body → It's Gold or Ice skin
- Gold = yellow/golden body + sparkles
- Ice = light blue/cyan body + sparkles
- No sparkles = Normal skin

CRITICAL - LIL PUDGY FACE TRAIT DISTINCTION:
For Lil Pudgys, you MUST look at these SPECIFIC features to identify face traits:

"Goofy_Glasses" (RED NOSE + WHITE MUSTACHE):
- Has RED frames
- Has a RED NOSE (clown-style red nose ball)
- Has a WHITE MUSTACHE below the nose
- This is a novelty/joke glasses style with nose and mustache attached

"Nerd_Normal" (RED FRAMES + WHITE BANDAGE):
- Has RED frames (can be square/rectangular shape)
- Has a small WHITE BANDAGE on the BRIDGE of the glasses (the part between the lenses)
- NO red nose, NO white mustache
- Regular nerd glasses with bandage tape on bridge
- IMPORTANT: Red square/rectangular glasses with a bandage = Nerd_Normal

"Reading_Cute" (BLUE FRAMES, CIRCULAR):
- Has BLUE frames (not red, not black)
- CIRCULAR/round lens shape
- Clear or light-colored lenses
- NO dots in the center of lenses

"Reading_Cross_eyed" (BLUE FRAMES + BLACK DOTS):
- Same as Reading_Cute (blue frames, circular)
- BUT has BLACK CIRCULAR DOTS in the CENTER of the blue frames/lenses
- The dots represent crossed eyes

"Nerd_Cute" (TAN FRAMES, RECTANGULAR, OPEN EYES):
- Has TAN/BEIGE colored frames
- RECTANGULAR lens shape (not circular)
- Eyes are OPEN and visible
- NO blush marks

"Nerd_Blushing" (TAN FRAMES, RECTANGULAR, CLOSED EYES + BLUSH):
- Same as Nerd_Cute (tan frames, rectangular)
- BUT eyes are CLOSED
- Has RED BLUSH SPOTS beneath the eyes

"Reading_Normal" (BLUE LENSES):
- Round/circular glasses with BLUE colored lenses
- BLACK frames with BLUE lenses

"Nerd_Cute" (TAN RECTANGULAR GLASSES WITH BANDAGE):
- TAN/beige rectangular frames with LIGHT BLUE lenses
- WHITE BANDAGE on the glasses' bridge (center between lenses)
- Eyes visible through lenses as regular open eyes

"Aviators" (BLACK AVIATOR GLASSES, GRADIENT LENSES):
- BLACK aviator-style frames
- Lenses are BLACK on top, fading to LIGHT BLUE toward the bottom
- Classic aviator teardrop shape

"Goggles_Pink" (PINK CLOUT GOGGLES):
- PINK frames in clout goggle style
- OVAL-shaped LIGHT BLUE lenses
- Distinct pink color frames

"Goggles_Yellow" (YELLOW CLOUT GOGGLES):
- YELLOW frames in clout goggle style
- OVAL-shaped LIGHT BLUE lenses
- Distinct yellow color frames

"Football" (BLACK RECTANGLES UNDER EYES):
- Simple OVAL BLACK eyes (no glasses)
- BLACK RECTANGLES painted beneath each eye
- Like football players' eye black to reduce sun glare
- NO glasses, just the black paint marks under eyes

"Reading_Normal" (BLACK CIRCULAR GLASSES):
- BLACK frames with CIRCULAR shape
- LIGHT BLUE lenses
- Simple round reading glasses

"Squad" (BLACK FRAMELESS TRIANGULAR GLASSES):
- BLACK, FRAMELESS glasses
- Appears as TWO TRIANGLES bound together
- WHITE REFLECT visible on the lenses
- Key distinction: completely FRAMELESS design

"Nerd_Blushing" (TAN GLASSES WITH CLOSED HAPPY EYES):
- TAN/beige rectangular frames with WHITE BANDAGE in the middle
- PARTIAL RED OVALS in each lens (blush marks)
- CLOSED EYES that look cheerful/happy
- Closed eyes appear as ( symbol rotated 90 degrees, sitting in center of each lens
- CRITICAL: Closed happy eyes + blush marks = Nerd_Blushing

"Goofy_Glasses" (RED GLASSES + CLOWN NOSE + MUSTACHE):
- RED rectangular frames with LIGHT BLUE lenses
- RED CLOWN NOSE
- WHITE MUSTACHE
- All three elements together: glasses + nose + mustache

"Upsidedown_Orange" (UPSIDE DOWN ORANGE GLASSES):
- ORANGE frames with BLACK lenses
- Glasses are FLIPPED UPSIDE DOWN on the face
- Frames appear inverted/reversed

"Goggles" (BLUE CLOUT GOGGLES):
- BLUE frames in clout goggle style
- OVAL-shaped LIGHT BLUE lenses
- Standard blue clout goggles

"Shades_Blue" (BLUE SUNGLASSES):
- BLUE frames, generic sunglasses shape
- BLACK lenses
- Simple blue-framed shades

"Star_Glasses" (STAR-SHAPED FRAMES):
- GOLD/YELLOW frames
- REDDISH-PURPLE star-shaped frame design
- Distinctive star shape around each lens

"Scouter" (PURPLE RECTANGLE OVER ONE EYE):
- BLACK OVAL eyes visible
- PURPLE RECTANGLE device over the LEFT eye (right side of image)
- Like a Dragon Ball Z scouter device

"Upsidedown_Purple" (UPSIDE DOWN PURPLE GLASSES):
- PURPLE frames with BLACK lenses
- Glasses are FLIPPED UPSIDE DOWN on the face

"Nerd_Normal" (RED RECTANGULAR GLASSES WITH BANDAGE):
- RED rectangular frames with WHITE BANDAGE over bridge
- LIGHT BLUE lenses
- BLACK OVAL eyes visible through the lenses
- CRITICAL: Distinguished from Goofy_Glasses by NO red clown nose and NO mustache

"Shades_Yellow" (YELLOW SUNGLASSES):
- YELLOW frames
- BLACK lenses
- Simple yellow-framed shades

"Clout_Goggles" (WHITE CLOUT GOGGLES):
- WHITE frames in clout goggle style
- ROUND BLACK lenses
- Distinct white frame color

"Ski_Goggles" (SKI GOGGLES):
- GRAY band across head
- BLUE frame
- YELLOWISH-ORANGE lens
- Ski/snow goggle style

"Reading_Cross_eyed" (BLUE CIRCULAR GLASSES WITH CROSSED EYES):
- BLUE frames with CIRCULAR shape
- LIGHT BLUE lenses
- TWO CIRCULAR BLACK DOTS visible through lenses (crossed eyes)
- The dots are small and centered, depicting crossed eyes

"Reading_Cute" (BLUE CIRCULAR GLASSES WITH BIG GLISTENING EYES):
- BLUE frames with CIRCULAR shape
- LIGHT BLUE lenses
- BIG BLACK eyes with TWO WHITE CIRCLES in them (glistening cartoon eyes)
- CRITICAL: Large eyes with white reflection dots = Reading_Cute

"Circle_Glasses" (THIN BLACK CIRCULAR GLASSES):
- THIN BLACK frames with CIRCULAR shape
- BLACK lenses (completely dark)
- Simple thin-framed round glasses

"Curious" (ASYMMETRICAL IRREGULAR EYES):
- NO glasses
- Eyes are ASYMMETRICAL - each eye has a DIFFERENT irregular shape
- The two eyes do NOT match each other
- Unique expression with mismatched eye shapes

"Blushing" (RED OVAL BLUSH MARKS):
- NO glasses
- TWO RED OVALS on cheeks (blush marks)
- Simple blushing expression

"Mad" (ANGRY/SQUINTING EXPRESSION WITH HORIZONTAL LINE):
- NO glasses
- OVAL-SHAPED eyes with a HORIZONTAL LINE cutting through the UPPER HALF
- This horizontal line gives the appearance of SQUINTING or ANGRY eyes
- CRITICAL: The line makes the eyes look half-closed or narrowed in anger

"Winking" (ONE EYE OPEN, ONE EYE CLOSED AS < SHAPE):
- NO glasses
- RIGHT eye (left side of image): Regular OVAL BLACK eye, open
- LEFT eye (right side of image): CLOSED, depicted as a < shape (sideways V)
- CRITICAL: One oval eye open + one < shaped closed eye = Winking

"Normal" (PLAIN OVAL BLACK EYES):
- NO glasses
- TWO LARGER OVAL-SHAPED BLACK MARKS
- COMPLETELY SOLID black ovals - NO horizontal line or eyelid
- FULLY OPEN oval eyes with no squinting or partial closure
- CRITICAL: Plain solid ovals with no lines = Normal

DECISION RULES (MUST PICK ONE - NEVER return null if glasses are visible):
- RED frames + RED NOSE + WHITE MUSTACHE → Goofy_Glasses
- RED rectangular frames + WHITE BANDAGE (no nose/mustache) → Nerd_Normal
- TAN rectangular frames + WHITE BANDAGE + open eyes → Nerd_Cute
- TAN rectangular frames + WHITE BANDAGE + closed happy eyes + blush → Nerd_Blushing
- BLUE circular frames + big glistening eyes (white dots) → Reading_Cute
- BLUE circular frames + crossed eye dots → Reading_Cross_eyed
- BLACK circular frames + thin + black lenses → Circle_Glasses
- BLACK circular frames + light blue lenses → Reading_Normal
- BLACK aviators with gradient lenses → Aviators
- BLACK frameless triangles → Squad
- PINK clout goggles → Goggles_Pink
- YELLOW clout goggles → Goggles_Yellow
- BLUE clout goggles → Goggles
- WHITE clout goggles with black lenses → Clout_Goggles
- BLUE sunglasses with black lenses → Shades_Blue
- YELLOW sunglasses with black lenses → Shades_Yellow
- ORANGE glasses upside down → Upsidedown_Orange
- PURPLE glasses upside down → Upsidedown_Purple
- STAR-shaped gold frames → Star_Glasses
- SKI goggles (gray band, blue frame, orange lens) → Ski_Goggles
- Purple scouter device over one eye → Scouter
- NO glasses + black rectangles under eyes → Football
- NO glasses + asymmetrical mismatched eyes → Curious
- NO glasses + red oval blush marks → Blushing
- NO glasses + one eye closed as < → Winking
- NO glasses + oval eyes WITH horizontal line (squinting) → Mad
- NO glasses + plain solid oval eyes (no line) → Normal

CRITICAL: If the penguin is wearing ANY glasses, you MUST match to one of the glasses traits above. Do NOT return null for face if glasses are visible.

HEAD TRAIT EXAMPLES:

CRITICAL HAT DISTINCTION - LOOK FOR THE IGLOO LOGO:
- "Hat_Red" = A cap with a red base and blue bill, facing to the right WITH AN IGLOO LOGO visible on the front. The igloo is a white building design on the cap.
- "Hat_Blue" = A cap with a blue base and red bill, facing to the right WITH AN IGLOO LOGO visible on the front.
- "Backwards_Hat_Red" = A backwards cap with a red base and blue bill, facing backward with NO IGLOO LOGO visible (plain front, logo is hidden at back)
- "Backwards_Hat_Blue" = A backwards cap with a blue base and red bill, facing backward with NO IGLOO LOGO visible.

THE IGLOO LOGO IS THE KEY:
- If you see a WHITE IGLOO LOGO on the front of the cap → "Hat_Red" or "Hat_Blue"
- If there is NO igloo logo visible (plain cap front) → "Backwards_Hat_Red" or "Backwards_Hat_Blue"
- SIDEWAYS CAP with brim to the side → "Sideways_Blue" or "Sideways_Red"

- "Sideways_Red" = A cap with a red body and blue bill, facing to the LEFT with an igloo logo exposed on the front.
- "Sideways_Blue" = A cap with a blue base and red bill, facing to the LEFT with an igloo logo exposed.
- "Viking_Hat" = A silver and brown viking helmet with two horns on top.
- "Cowboy_Hat" = A brown cowboy hat with a darker brown line around the base of the cap.
- "Crown" → A crown
- "Ice_Crown" = A light blue ice crown with sparkles and a pointy top.
- "Wizard_Hat" = A yellow and blue wizard hat.
- "Pirate_Hat" = A deep dark blue pirate hat with off-whiteish yellow trim, an emblem of an anchor on the front, and feathers sticking out the back.
- "Sombrero" = A brown sombrero with green and red triangles on it.
- "Top_Hat" → A top hat
- "Party_Hat" = A red and green birthday hat with a yellow ball at the top.
- "Santa_Hat" = A white and red Santa Claus hat.
- "Panda_Hat" = A dark blue with tan/off-white hat in the shape of a panda head.
- "Polar_Bear_Hat" = A light, snow white hat in the shape of a polar bear head.
- "Grizzly_Bear_Hat" = A brown hat in the shape of a bear head.
- "Shark_Suit" → A shark costume/suit
- "Banana_Suit" → A banana costume
- "Ghost" = A 1:1 penguin distinguished by its cartoon style pillowcase ghost appearance, and scary halloween-themed background with a castle, bat, and glowing moon.
- "Rice_Hat" = A brown asian conical hat.
- "Fish_Green" = A dark green fish with lime green fins and lips lying on the Pudgy's head.
- "Fish_Blue" = A dark blue fish with light blue fins and lips, laying upon the head of the Pudgy.
- "Fish_Gold" = A totally gold fish with sparkles lying on the head of the pudgy.
- "Fish_Orange" = An orange fish with yellow fins and lips laying on the head of the Pudgy.
- "Mohawk_Green" = A green mohawk.
- "Mohawk_Purple" = A purple mohawk.
- "Afro_with_Pick" = A poofy brown afro with a black hair pick sticking out of it.
- "Hippy_Hair" = Also called "bowl cut". A brunette bowl cut style haircut.
- "Blue_Durag" = A blue durag.
- "Red_Durag" = A red durag.
- "Headband" = A red, white, and blue headband.
- "Ninja_Headband" = A black naruto-style headband with a silver front plate with a "PP" logo on it.
- "Bucket_Hat_Green" = A green-colored bucket hat with a blue fishing lure, a yellow fishing lure, and a red fishing lure hanging off of it.
- "Bucket_Hat_Tan" = A tan bucket hat with a blue fishing lure, a yellow fishing lure, and a red fishing lure attached.
- "Flat_Cap_Black" = A "flat cap" style hat in black/dark gray.
- "Flat_Cap_Blue" = A semi darkish blue "flat cap" style hat.
- "Flat_Cap_Tan" = A dark/light brown "flat cap" style hat.
- "Beanie_Gray" = A gray beanie with a dark gray ball at the top.
- "Beanie_Orange" = An orange beanie with a green ball at the top.
- "Pink_Beanie" = A pink beanie with a blue ball at the top.
- "Egg" = A regular off-white colored bird egg.
- "Egg_Gold" = A golden whole egg with sparkles.
- "Hatched" = A hatched egg with a little red penguin coming out of it.
- "Hatched_Gold" = A gold hatched egg with sparkles and a little gold penguin sticking out the top.
- "Crown" = A golden crown with sparkles and a pointed top.
- "Flower_Crown" = The same as 'Crown' but with pink flowers on it with green leaves.
- "Biker_Helmet" = A brown biker helmet with silver spikes and yellow goggles with blue lenses.
- "Jester_Hat" = A green, blue, and red jester hat with yellow balls at the ends.
- "Top_Hat" = A black top hat.
- "Jester_Hat" → A jester hat
- "Pineapple" → A pineapple on head
- "Macaroni" = Yellow strands of hair/feather fanned out with black stripes. BRIGHT YELLOW strands fanning outward like a sunburst/explosion from the head - NOT a bowlcut, the strands spike OUT in all directions like uncooked macaroni pasta sticking up and out.
- "Biker_Helmet" → A biker/motorcycle helmet
- "Camo_Helmet" = A camouflage army helmet.

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
- "Lei_Blue" = A string of flowers around the neck with blue petals and yellow center.
- "Lei_Purple" = A string of flowers around the neck with purple petals and yellow center.
- "Lei_Pink" = A string of flowers around the neck with pink petals and yellow center.
- "Lei_Assorted" = A string of flowers around the neck with blue, purple, and pink petals with yellow centers.
- "Hoodie_Black" = A black hoodie with a white igloo on the front.
- "Hoodie_Pink" = A pink hoodie with white igloo logo on the front.
- "Puffer_Orange" = An orange sleeveless puffer jacket.
- "Puffer_Blue" = A blue sleeveless puffer jacket.
- "Puffer_Green" = A green sleeveless puffer jacket.
- "Bow_Tie_Blue" = A blue bowtie, secured by a thin blue string around the neck.
- "Bowtie_Black" = A black bowtie, secured by a thin black string around the neck.
- "Bowtie_Pink" = A pink bowtie, secured around the neck by a thin pink string.
- "Turtleneck_Pink" = A pink turtleneck sweater.
- "Turtleneck_Gray" = A gray turtleneck sweater.
- "Turtleneck_Blue" = A blue turtleneck sweater.
- "Turtleneck_Green" = A green turtleneck sweater.
- "Bronze_Medal" = A bronze medal with a red/white/blue band.
- "Silver_Medal" = A silver medal with a red/white/blue band.
- "Gold_Medal" = A gold medal with a red/white/blue band.
- "Hawaiian_Shirt" = A turquoise blue hawaiian shirt with purple palm trees on it.
- "Scarf_Pink" = A dark pink scarf.
- "Scarf_Blue" = A blue scarf.
- "Scarf_Green" = A green scarf.
- "Overalls" = Denim blue overalls with yellow buttons.
- "Poncho" = An orange poncho with tan triangles on it.
- "Surfboard_Necklace" = A blue surfboard pendant on a black string necklace.
- "Christmas_Lights" = A string of red and white christmas lights around the neck.
- "Ice_Coat" = A black akatsuki-style cloak from naruto, with a blue zipper down the center and blue designs on the sleeves.
- "Tribal_Necklace" = A string necklace with big off-white triangles hanging off of it.
- "Heart" = A lone heart on the Pudgy's chest.
- "Crop_Top" = A red croptop-style shirt, exposing the belly. PLAIN with no logo.
- "Biker_Jacket" = A black leather jacket with gray spikes on the shoulders.
- "Swordman" = An orange kimono with black triangles, with the hilt of a sword showing on the back.
- "Suit_Blue" = A black suit with a white button up undershirt and blue bowtie.
- "Suit_Red" = A black suit with a white button up undershirt and red bowtie.
- "Pudgy_Man" = A blue superman-style outfit with a red cape and PM logo on the front.
- "I_Love_Fish" = A white shirt with green collar and green sleeves which reads "I (heart) fish".
- "Big_P" = A black string necklace with a dark brown seashell pendant with a big P on it.
- "Shark_Tooth" = A black string necklace with a single shark tooth pendant.
- "Christmas_Sweater_Red" = A red sweater with white snowflakes.
- "Christmas_Sweater_Blue" = A blue sweater with white snowflakes.
- "The_Huddle" = A pink shirt with "the Huddle" written on the front in dark pink.
- "Tanktop_Yellow" = A yellow tanktop with a blue surfboard on the front.
- "Tanktop_Blue" = A blue tanktop with a white surfboard on the front.
- "Vote_4_Pudgy" = A white shirt with red collar which reads "Vote 4 Pudgy" in red text on the front.
- "Labcoat" = A white labcoat with blue undershirt.
- "Apron" = A green chef's apron which reads "Pudge" in white letters.
- "Shirt_Red" = A maroon t-shirt with a white igloo logo on the front. MUST have visible white logo.
- "Blue_Shirt" = A blue t-shirt with a white igloo logo on the front.
CRITICAL - KIMONO DISTINCTION (LOOK AT THE PATTERN):
- "Kimono_Red" = A solid orange-red kimono with a white stripe around the lapels.
- "Kimono_Orange" = An orange kimono with white triangles on it.
- "Kimono_Brown" = A brown kimono with white strip on the lapels. Similar to Kimono_Red, but darker.
- "Kimono_White" = A white kimono with black triangles on it.
- "Kimono_Blue" = A light blue kimono with blue flowers on it.
- "Kimono_Abstract" = A kimono with an abstract design on it. Solid purple on the right side, and a green/white/dark tan geometric pattern on the left.
- "Kimono_Pink" = A pink Kimono with dark pink flowers.
- "Kimono_Gold" = A gold kimono with sparkles on it.
- "Kimono_Ice" = A blue kimono with sparkles.
KEY: If the kimono is RED with simple WHITE EDGE TRIM → "Kimono_Red". If ORANGE with WHITE TRIANGLE patterns → "Kimono_Orange".
- "Bathrobe" = An off-white bathrobe. Similar to a Kimono, but the two lapels meet together at the bottom of the image to form a 'V' shape, while Kimonos have a completely open front.

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

CRITICAL - GOLD SKIN AND ICE SKIN DETECTION (LIL PUDGY SKIN TYPES):
For Lil Pudgys, look carefully at the skin/body color:

"Gold Skin" (GOLD/YELLOW SKIN):
- The penguin's body, flippers, and head are GOLDEN YELLOW color
- Has WHITE SPARKLE EFFECTS (✨) on the body - small 4-pointed star shapes
- The sparkles appear on the flippers, head, and body areas
- The skin is a bright, warm GOLD/YELLOW color (not blue)
- If sparkles are covered by clothing, still look for the distinctive GOLD YELLOW color of the skin
- REPORT IN "skin" field: "gold skin" or "golden skin"

"Ice Skin" (ICE BLUE SKIN):
- The penguin's body, flippers, and head are LIGHT BLUE/ICY color
- Has WHITE SPARKLE EFFECTS (✨) on the body - small 4-pointed star shapes
- The sparkles appear on the flippers, head, and body areas
- The skin is a cool, light CYAN/ICE BLUE color (not golden)
- If sparkles are covered by clothing, still look for the distinctive ICE BLUE color of the skin
- REPORT IN "skin" field: "ice skin" or "icy skin"

SKIN DETECTION RULES:
- Sparkles (✨) are the EASIEST identifier - if you see white 4-pointed star sparkles on the body, it's Gold or Ice skin
- Gold Skin = YELLOW/GOLD colored body + sparkles
- Ice Skin = LIGHT BLUE/CYAN colored body + sparkles
- Regular Lil = Blue/gray body with NO sparkles

Return ONLY valid JSON in this exact format:
{
  "isPudgy": true/false,
  "isLilPudgy": true/false (true if this is a Lil Pudgy baby penguin, false if Big Pudgy adult penguin),
  "isSpecialPenguin": "left_facing" or null,
  "garmentMatchesSkinColor": true/false (IMPORTANT: Does the garment/clothing appear to be the SAME COLOR as the skin? If gold skin and gold garment = true. If gold skin and cream garment = false),
  "traits": {
    "background": "description or null",
    "skin": "description or null", 
    "body": "EXACT_BODY_TRAIT_NAME_FROM_LIST or null",
    "face": "EXACT_FACE_TRAIT_NAME_FROM_LIST or null (use Lil Pudgy traits if isLilPudgy is true)",
    "head": "EXACT_HEAD_TRAIT_NAME_FROM_LIST or null",
    "right_flipper": "EXACT_RIGHT_FLIPPER_TRAIT_NAME_FROM_LIST or null (Lil Pudgy only - item held in right flipper/hand)",
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
        let jsonString = jsonMatch[0];
        
        // Sanitize common AI mistakes in JSON:
        // 1. Fix unquoted keys (e.g., awesome_bot_confidence: -> "confidence":)
        jsonString = jsonString.replace(/(\n\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, (match, prefix, key) => {
          // Check if this key is already quoted by looking at what comes before
          // Skip if already properly formatted
          if (key === 'isPudgy' || key === 'isLilPudgy' || key === 'isSpecialPenguin' || 
              key === 'garmentMatchesSkinColor' || key === 'traits' || key === 'background' ||
              key === 'skin' || key === 'body' || key === 'face' || key === 'head' || 
              key === 'hand' || key === 'confidence' || key === 'description') {
            return `${prefix}"${key}":`;
          }
          // Replace any weird key with "confidence" if it looks like confidence
          if (key.toLowerCase().includes('confidence')) {
            return `${prefix}"confidence":`;
          }
          return `${prefix}"${key}":`;
        });
        
        // 2. Try to parse the sanitized JSON
        traits = JSON.parse(jsonString);
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
      const isLilPudgy = traits.isLilPudgy === true;
      
      // Check against appropriate list based on penguin type
      const faceTraitList = isLilPudgy ? AVAILABLE_LIL_FACE_TRAITS : AVAILABLE_FACE_TRAITS;
      const allFaceTraits = [...AVAILABLE_FACE_TRAITS, ...AVAILABLE_LIL_FACE_TRAITS];
      
      // First check if it's in the appropriate list
      if (faceTraitList.includes(faceTrait)) {
        // Valid trait for this penguin type, keep it
        console.log(`Valid ${isLilPudgy ? 'Lil' : 'Big'} face trait: ${faceTrait}`);
      } else if (allFaceTraits.includes(faceTrait)) {
        // Valid trait but for the other penguin type - still keep it
        console.log(`Face trait "${faceTrait}" is for ${isLilPudgy ? 'Big' : 'Lil'} Pudgy but keeping it`);
      } else {
        console.log(`Face trait "${faceTrait}" not in available list, attempting to match...`);
        // Try to find a close match in the combined list
        const normalizedInput = faceTrait.toLowerCase().replace(/[\s-]/g, '_');
        const match = allFaceTraits.find(t => 
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

    // Validate and normalize the right_flipper trait (Lil Pudgy only)
    if (traits.traits?.right_flipper && typeof traits.traits.right_flipper === 'string') {
      const rightFlipperTrait = traits.traits.right_flipper;
      // Check if it's a valid trait
      if (!AVAILABLE_LIL_RIGHT_FLIPPER_TRAITS.includes(rightFlipperTrait)) {
        console.log(`Right flipper trait "${rightFlipperTrait}" not in available list, attempting to match...`);
        // Try to find a close match
        const normalizedInput = rightFlipperTrait.toLowerCase().replace(/[\s-]/g, '_');
        const match = AVAILABLE_LIL_RIGHT_FLIPPER_TRAITS.find(t => 
          t.toLowerCase() === normalizedInput ||
          t.toLowerCase().includes(normalizedInput) ||
          normalizedInput.includes(t.toLowerCase())
        );
        if (match) {
          console.log(`Matched right flipper to: ${match}`);
          traits.traits.right_flipper = match;
        } else {
          console.log(`No match found for right flipper trait "${rightFlipperTrait}", setting to null`);
          traits.traits.right_flipper = null;
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
        right_flipper: null,
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

    // FIX CONTRADICTION: If isLilPudgy is true, isPudgy must also be true
    // The AI sometimes returns isPudgy: false but isLilPudgy: true which is illogical
    if (traits.isLilPudgy === true && traits.isPudgy === false) {
      console.log('POST-PROCESSING: Fixed contradiction - isLilPudgy=true implies isPudgy=true');
      traits.isPudgy = true;
    }

    // Add metadata about available traits for the frontend
    traits.availableHeadTraits = AVAILABLE_HEAD_TRAITS;
    traits.availableFaceTraits = AVAILABLE_FACE_TRAITS;
    traits.availableBodyTraits = AVAILABLE_BODY_TRAITS;
    traits.availableLilRightFlipperTraits = AVAILABLE_LIL_RIGHT_FLIPPER_TRAITS;

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
