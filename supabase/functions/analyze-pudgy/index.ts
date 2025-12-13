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

// Available head trait overlays for Lil Pudgys - these must match exactly to the file names
const AVAILABLE_LIL_HEAD_TRAITS = [
  "Afro",
  "Afro_Gold_Pick",
  "Backwards_Blue",
  "Backwards_Green",
  "Backwards_Hat_Black",
  "Backwards_Red",
  "Beanie_Black",
  "Beanie_Blue",
  "Beanie_Gray",
  "Beanie_Orange",
  "Beanie_Pink",
  "Beanie_Tan",
  "Beanie_White",
  "Biker_Helmet",
  "Biker_Helmet_Black",
  "Blue_Durag",
  "Bow_Blue",
  "Bow_Purple",
  "Bow_Red",
  "Bowl_Cut",
  "Bowl_Cut_Blonde",
  "Bowl_Cut_Red",
  "Bucket_Hat_Black",
  "Bucket_Hat_Blue",
  "Bucket_Hat_Green",
  "Bucket_Hat_Red",
  "Bucket_Hat_Tan",
  "Chefs_Hat",
  "Construction_Helmet",
  "Cowboy_Hat",
  "Cowboy_Hat_Tall",
  "Crown",
  "Durag_Leopard",
  "Durag_Purple",
  "Ear_Muffs",
  "Egg_Shell",
  "Egg_Shell_Gold",
  "Elf_Hat",
  "Fireman_Helmet",
  "Fish_Black",
  "Fish_Blue",
  "Fish_Gold",
  "Fish_Gray",
  "Fish_Green",
  "Fish_Orange",
  "Fish_Red",
  "Flat_Cap_Black",
  "Flat_Cap_Blue",
  "Flat_Cap_Green",
  "Flat_Cap_Tan",
  "Flower_Blue",
  "Flower_Crown",
  "Flower_Pink",
  "Flower_Purple",
  "Flower_Red",
  "Flower_White",
  "Flower_Yellow",
  "Grizzly_Bear_Hat",
  "Hammerhead",
  "Hat_Black",
  "Hat_Blue",
  "Hat_Green",
  "Hat_Red",
  "Headband",
  "Headphones_Blue",
  "Headphones_Gold",
  "Ice_Crown",
  "Jester_Hat",
  "Kite_Red",
  "Leaf_Crown",
  "Leaf_Crown_Gold",
  "Lucky_Hat",
  "Macaroni",
  "Mohawk_Green",
  "Mohawk_Orange",
  "Mohawk_Purple",
  "Mohawk_Red",
  "Ninja_Headband",
  "Panda_Hat",
  "Party_Hat",
  "Party_Hat_Orange",
  "Party_Hat_Purple",
  "Pirate_Hat",
  "Polar_Bear_Hat",
  "Red_Durag",
  "Rice_Hat",
  "Sailors_Cap",
  "Santa_Hat",
  "Shark",
  "Shark_Albino",
  "Sideways_Black",
  "Sideways_Blue",
  "Sideways_Green",
  "Sideways_Red",
  "Sombrero",
  "Sombrero_Black",
  "Top_Hat_Black",
  "Top_Hat_Gold",
  "Top_Hat_Gold_Tall",
  "Top_Hat_Tall",
  "Viking_Helmet",
  "Viking_Helmet_Black",
  "Visor_Blue",
  "Visor_Green",
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

// Available Lil left flipper trait overlays - these must match exactly to the file names
const AVAILABLE_LIL_LEFT_FLIPPER_TRAITS = [
  "Maracas",
  "Kite_Blue",
  "Star_Wand",
  "Juice_Box",
  "Turkey_Leg",
  "Ukulele",
  "Surfboard_Yellow",
  "Sword_Gold",
  "Spoon_Gold",
  "Balloon_Sword_Red",
  "Balloon_Green",
  "Butterfly_Net",
  "Golf_Club",
  "Spoon",
  "Kite_Gold",
  "Balloon_Gold",
  "Staff_Ice",
  "Sword_Ice",
  "Candycane_Red",
  "Candycane_Green",
  "Rubber_Duck",
  "Stick",
  "Balloon_Red",
  "Ice_Cream",
  "Lollipop",
  "Chop_Sticks",
  "Popsicle"
];

// Available Lil body trait overlays - these must match exactly to the file names
const AVAILABLE_LIL_BODY_TRAITS = [
  "Apron",
  "Basketball_Jersey_Black",
  "Basketball_Jersey_Blue",
  "Basketball_Jersey_Pink",
  "Bib_Pengu",
  "Bib_Pudgy",
  "Big_P",
  "Birthmark",
  "Black_Belt",
  "Bow_Tie_Black",
  "Bow_Tie_Blue",
  "Bow_Tie_Pink",
  "Bronze_Medal",
  "Caveman",
  "Christmas_Lights",
  "Christmas_Sweater_Blue",
  "Christmas_Sweater_Green",
  "Christmas_Sweater_Purple",
  "Christmas_Sweater_Red",
  "Christmas_Sweater_Tan",
  "Electric_Coat",
  "Ice_Coat",
  "Fish_Lover",
  "Fish_Lover_Blue",
  "Flannel_Blue",
  "Flannel_Green",
  "Flannel_Pink",
  "Flannel_Red",
  "Football_Jersey_Green",
  "Football_Jersey_Navy",
  "Football_Jersey_Purple",
  "Football_Jersey_Red",
  "Gold_Chain",
  "Gold_Medal",
  "Hawaiian_Shirt",
  "Hawaiian_Shirt_Flower",
  "Hoodie_Black",
  "Hoodie_GM",
  "Hoodie_Orange",
  "Hoodie_Pink",
  "Hoodie_Purple",
  "Hoodie_Red",
  "Huddle",
  "Huddle_Lime",
  "Hula_Coconut",
  "Hula_Green",
  "Hula_Tan",
  "Kimono_Abstract",
  "Kimono_Black",
  "Kimono_Blue",
  "Kimono_Brown",
  "Kimono_Flower_Pink",
  "Kimono_Flower_Purple",
  "Kimono_Gold",
  "Kimono_Gray",
  "Kimono_Ice",
  "Kimono_Orange",
  "Kimono_Red",
  "Kimono_White",
  "Kings_Robe_Blue",
  "Kings_Robe_Red",
  "Lei_Assorted",
  "Lei_Blue",
  "Lei_Pink",
  "Lei_Purple",
  "Overalls",
  "PJs_Dots_Blue",
  "PJs_Dots_Orange",
  "PJs_Dots_Purple",
  "PJs_Dots_Yellow",
  "PJs_Stripes_Christmas",
  "PJs_Stripes_Lime",
  "PJs_Stripes_Maroon",
  "PJs_Stripes_Pink",
  "Poncho_Black",
  "Poncho_Blue",
  "Poncho_Pink",
  "Pudgy_Boy_Green",
  "Pudgy_Boy_Purple",
  "Pudgy_Boy_White",
  "Puffer_Black",
  "Puffer_Blue",
  "Puffer_Green",
  "Puffer_Orange",
  "Puffer_Red",
  "Red_Belt",
  "Scarf_Blue",
  "Scarf_Gray",
  "Scarf_Green",
  "Scarf_Pink",
  "Scarf_Purple",
  "Sharktooth_Necklace",
  "Shirt_Black",
  "Shirt_Blue",
  "Shirt_Green",
  "Shirt_Red",
  "Silver_Chain",
  "Silver_Medal",
  "Small_T_Blue",
  "Small_T_Red",
  "Small_T_White",
  "Suit_Black",
  "Suit_Blue",
  "Suit_Red",
  "Suit_White",
  "Surfboard_Necklace",
  "Tank_Top_Blue",
  "Tank_Top_Red",
  "Tank_Top_White",
  "Tank_Top_Yellow",
  "Toga",
  "Toolbelt",
  "Tribal_Necklace",
  "Tube_Black",
  "Tube_Blue",
  "Tube_Dino_Blue",
  "Tube_Dino_Green",
  "Tube_Dino_Orange",
  "Tube_Donut",
  "Tube_Flamingo",
  "Tube_Orange",
  "Tube_Pink",
  "Tube_Swan",
  "Tube_Unicorn",
  "Tube_Yellow",
  "Turtleneck_Blue",
  "Turtleneck_Gray",
  "Turtleneck_Green",
  "Turtleneck_Pink",
  "Vote_4_Pudgy",
  "White_Belt",
  "Yellow_Belt"
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

    // Only include trait lists relevant to the expected mode
    const isLilMode = expectedMode === 'lil';
    const isBigMode = expectedMode === 'big';
    
    // Head traits - mode specific
    const headTraitsList = isBigMode ? AVAILABLE_HEAD_TRAITS.join(", ") : 
                           isLilMode ? AVAILABLE_LIL_HEAD_TRAITS.join(", ") : 
                           [...AVAILABLE_HEAD_TRAITS, ...AVAILABLE_LIL_HEAD_TRAITS].join(", ");
    
    // Face traits - mode specific
    const faceTraitsList = isBigMode ? AVAILABLE_FACE_TRAITS.join(", ") : 
                           isLilMode ? AVAILABLE_LIL_FACE_TRAITS.join(", ") : 
                           [...AVAILABLE_FACE_TRAITS, ...AVAILABLE_LIL_FACE_TRAITS].join(", ");
    
    // Body traits - mode specific
    const bodyTraitsList = isBigMode ? AVAILABLE_BODY_TRAITS.join(", ") : 
                           isLilMode ? AVAILABLE_LIL_BODY_TRAITS.join(", ") : 
                           [...AVAILABLE_BODY_TRAITS, ...AVAILABLE_LIL_BODY_TRAITS].join(", ");
    
    // Flipper traits (Lil only)
    const lilRightFlipperTraitsList = AVAILABLE_LIL_RIGHT_FLIPPER_TRAITS.join(", ");
    const lilLeftFlipperTraitsList = AVAILABLE_LIL_LEFT_FLIPPER_TRAITS.join(", ");

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
- EXACT COLOR: #77D1F6 - a BRIGHT CYAN/TURQUOISE color
- This is a LIGHT, BRIGHT, SATURATED CYAN - like turquoise or aqua
- The flippers and body are THIS specific cyan color (#77D1F6)
- NOT the standard dark blue of normal Lils - Ice skin is MUCH BRIGHTER and more CYAN
- Ice skin looks like frozen water or ice - bright turquoise/aqua
- Sparkles: WHITE 4-pointed star sparkles (✨) may also be visible
- If body/flippers are BRIGHT CYAN/TURQUOISE (#77D1F6) → "ice skin"

NORMAL (report "skin": "Normal"):
- Color: DARK BLUE or BLUE-GRAY body (the typical Lil Pudgy blue)
- Standard Lil blue is DARKER, more MUTED, closer to navy or slate
- NO sparkles visible
- If the body is DARK/NAVY BLUE → "Normal"

*** CRITICAL ICE VS NORMAL DISTINCTION ***
Look at the FLIPPER/BODY color:
- NORMAL = Dark blue, muted, like navy blue or slate blue
- ICE = Light cyan, bright, like aqua or turquoise or teal

The Ice Skin Lil in front of you has CYAN/AQUA colored flippers and body - NOT dark blue.
If the flippers look LIGHT BLUE/CYAN/AQUA/TEAL → Report "ice skin"
If the flippers look DARK BLUE/NAVY → Report "Normal"

DECISION:
- Cyan/aqua/teal/light blue body → "ice skin"
- Bright golden yellow body → "gold skin"
- Dark blue/navy body → "Normal"




IMPORTANT: For the "head" trait, you MUST return one of these EXACT values (or null if no head trait):
${headTraitsList}

IMPORTANT: For the "face" trait, you MUST return one of these EXACT values (or null if no face trait):
${faceTraitsList}

IMPORTANT: For the "body" trait, you MUST return one of these EXACT values (or null if no body trait):
${bodyTraitsList}

IMPORTANT: For the "right_flipper" trait (LIL PUDGY ONLY), you MUST return one of these EXACT values (or null if no right flipper trait):
${lilRightFlipperTraitsList}

IMPORTANT: For the "left_flipper" trait (LIL PUDGY ONLY), you MUST return one of these EXACT values (or null if no left flipper trait):
${lilLeftFlipperTraitsList}

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

LEFT FLIPPER TRAITS (LIL PUDGY ONLY):
Left flipper traits appear in the Lil's LEFT HAND (which appears on the RIGHT side of the image from our viewing perspective, since the Lil faces us).
- "Maracas" = A maraca with a GREEN, RED, and YELLOW zigzag pattern on a wooden handle
- "Kite_Blue" = A BLUE kite with a triangle pattern in varying shades of blue, with a blue ribbon hanging off of it, and white/blue bows on the kite string
- "Star_Wand" = A wand with a RED and WHITE striped handle and YELLOW star on top
- "Juice_Box" = A BLUE box of juice with a GREEN straw
- "Turkey_Leg" = A BROWN turkey leg with WHITE bone
- "Ukulele" = A BROWN ukulele guitar with a BLACK neck
- "Surfboard_Yellow" = A YELLOW surfboard held upright
- "Sword_Gold" = A GOLD sword with pointed blade and gem in the hilt
- "Spoon_Gold" = A GOLDEN spoon with sparkle effect
- "Balloon_Sword_Red" = A RED balloon sword shaped like a sword
- "Balloon_Green" = A GREEN balloon on a string
- "Butterfly_Net" = A BROWN butterfly net
- "Golf_Club" = A GRAY golf club
- "Spoon" = A GRAY spoon
- "Kite_Gold" = A YELLOW/GOLD kite with a triangular pattern in varying shades of gold, with a yellow ribbon hanging off of it, and two bows on the kite string
- "Balloon_Gold" = A GOLDEN balloon with sparkle
- "Staff_Ice" = A BROWN hand staff with a BLUE detail at the top
- "Sword_Ice" = A BLUE sword
- "Candycane_Red" = A RED and WHITE striped candy cane
- "Candycane_Green" = A GREEN and WHITE striped candy cane
- "Rubber_Duck" = A YELLOW rubber duck
- "Stick" = A BROWN stick
- "Balloon_Red" = A RED balloon on a string
- "Ice_Cream" = A tall ice cream cone with scoops of WHITE, BROWN, and PINK ice cream
- "Lollipop" = A large PINK and YELLOW lollipop
- "Chop_Sticks" = A pair of two BROWN chopsticks
- "Popsicle" = A large ORANGE popsicle

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
IMPORTANT: The user expects this to be a Lil Pudgy. Focus on analyzing Lil Pudgy traits from the trait lists provided above.
If the image shows a full-body penguin with feet visible, this is definitely a Lil Pudgy.
` : expectedMode === 'big' ? `
IMPORTANT: The user expects this to be a Big Pudgy. Focus on analyzing Big Pudgy traits from the trait lists provided above.
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

"Aviators" (BLACK AVIATOR GLASSES WITH TEARDROP SHAPE AND FRAMES):
- Has visible BLACK METAL FRAMES around the lenses
- Lenses are TEARDROP-SHAPED (rounded at bottom, narrower at top)
- Lenses are BLACK on top, fading to LIGHT BLUE toward the bottom (GRADIENT)
- Classic aviator style with CURVED rounded edges
- CRITICAL: Aviators have VISIBLE FRAMES and ROUNDED teardrop shape

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

"Squad" (BLACK FRAMELESS TRIANGULAR GLASSES - COMPLETELY DIFFERENT FROM AVIATORS):
- COMPLETELY FRAMELESS - NO visible frame around the lenses
- Lenses are SHARP ANGULAR TRIANGLES (NOT rounded, NOT teardrop)
- Appears as TWO BLACK TRIANGLES joined together at the bridge of the nose
- The triangles have STRAIGHT EDGES and SHARP CORNERS
- WHITE REFLECT/GLARE visible on the black lenses
- CRITICAL DISTINCTION FROM AVIATORS:
  * Squad = TRIANGULAR shape, FRAMELESS, SHARP edges
  * Aviators = TEARDROP shape, HAS FRAMES, ROUNDED edges
- If you see angular/triangular black lenses with no frame → Squad
- If you see rounded teardrop lenses with visible frame → Aviators

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

"Curious" (ASYMMETRICAL EYES - DIFFERENT SHAPES):
- NO glasses
- NO red blush marks on cheeks
- Eyes are TWO DIFFERENT SHAPES (not just different sizes):
- RIGHT eye (left side of image from viewer): An IRREGULARLY SHAPED OVAL - elongated, slightly tilted
- LEFT eye (right side of image from viewer): A ROUNDED TRIANGLE shape - pointed at bottom, rounded at top
- The two eyes are COMPLETELY DIFFERENT SHAPES from each other
- Both eyes are solid BLACK - no red marks anywhere
- CRITICAL: Different EYE SHAPES (oval + triangle) → Curious
- CRITICAL: NO red marks on face → Curious (Blushing has RED cheek marks)

"Blushing" (RED OVAL BLUSH MARKS ON CHEEKS):
- NO glasses
- Has TWO RED OVALS on the CHEEKS (below/beside the eyes)
- The red marks are BLUSH MARKS - they are RED colored, not black
- Eyes themselves are normal black ovals
- CRITICAL: If you see RED MARKS on cheeks → Blushing
- CRITICAL: If NO red marks and eyes are different shapes → Curious (not Blushing)

"Mad" (ANGRY/SQUINTING EXPRESSION WITH HORIZONTAL LINE):
- NO glasses
- OVAL-SHAPED eyes with a HORIZONTAL LINE cutting through the UPPER HALF
- This horizontal line gives the appearance of SQUINTING or ANGRY eyes
- CRITICAL: The line makes the eyes look half-closed or narrowed in anger
- In your natural-language description, explicitly mention that the eyes look "angry", "mad", or "squinting" whenever you choose this trait.

"Winking" (ONE EYE OPEN, ONE EYE CLOSED AS < SHAPE):
- NO glasses
- RIGHT eye (left side of image): Regular OVAL BLACK eye, open
- LEFT eye (right side of image): CLOSED, depicted as a < shape (sideways V)
- CRITICAL: One oval eye open + one < shaped closed eye = Winking

"Cross_Eyed" (TINY CIRCULAR BEADY EYES CLOSE TOGETHER - NO OVALS):
- NO glasses
- TWO SMALL, PERFECTLY CIRCULAR BLACK DOTS (NOT ovals)
- The dots are positioned VERY CLOSE TOGETHER near the center of the face
- Much smaller and rounder than Normal eyes
- NO eyelid line, NO white highlights, just solid black circles
- IMPORTANT: On Lil Pudgys this trait is drawn as simple beady circular eyes; they do NOT visibly "cross"
- CRITICAL: If you see TINY CIRCULAR beady dots instead of oval eyes → choose Cross_Eyed, NEVER Normal

"Normal" - THIS IS ACTUALLY THE BASE/DEFAULT LIL EYES AND SHOULD BE face: null:
- NO glasses
- TWO OVAL-SHAPED BLACK EYES with WHITE HIGHLIGHTS/SHINE inside each eye
- Eyes are larger and clearly OVAL shaped
- Eyes have TWO SMALL WHITE CIRCLES inside each black oval (shine/reflection)
- CRITICAL: If you see BASE LIL EYES (black ovals with white shine dots inside), this is the DEFAULT appearance and should be face: null, NOT "Normal"
- The "Normal" trait should ONLY be used if the eyes are solid black ovals with NO white highlights
- CRITICAL: Base Lil eyes with white highlights = face: null (no face trait)

DECISION RULES (MUST PICK ONE - NEVER return null if glasses are visible):
- RED frames + RED NOSE + WHITE MUSTACHE → Goofy_Glasses
- RED rectangular frames + WHITE BANDAGE (no nose/mustache) → Nerd_Normal
- TAN rectangular frames + WHITE BANDAGE + open eyes → Nerd_Cute
- TAN rectangular frames + WHITE BANDAGE + closed happy eyes + blush → Nerd_Blushing
- BLUE circular frames + big glistening eyes (white dots) → Reading_Cute
- BLUE circular frames + crossed eye dots → Reading_Cross_eyed
- BLACK circular frames + thin + black lenses → Circle_Glasses
- BLACK circular frames + light blue lenses → Reading_Normal
- BLACK TEARDROP-shaped glasses WITH visible frames + gradient lenses → Aviators
- BLACK TRIANGULAR-shaped glasses WITHOUT frames (frameless angular triangles) → Squad
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
- NO glasses + asymmetrical mismatched eyes (oval + rounded triangle) with eyebrows and NO internal horizontal line → Curious
- NO glasses + red oval blush marks → Blushing
- NO glasses + one eye closed as < → Winking
- NO glasses + oval eyes WITH horizontal line (squinting) → Mad
- NO glasses + TWO TINY, PERFECTLY CIRCULAR BLACK DOTS close together near center → Cross_Eyed
- NO glasses + BLACK OVAL EYES WITH WHITE HIGHLIGHTS/SHINE inside (base default eyes) → face: null (NO face trait)
- NO glasses + SOLID black ovals with NO white highlights (uncommon) → Normal

FINAL LIL NO-GLASSES RULES (NO GLASSES VISIBLE):
- If eyes have ANY horizontal line cutting through them → face = "Mad" (NEVER Curious)
- If eyes are TWO DIFFERENT SHAPES (oval + triangle) with eyebrows and NO internal line → face = "Curious" (NEVER Mad)
- If eyes are TINY CIRCULAR BEADY DOTS close together → face = "Cross_Eyed" (not Normal)
- If eyes are BLACK OVALS WITH WHITE SHINE/HIGHLIGHTS inside → face = null (base default, no trait)
- ONLY if eyes are solid black ovals with NO white highlights → face = "Normal"

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
- "Blue_Durag" = A solid blue durag (head wrap).
- "Red_Durag" = A solid red durag (head wrap).
- "Durag_Leopard" = A TAN/BROWN durag with BLACK LEOPARD PRINT SPOTS. The fabric is tan/brown colored with black leopard spots pattern. NOT solid colored like Blue or Red durags.
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

LIL HEAD TRAIT EXAMPLES:
- "Bucket_Hat_Red" = A RED bucket hat with a blue fishing lure, a red fishing lure, and a yellow fishing lure on it.
- "Bucket_Hat_Blue" = A BLUE bucket hat with a blue fishing lure, a red fishing lure, and a yellow fishing lure on it.
- "Bucket_Hat_Green" = A GREEN bucket hat with a blue fishing lure, a yellow fishing lure, and a red fishing lure on it.
- "Bucket_Hat_Tan" = A BROWN bucket hat with a blue fishing lure, a yellow fishing lure, and a red fishing lure on it.
- "Bucket_Hat_Black" = A BLACK bucket hat with white igloo logo.
- "Sideways_Black" = A BLACK cap with a white igloo logo on it, facing to the LEFT.
- "Sideways_Blue" = A BLUE cap with a red bill and white igloo logo, facing to the LEFT.
- "Sideways_Red" = A RED cap with a blue bill and white igloo logo, facing to the LEFT.
- "Sideways_Green" = A GREEN cap with a red bill, with white igloo logo on it, facing to the LEFT.
- "Hat_Black" = A normal BLACK cap with a white igloo logo on the front, facing to the RIGHT.
- "Hat_Blue" = A BLUE cap with a red bill, with a white igloo logo on the front, facing to the RIGHT.
- "Hat_Red" = A RED cap with blue bill with white igloo logo, facing to the RIGHT.
- "Hat_Green" = A GREEN cap with red bill and white igloo logo on it, facing RIGHT.
- "Backwards_Blue" = A BLUE cap with a red bill, facing BACKWARDS.
- "Backwards_Red" = A RED cap with a blue bill, facing BACKWARD.
- "Backwards_Green" = A GREEN cap with a red bill, facing BACKWARDS.
- "Backwards_Hat_Black" = A standard BLACK ballcap, facing BACKWARD.
- "Leaf_Crown_Gold" = A GOLDEN "crown" composed ONLY of gold leaf shapes on the head, with some sparkles. NO pink flowers, NO colored petals.
- "Leaf_Crown" = A "crown" of GREEN leaves on the head. NO gold metal structure, just green leaf shapes.
- "Durag_Purple" = A PURPLE durag. Features both dark and lighter purple.
- "Durag_Leopard" = A BROWN durag with BLACK leopard spots.
- "Blue_Durag" = A BLUE durag.
- "Red_Durag" = A RED Durag.
- "Construction_Helmet" = A YELLOW construction helmet.
- "Chefs_Hat" = A WHITE chefs hat.
- "Santa_Hat" = A white and red Santa hat.
- "Polar_Bear_Hat" = A WHITE hat in the shape of a polar bear head.
- "Grizzly_Bear_Hat" = A BROWN hat in the shape of a grizzly bear head.
- "Panda_Hat" = A blue and off-white hat in the shape of a panda head.
- "Flower_White" = A single WHITE flower on the head with a yellow center.
- "Flower_Yellow" = A single YELLOW flower on the head.
- "Flower_Pink" = A single PINK flower on the head with yellow center.
- "Flower_Red" = A single RED flower with yellow center on the head.
- "Flower_Purple" = A single PURPLE flower on the head with yellow center.
- "Flower_Blue" = A single BLUE flower on the head with yellow center.
- "Flower_Crown" = A golden crown with a pointy top, with sparkle and a ROW OF PINK FLOWERS with GREEN LEAVES in the center.

HEAD CROWN DECISION RULES:
- If you see ANY PINK FLOWERS or GREEN LEAVES decorating a gold crown band → head = "Flower_Crown" (NOT Leaf_Crown_Gold).
- If the crown is ONLY GOLD LEAF SHAPES (no pink petals, no colored flowers) → head = "Leaf_Crown_Gold".
- If the crown is made only of GREEN leaves (no gold metal band) → head = "Leaf_Crown".
- "Top_Hat_Black" = A standard BLACK top hat of normal height.
- "Shark_Albino" = A LIGHT GRAY shark on the head with RED EYES.
- "Shark" = A BLUE shark on the head.
- "Cowboy_Hat_Tall" = An abnormally TALL cowboy hat. Brown with a yellowish band around the base.
- "Cowboy_Hat" = A BROWN cowboy hat with an orangish band at the base.
- "Visor_Blue" = A BLUE visor-style hat.
- "Visor_Green" = A GREEN visor-style hat.
- "Bow_Red" = A single RED bow on the forehead.
- "Bow_Blue" = A single BLUE bow on the forehead.
- "Bow_Purple" = A single PURPLE bow on the forehead.
- "Headphones_Blue" = A BLUE set of headphones on the head.
- "Headphones_Gold" = A GOLD pair of headphones with sparkle.
- "Beanie_White" = A WHITE beanie that says "Pudgy" in blue text on the front.
- "Beanie_Blue" = A BLUE beanie with a green ball on the end.
- "Beanie_Gray" = A GRAY beanie, with a dark gray ball on the end of it.
- "Beanie_Pink" = A PINK beanie with blue ball on top.
- "Beanie_Orange" = An ORANGE beanie with green ball on top.
- "Beanie_Tan" = A BROWN beanie with red ball on top.
- "Beanie_Black" = A BLACK beanie with white igloo logo and black ball on top.
- "Egg_Shell" = One half of a broken eggshell on the head. Pale off-white color.
- "Egg_Shell_Gold" = A half of a broken egg shell, GOLD with sparkle.
- "Flat_Cap_Blue" = A flat-cap style hat, lightish gray-blue in color.
- "Flat_Cap_Black" = A flat cap style hat which is dark gray/black in color.
- "Flat_Cap_Tan" = A BROWN flat-cap style hat.
- "Flat_Cap_Green" = A GREEN flat cap style hat.
- "Bowl_Cut" = A BRUNETTE bowlcut style hair cut.
- "Bowl_Cut_Blonde" = A YELLOW BLONDE bowlcut style haircut.
- "Bowl_Cut_Red" = An ORANGE bowl cut style haircut.
- "Sombrero" = A BROWN sombrero style hat with red and green triangle design on it.
- "Sombrero_Black" = A sombrero hat, BLACK in color, with a red and green triangle pattern on it.
- "Lucky_Hat" = A GREEN leprechaun top hat with a clover on it.
- "Jester_Hat" = A red, green, and blue jester hat with yellow balls on the ends.
- "Ninja_Headband" = A BLACK, naruto style ninja headband with a gray rectangular plate on the front.
- "Elf_Hat" = A GREEN elf hat with a red base, and yellow ball at the end.
- "Mohawk_Red" = A RED Mohawk.
- "Mohawk_Orange" = An ORANGE mohawk. Should be differentiated from Red Mohawk based on the color.
- "Mohawk_Green" = A GREEN mohawk.
- "Mohawk_Purple" = A PURPLE mohawk.
- "Fireman_Helmet" = A RED fireman helmet with a yellow plaque on the front.
- "Biker_Helmet" = A BROWN biker helmet with silver spikes on the top, and a pair of goggles with yellow frames and blue lenses.
- "Biker_Helmet_Black" = A BLACK biker helmet with gold spikes and yellow framed goggles with blue lenses.
- "Viking_Helmet" = A BROWN viking helmet with gray trim and two horns on top.
- "Viking_Helmet_Black" = A BLACK helmet with silver trim and a pair of horns on it.
- "Fish_Black" = A DARK GRAY/BLACK fish laying on the head with GRAY fins and lips. The body is darker than Fish_Gray.
- "Fish_Gray" = A LIGHT GRAY fish laying on the head with LIGHTER GRAY fins and lips. The body is lighter than Fish_Black.
- "Fish_Blue" = A BLUE fish laying on the head.
- "Fish_Green" = A GREEN fish laying on the head.
- "Fish_Gold" = A GOLDEN fish on the head with sparkle.
- "Fish_Orange" = An ORANGE fish on the head with yellow fins and lips.
- "Fish_Red" = A RED fish with very light lips and fins.
- "Crown" = A golden crown with spiked points and sparkle. Can be differentiated from Flower_Crown because it has no flowers.
- "Ice_Crown" = A BLUE crown with sparkle and pointy top.
- "Rice_Hat" = A BROWN asian conical hat.
- "Hammerhead" = A BROWN hammerhead shark on the head.
- "Wizard_Hat" = A BLUE wizard hat with yellow stars on it.
- "Pirate_Hat" = A dark blue pirate hat with pale yellow trim, feathers, and an anchor logo on the front.
- "Afro" = A brown afro with a BLACK hairpick sticking out.
- "Afro_Gold_Pick" = A brown afro with a GOLD hairpick sticking out of it.
- "Macaroni" = Fanned out yellow hairs with black accent.
- "Headband" = A red, white, and blue headband.
- "Ear_Muffs" = Very light blue ear muffs.
- "Sailors_Cap" = A WHITE sailor cap with blue accent stripes and blue anchor logo.

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
- "Lei_Blue" = A string of BLUE flowers around the neck with yellow centers.
- "Lei_Purple" = A string of PURPLE flowers around the neck with yellow centers.
- "Lei_Pink" = A string of PINK flowers with yellow centers around the neck.
- "Lei_Assorted" = A single string of PINK, PURPLE, and BLUE flowers around the neck with yellow centers.
- "Hoodie_Black" = A BLACK hoodie with WHITE igloo logo on the front.
- "Hoodie_Pink" = A PINK hoodie with WHITE igloo logo on the front.
- "Hoodie_Red" = A RED hoodie with white igloo logo on the front.
- "Hoodie_GM" = A BLUE hoodie with ORANGE burst coloration in the center, with "GM" written on the front in BLACK.
- "Hoodie_Orange" = An ORANGE hoodie with WHITE igloo logo on the front.
- "Hoodie_Purple" = A PURPLE hoodie with WHITE igloo logo on the front.
- "Puffer_Orange" = An ORANGE sleeveless puffer jacket. Distinguished from Puffer_Red by its orange color.
- "Puffer_Blue" = A BLUE sleeveless puffer jacket.
- "Puffer_Green" = A GREEN sleeveless puffer jacket.
- "Puffer_Black" = A BLACK sleeveless puffer jacket.
- "Puffer_Red" = A RED sleeveless puffer jacket. Distinguished from Puffer_Orange by its red color.
- "Bow_Tie_Blue" = A single BLUE bowtie on a blue string collar.
- "Bow_Tie_Black" = A BLACK bowtie around the neck.
- "Bow_Tie_Pink" = A PINK bow tie on a pink string/band.
- "Turtleneck_Gray" = A GRAY turtleneck style sweater.
- "Turtleneck_Blue" = A BLUE turtleneck sweater.
- "Turtleneck_Green" = A GREEN turtleneck sweater.
- "Turtleneck_Pink" = A PINK turtleneck sweater.
- "Bronze_Medal" = A BRONZE medal on a red, white, and blue necklace/band.
- "Silver_Medal" = A SILVER medal on a red, white, and blue band.
- "Gold_Medal" = A GOLD medal on a red, white, and blue band.
- "Hawaiian_Shirt" = A BLUE/TEAL hawaiian shirt with PURPLE palm trees on it.
- "Hawaiian_Shirt_Flower" = A BLUE hawaiian shirt with some lighter BLUE FLOWERS on it.
- "Scarf_Pink" = A PINK scarf.
- "Scarf_Blue" = A BLUE scarf.
- "Scarf_Green" = A GREEN scarf.
- "Scarf_Gray" = A GRAY scarf.
- "Scarf_Purple" = A PURPLE scarf.
- "Overalls" = BLUE overalls with YELLOW buttons.
- "Poncho_Black" = A BLACK poncho with large SILVER triangle design on it.
- "Poncho_Blue" = A BLUE poncho with large YELLOW triangle design on it.
- "Poncho_Pink" = A light PINK poncho with darker pink large triangle design on it.
- "Surfboard_Necklace" = A BLACK string necklace with a BLUE surfboard pendant on it.
- "Christmas_Lights" = A string of RED and WHITE christmas lights around the neck.
- "Ice_Coat" = A BLACK akatsuki-style cloak with BLUE details and BLUE zipper down the center.
- "Electric_Coat" = A BLACK akatsuki-style cloak with YELLOW designs on it and YELLOW zipper down the center. This coat is ALWAYS black with yellow details; if the garment is WHITE with a BLACK triangle pattern, that is NEVER "Electric_Coat" and should instead be classified as "Kimono_White".
- "Tribal_Necklace" = A BLACK string necklace with multiple OFF-WHITE triangle shapes hanging off of it.
- "Heart" = A lone heart on the Pudgy's chest.
- "Birthmark" = A single RED HEART on the belly.
- "Crop_Top" = A red croptop-style shirt, exposing the belly. PLAIN with no logo.
- "Small_T_White" = A crop-top style OFF-WHITE tshirt, cut SHORT to EXPOSE THE BELLY. The belly is clearly visible beneath the shirt.
- "Small_T_Blue" = A BLUE crop top style shirt that is CUT SHORT to EXPOSE THE BELLY. The belly is clearly visible. NO logo. Distinguished from Shirt_Blue because Small_T_Blue shows the belly, while Shirt_Blue covers the full body and has a WHITE IGLOO LOGO.
- "Small_T_Red" = A RED crop top style shirt that is CUT SHORT to EXPOSE THE BELLY. The belly is clearly visible.

CRITICAL - SMALL_T vs SHIRT DISTINCTION (YOU MUST GET THIS RIGHT):
- "Small_T_Blue": A SHORT BLUE SHIRT that EXPOSES THE BELLY. The bottom of the belly (white tummy area) is visible below the shirt. NO logo on the shirt.
- "Shirt_Blue": A FULL-LENGTH BLUE SHIRT that COVERS the entire body. Has a WHITE CIRCULAR IGLOO LOGO on the chest. Belly is NOT visible.
- KEY: If you can see the penguin's WHITE BELLY below the shirt → Small_T. If the shirt covers the whole body and has a logo → Shirt.
- The same rule applies to Small_T_Red vs Shirt_Red and Small_T_White.
- "Biker_Jacket" = A black leather jacket with gray spikes on the shoulders.
- "Swordman" = An orange kimono with black triangles, with the hilt of a sword showing on the back.
- "Caveman" = An ORANGE caveman outfit with BROWN spots.
- "Suit_White" = An all WHITE suit, complete with white jacket and white bowtie.
- "Suit_Blue" = A BLUE suit jacket with BLUE bowtie and WHITE undershirt.
- "Suit_Red" = A RED suit jacket with red bowtie and WHITE undershirt.
- "Suit_Black" = A BLACK suit jacket with BLACK bowtie and WHITE undershirt.
- "Pudgy_Man" = A blue superman-style outfit with a red cape and PM logo on the front.
- "Pudgy_Boy_White" = A BLACK superhero outfit with WHITE cape, WHITE utility belt, WHITE underpants, and PB logo on the front.
- "Pudgy_Boy_Green" = A BLACK superhero outfit with GREEN cape, GREEN utility belt, and GREEN underpants, with PB logo on the front.
- "Pudgy_Boy_Purple" = A BLACK superhero outfit with PURPLE utility belt, PURPLE cape, and PURPLE underpants, with PB logo on front.
- "Kings_Robe_Red" = A RED outfit with WHITE frills around the edges, joined together by a YELLOW circle in the center of the top.
- "Kings_Robe_Blue" = A BLUE outfit with WHITE frills around the edges, joined together by a YELLOW circle in the center of the top.
- "I_Love_Fish" = A white shirt with green collar and green sleeves which reads "I (heart) fish".
- "Fish_Lover" = A WHITE shirt with RED collar that reads "Fish Lover" on the front.
- "Fish_Lover_Blue" = A BLUE tshirt that says "Fish Lover" on the front in BLACK text.
- "Big_P" = A BROWN seashell on a BLACK string necklace with big P letter on the front.
- "Sharktooth_Necklace" = A single PALE sharktooth on a string necklace.
- "Silver_Chain" = A thin GRAY/SILVER metal chainlink necklace.
- "Gold_Chain" = A thin GOLD chain link necklace around the neck.
- "Bib_Pudgy" = A WHITE bib which reads "Pudgy" in BLUE text.
- "Bib_Pengu" = A WHITE bib which reads "Pengu" in BLUE text.
- "Toolbelt" = A BROWN toolbelt with a variety of tools including RED and BLUE screwdrivers.
- "Christmas_Sweater_Blue" = A BLUE christmas sweater with WHITE snowflakes on it.
- "Christmas_Sweater_Red" = A RED sweater with WHITE snowflakes.
- "Christmas_Sweater_Green" = A GREEN christmas sweater with WHITE snowflakes on it.
- "Christmas_Sweater_Purple" = A PURPLE sweater with WHITE snowflakes on it.
- "Christmas_Sweater_Tan" = A LIGHT BROWN sweater with ORANGE and WHITE snowflakes on it.
- "The_Huddle" = A pink shirt with "the Huddle" written on the front in dark pink.
- "Huddle" = A PURPLE shirt that says "huddle" on the front.
- "Huddle_Lime" = A GREEN tshirt with "Huddle" written on the front in green.
- "Tank_Top_White" = A sleeveless WHITE tank top with white surfboard logo on the front.
- "Tank_Top_Blue" = A BLUE tank top with WHITE collar and WHITE surfboard on the front.
- "Tank_Top_Yellow" = A YELLOW tank top with BLUE collar and BLUE surfboard on the front.
- "Tank_Top_Red" = A RED tanktop with WHITE surfboard logo on the front.
- "Vote_4_Pudgy" = A WHITE t shirt with red collar and "Vote 4 Pudgy" on the front in RED text.
- "Labcoat" = A white labcoat with blue undershirt.
- "Apron" = A GREEN apron that says "Pudgy" on the front in WHITE text.
- "Shirt_Red" = A MAROON t shirt with white igloo logo on the front. MUST have visible white logo.
- "Shirt_Blue" = A LIGHT BLUE shirt with white igloo logo on front.
- "Shirt_Green" = A GREEN t shirt with white igloo logo on the front.
- "Shirt_Black" = A BLACK v-neck tshirt with WHITE igloo logo on the front.
- "Flannel_Blue" = A BLUE shirt with a FLANNEL/PLAID pattern.
- "Flannel_Pink" = A PINK shirt with a flannel pattern on it.
- "Flannel_Red" = A RED flannel shirt with flannel/plaid pattern.
- "Flannel_Green" = A GREEN flannel shirt with flannel/plaid pattern.
- "Toga" = A single OFF-WHITE toga sheet style outfit.
- "Red_Belt" = A WHITE karate outfit with RED belt.
- "Yellow_Belt" = A WHITE karate outfit with YELLOW belt.
- "Black_Belt" = A WHITE karate outfit with BLACK belt.
- "White_Belt" = A BROWN karate outfit with WHITE belt.
- "Tube_Donut" = An inflatable tube decorated like a PINK FROSTING donut.
- "Tube_Yellow" = An inflatable tube in YELLOW.
- "Tube_Orange" = An ORANGE inflatable tube with a white stripe on it.
- "Tube_Black" = A BLACK inflatable tube.
- "Tube_Pink" = A PINK inflatable tube.
- "Tube_Blue" = A BLUE inflatable tube.
- "Tube_Dino_Green" = An inflatable tube in the shape of a GREEN dinosaur.
- "Tube_Dino_Orange" = An ORANGE inflatable tube in the shape of a dinosaur.
- "Tube_Dino_Blue" = A TURQUOISE inflatable tube in the shape of a dinosaur, with pink bumps on its head.
- "Tube_Flamingo" = An inflatable tube in the shape of a PINK flamingo.
- "Tube_Unicorn" = An OFF-WHITE slightly pinkish inflatable tube in the shape of a UNICORN, with pink bumps on its head and small wings.
- "Tube_Swan" = A WHITE inflatable tube in the shape of a SWAN/GOOSE, with orange beak and small white wings.
- "Hula_Tan" = A string of purple, pink, and blue flowers around the waist with a TAN hula skirt hanging off the bottom.
- "Hula_Green" = A string of pink, blue, and purple flowers around the belly with GREEN hula skirt hanging off the bottom. Distinguished from Hula_Coconut because it does NOT have the coconut bra.
- "Hula_Coconut" = A string of red, pink, and blue flowers around the belly with a GREEN hula skirt hanging off and COCONUT SHELL BRA.
- "PJs_Stripes_Lime" = A GREEN pajama style outfit with green stripes and buttons down the center.
- "PJs_Stripes_Maroon" = A MAROONISH PURPLE pajama style outfit with stripes and buttons down the front.
- "PJs_Stripes_Pink" = A pink pajama style outfit with stripes and buttons.
- "PJs_Stripes_Christmas" = A pajama style outfit with RED and GREEN stripes.
- "PJs_Dots_Purple" = A PURPLE pajama style outfit with lighter purple polka dots.
- "PJs_Dots_Blue" = A BLUE pajama style outfit with light blue polka dots and buttons up the front.
- "PJs_Dots_Orange" = An ORANGE pajama style outfit with lighter orange polka dots.
- "PJs_Dots_Yellow" = A DARK BLUE pajama style outfit with YELLOW polkadots.
- "Football_Jersey_Green" = A GREEN/TURQUOISE color jersey with pink accents and a white "1" on the front.
- "Football_Jersey_Navy" = A DARK NAVY BLUE football jersey with "6" on the front.
- "Football_Jersey_Purple" = A PURPLE jersey with YELLOW collar and "7" on the front.
- "Football_Jersey_Red" = A RED football jersey with BLACK collar and "2" on the front.
- "Basketball_Jersey_Blue" = A BLUE sleeveless basketball jersey with "1" on the front.
- "Basketball_Jersey_Black" = A BLACK sleeveless basketball jersey with red collar and "1" on the front.
- "Basketball_Jersey_Pink" = A PINK sleeveless basketball jersey with blue collar and "23" on the front.
CRITICAL - KIMONO DISTINCTION (LOOK AT THE PATTERN):
- "Kimono_Brown" = A BROWN Kimono with a white stripe down the lapels.
- "Kimono_Gold" = A GOLD/YELLOW kimono with sparkle.
- "Kimono_Ice" = A LIGHT BLUE kimono with sparkle.
- "Kimono_Blue" = A LIGHT BLUE kimono with BLUE FLOWERS and a white stripe down the lapels.
- "Kimono_Orange" = An ORANGE kimono with WHITE TRIANGLES on it.
- "Kimono_Gray" = A GRAY kimono with white stripe down the lapels.
- "Kimono_Abstract" = A kimono, PURPLE in color on the right side, with a GREEN/YELLOW geometrical design on the opposite left side, and white stripe down the lapels.
- "Kimono_Red" = A RED kimono with BLACK TRIANGLE pattern and WHITE stripe down the lapels.
- "Kimono_White" = A WHITE kimono with BLACK triangle pattern and WHITE stripe down the lapels.
- "Kimono_Pink" = A pink Kimono with dark pink flowers.
- "Kimono_Black" = A BLACK kimono with RED TRIANGLE pattern and RED stripe down the lapels.
- "Kimono_Flower_Pink" = A LIGHT PINK kimono with DARKER PINK flowers and WHITE stripe down the lapels.
- "Kimono_Flower_Purple" = A LIGHT PURPLE kimono with DARKER PURPLE flowers on it and WHITE stripe down the lapels.
KEY: If the kimono is RED with BLACK TRIANGLES → "Kimono_Red". If ORANGE with WHITE TRIANGLE patterns → "Kimono_Orange". If BLACK with RED TRIANGULAR pattern → "Kimono_Black". If WHITE with BLACK TRIANGLES → "Kimono_White".
- "Bathrobe" = An off-white bathrobe. Similar to a Kimono, but the two lapels meet together at the bottom of the image to form a 'V' shape, while Kimonos have a completely open front.

CRITICAL - PONCHO_BLACK vs KIMONO_ABSTRACT (YOU MUST GET THIS RIGHT):
- "Poncho_Black": A pure BLACK PONCHO / CLOAK with BIG SILVER/WHITE TRIANGLES. It looks like a cape or wrap that covers the body in a cone/triangle shape. The ONLY pattern is large SILVER/WHITE triangles on a BLACK background.
- "Kimono_Abstract": A PURPLE + GREEN/YELLOW GEOMETRIC KIMONO with a WHITE lapel stripe. The right side is PURPLE, the left side is GREEN/YELLOW cubes/diamonds. NOT black, not a cape.

KEY RULES:
- If the garment is SOLID BLACK with large SILVER/WHITE triangles → ALWAYS "Poncho_Black", NEVER Kimono_Abstract.
- If you see PURPLE + GREEN/YELLOW geometric shapes with a visible WHITE lapel stripe → "Kimono_Abstract".
- In your natural-language description, if you choose Poncho_Black, you MUST say "black poncho with large silver triangles" (never "kimono").
- In your description for Kimono_Abstract, you MUST mention "purple and green/yellow geometric kimono with white lapel stripe".

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
    "right_flipper": "EXACT_RIGHT_FLIPPER_TRAIT_NAME_FROM_LIST or null (Lil Pudgy only - item held in right flipper/hand, appears on LEFT side of image)",
    "left_flipper": "EXACT_LEFT_FLIPPER_TRAIT_NAME_FROM_LIST or null (Lil Pudgy only - item held in left flipper/hand, appears on RIGHT side of image)",
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
      const isLilPudgy = traits.isLilPudgy === true;
      
      // Check against appropriate list based on penguin type
      const headTraitList = isLilPudgy ? AVAILABLE_LIL_HEAD_TRAITS : AVAILABLE_HEAD_TRAITS;
      const allHeadTraits = [...AVAILABLE_HEAD_TRAITS, ...AVAILABLE_LIL_HEAD_TRAITS];
      
      // First check if it's in the appropriate list
      if (headTraitList.includes(headTrait)) {
        // Valid trait for this penguin type, keep it
        console.log(`Valid ${isLilPudgy ? 'Lil' : 'Big'} head trait: ${headTrait}`);
      } else if (allHeadTraits.includes(headTrait)) {
        // Valid trait but for the other penguin type - still keep it
        console.log(`Head trait "${headTrait}" is for ${isLilPudgy ? 'Big' : 'Lil'} Pudgy but keeping it`);
      } else {
        console.log(`Head trait "${headTrait}" not in available list, attempting to match...`);
        // Try to find a close match in the combined list
        const normalizedInput = headTrait.toLowerCase().replace(/[\s-]/g, '_');
        const match = allHeadTraits.find(t => 
          t.toLowerCase() === normalizedInput ||
          t.toLowerCase().includes(normalizedInput) ||
          normalizedInput.includes(t.toLowerCase())
        );
        if (match) {
          console.log(`Matched head to: ${match}`);
          traits.traits.head = match;
        } else {
          console.log(`No match found for head trait "${headTrait}", setting to null`);
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

    // ========== PUDGY TYPE CORRECTION ==========
    // Trust the user's mode selection - if they selected Lil mode, override the AI's decision
    if (expectedMode === 'lil' && traits.isLilPudgy === false) {
      console.log("TYPE CORRECTION: isLilPudgy false → true (user selected Lil mode, trusting user selection)");
      traits.isLilPudgy = true;
    }
    
    if (expectedMode === 'big' && traits.isLilPudgy === true) {
      console.log("TYPE CORRECTION: isLilPudgy true → false (user selected Big mode, trusting user selection)");
      traits.isLilPudgy = false;
    }
    
    // Fix Top_Hat → Top_Hat_Tall for Lil Pudgys when description mentions tall
    if (traits.isLilPudgy === true && traits.traits?.head === "Top_Hat") {
      const descLower = (traits.description || "").toLowerCase();
      if (descLower.includes("tall")) {
        console.log("HEAD CORRECTION: Top_Hat → Top_Hat_Tall (Lil Pudgy with tall hat description)");
        traits.traits.head = "Top_Hat_Tall";
      }
    }

    // ========== GLOBAL DESCRIPTION-AWARE OVERRIDES ==========
    // These apply to ALL images, not specific combos
    const description = (traits.description || "").toLowerCase();
    
    // ----- CROWN OVERRIDES (applies to all images) -----
    if (traits.traits?.head === "Flower_Crown") {
      // Check if description actually mentions pink flowers or green leaves
      const hasPinkFlowers = description.includes("pink flower") || description.includes("pink rose") || description.includes("roses");
      const hasGreenLeaves = description.includes("green leaf") || description.includes("green leaves");
      const hasYellowLeafKeywords = description.includes("yellow leaf") || description.includes("gold leaf") || description.includes("golden leaf") || description.includes("laurel");
      
      if (!hasPinkFlowers && !hasGreenLeaves) {
        // AI said Flower_Crown but description doesn't mention pink/green = it's actually Leaf_Crown_Gold
        console.log("GLOBAL OVERRIDE: Flower_Crown → Leaf_Crown_Gold (description lacks pink flowers/green leaves)");
        traits.traits.head = "Leaf_Crown_Gold";
      }
    }
    
    if (traits.traits?.head === "Leaf_Crown_Gold") {
      // Verify it's not actually Flower_Crown
      const hasPinkFlowers = description.includes("pink flower") || description.includes("pink rose") || description.includes("roses");
      const hasGreenLeaves = description.includes("green leaf") || description.includes("green leaves");
      
      if (hasPinkFlowers || hasGreenLeaves) {
        // AI said Leaf_Crown_Gold but description mentions pink/green = it's actually Flower_Crown
        console.log("GLOBAL OVERRIDE: Leaf_Crown_Gold → Flower_Crown (description has pink flowers/green leaves)");
        traits.traits.head = "Flower_Crown";
      }
    }
    
    // ----- FACE OVERRIDES (applies to all Lil Pudgys) -----
    if (traits.isLilPudgy === true) {
      const currentFace = traits.traits?.face;
      
      // Mad vs Curious detection
      if (currentFace === "Mad") {
        const hasAsymmetric = description.includes("asymmetric") || description.includes("different shape") || description.includes("mismatched");
        const hasEyebrows = description.includes("eyebrow");
        const hasCurious = description.includes("curious");
        
        if ((hasAsymmetric || hasEyebrows || hasCurious) && !description.includes("squint") && !description.includes("angry") && !description.includes("mad")) {
          console.log("GLOBAL OVERRIDE: Mad → Curious (description indicates asymmetric eyes/eyebrows)");
          traits.traits.face = "Curious";
        }
      }
      
      if (currentFace === "Curious") {
        const hasSquint = description.includes("squint") || description.includes("angry") || description.includes("mad") || description.includes("horizontal line");
        const hasAsymmetric = description.includes("asymmetric") || description.includes("different shape") || description.includes("mismatched");
        
        if (hasSquint && !hasAsymmetric) {
          console.log("GLOBAL OVERRIDE: Curious → Mad (description indicates squinting/angry)");
          traits.traits.face = "Mad";
        }
      }
      
      // Normal vs Cross_Eyed detection  
      if (currentFace === "Normal") {
        const hasCircular = description.includes("circular") || description.includes("beady") || description.includes("tiny dot") || description.includes("small dot");
        const hasCloseTogether = description.includes("close together") || description.includes("crossed");
        
        if (hasCircular || hasCloseTogether) {
          console.log("GLOBAL OVERRIDE: Normal → Cross_Eyed (description indicates circular/beady eyes)");
          traits.traits.face = "Cross_Eyed";
        }
      }
      
      if (currentFace === "Cross_Eyed") {
        const hasOval = description.includes("oval eye") || description.includes("normal eye") || description.includes("regular eye");
        const hasSpacedApart = description.includes("spaced apart");
        
        if ((hasOval || hasSpacedApart) && !description.includes("circular") && !description.includes("beady") && !description.includes("crossed")) {
          console.log("GLOBAL OVERRIDE: Cross_Eyed → Normal (description indicates oval eyes)");
          traits.traits.face = "Normal";
        }
      }
      
      // Aviators vs Squad detection - Squad is TWO BLACK FRAMELESS TRIANGLES joined at bridge
      // Aviators are teardrop-shaped with visible black FRAMES
      if (currentFace === "Aviators") {
        const hasTriangular = description.includes("triangle") || description.includes("triangular") || description.includes("angular");
        const hasFrameless = description.includes("frameless") || description.includes("no frame") || description.includes("without frame");
        const hasJoined = description.includes("joined") || description.includes("connected") || description.includes("fused") || description.includes("meet at");
        const hasSquadKeyword = description.includes("squad");
        
        // If description mentions triangular/frameless/joined characteristics, it's Squad not Aviators
        if (hasTriangular || hasFrameless || hasJoined || hasSquadKeyword) {
          console.log("GLOBAL OVERRIDE: Aviators → Squad (description indicates triangular/frameless glasses)");
          traits.traits.face = "Squad";
        }
      }
      
      if (currentFace === "Squad") {
        const hasTeardrop = description.includes("teardrop") || description.includes("tear drop") || description.includes("aviator");
        const hasFrame = description.includes("black frame") || description.includes("metal frame") || description.includes("with frame");
        const hasGradient = description.includes("gradient") || description.includes("fading");
        
        // If description mentions teardrop/framed/gradient characteristics, it's Aviators not Squad
        if ((hasTeardrop || hasFrame || hasGradient) && !description.includes("triangle") && !description.includes("frameless")) {
          console.log("GLOBAL OVERRIDE: Squad → Aviators (description indicates teardrop/framed glasses)");
          traits.traits.face = "Aviators";
        }
      }
    }
    
    // ----- FACE RECOVERY FROM DESCRIPTION WHEN FACE IS NULL -----
    // Sometimes the model omits the face trait but clearly describes angry/squinting eyes.
    if ((!traits.traits?.face || traits.traits.face === null) && description) {
      const hasMadKeywords =
        description.includes("angry") ||
        description.includes("mad") ||
        description.includes("furrowed brow") ||
        description.includes("furrowed eyebrows") ||
        description.includes("scowl");
      const hasSquintKeywords =
        description.includes("squint") ||
        description.includes("squinting") ||
        description.includes("narrowed eyes") ||
        description.includes("half-closed eyes") ||
        description.includes("horizontal line through the eyes") ||
        description.includes("horizontal line across the eyes");

      if (hasMadKeywords || hasSquintKeywords) {
        console.log("FACE RECOVERY: null → Mad (description indicates angry/squinting eyes)");
        traits.traits.face = "Mad";
      }
    }
    
    // ----- FACE OVERRIDE: "Normal" on Lil Pudgys should be null (base eyes) -----

    // ----- FACE OVERRIDE: "Normal" on Lil Pudgys should be null (base eyes) -----
    // The base Lil eyes (black ovals with white highlights) are the default and should have no face trait
    if (traits.isLilPudgy === true && traits.traits?.face === "Normal") {
      const hasWhiteHighlights = description.includes("white") || description.includes("highlight") || description.includes("shine") || description.includes("reflection");
      const hasBaseEyeDescription = description.includes("oval") && !description.includes("solid black") && !description.includes("no highlight");
      
      // If description mentions white highlights/shine in eyes, or doesn't explicitly say "solid black with no highlights", 
      // then it's base eyes and should be null
      if (hasWhiteHighlights || hasBaseEyeDescription || !description.includes("solid")) {
        console.log("FACE OVERRIDE: Normal → null (Lil Pudgy base eyes with highlights = no face trait)");
        traits.traits.face = null;
      }
    }
    
    // ----- SKIN OVERRIDES (reduce false Ice/Gold detections) -----
    // Ice Skin: Must have EITHER sparkles OR distinctive cyan/turquoise color (#77D1F6)
    // The color alone is sufficient since sparkles may be hidden by accessories
    if (traits.traits?.skin === "ice skin") {
      const hasSparkles = description.includes("sparkle") || description.includes("sparkles") || description.includes("✨");
      const hasIcyColor = description.includes("icy") || description.includes("ice blue") || description.includes("icy blue") || description.includes("cyan") || description.includes("turquoise") || description.includes("aqua") || description.includes("#77d1f6") || description.includes("light blue body") || description.includes("light blue flipper") || description.includes("ice-blue skin");
      
      // Accept if EITHER sparkles OR distinctive icy color is mentioned (but do NOT trust the phrase "ice skin" alone)
      if (!hasSparkles && !hasIcyColor) {
        console.log("SKIN OVERRIDE: ice skin → Normal (description lacks sparkles AND icy color cues)");
        traits.traits.skin = "Normal";
      }
    }
    
    // Gold Skin: Must have EITHER sparkles OR distinctive golden color
    // Be more lenient - accept "gold" or "golden" or "yellow" in description for body/flipper/skin
    if (traits.traits?.skin === "gold skin") {
      const hasSparkles = description.includes("sparkle") || description.includes("sparkles") || description.includes("✨");
      const hasGoldColor = description.includes("golden") || description.includes("gold body") || description.includes("gold skin") || description.includes("yellow body") || description.includes("yellow skin") || description.includes("metallic yellow") || description.includes("bright yellow") || description.includes("gold colored") || description.includes("gold-colored");
      
      if (!hasSparkles && !hasGoldColor) {
        console.log("SKIN OVERRIDE: gold skin → Normal (description lacks sparkles AND gold color cues)");
        traits.traits.skin = "Normal";
      }
    }
    
    // ----- SKIN RECOVERY: If skin is "Normal" but description mentions gold/yellow body, upgrade to gold skin -----
    if (traits.traits?.skin === "Normal" || !traits.traits?.skin) {
      const hasGoldBodyKeywords = description.includes("gold body") || description.includes("golden body") || description.includes("yellow body") || description.includes("gold-colored body") || description.includes("bright yellow body") || (description.includes("sparkle") && description.includes("yellow"));
      const hasIceBodyKeywords = description.includes("ice body") || description.includes("icy body") || description.includes("cyan body") || description.includes("turquoise body") || description.includes("light blue body") || (description.includes("sparkle") && (description.includes("cyan") || description.includes("turquoise") || description.includes("light blue")));
      
      if (hasGoldBodyKeywords) {
        console.log("SKIN RECOVERY: Normal → gold skin (description mentions gold/yellow body)");
        traits.traits.skin = "gold skin";
      } else if (hasIceBodyKeywords) {
        console.log("SKIN RECOVERY: Normal → ice skin (description mentions icy/cyan body)");
        traits.traits.skin = "ice skin";
      }
    }
    
    // ----- BODY TRAIT RECOVERY FROM DESCRIPTION -----
    // First, fix common confusion between Poncho_Black and Kimono_Abstract using the description
    if (traits.traits?.body === "Kimono_Abstract") {
      const hasPonchoWord = description.includes("poncho");
      const hasBlackPonchoPhrase = description.includes("black poncho") || description.includes("black cloak") || description.includes("black cape");
      const hasTriangleOnlyPattern = description.includes("silver triangles") || description.includes("white triangles") || description.includes("large triangles");
      const hasKimonoWords = description.includes("kimono") || description.includes("robe") || description.includes("lapel");
      const hasAbstractColors = description.includes("purple and green") || description.includes("purple and yellow") || description.includes("green and yellow");
      
      // If the description clearly talks about a black poncho with triangles (and not a purple/green kimono), correct to Poncho_Black
      if ((hasPonchoWord || hasBlackPonchoPhrase || hasTriangleOnlyPattern) && !hasKimonoWords && !hasAbstractColors) {
        console.log("BODY OVERRIDE: Kimono_Abstract → Poncho_Black (description indicates black poncho with triangles)");
        traits.traits.body = "Poncho_Black";
      }
    }

    // Then, fix common confusion between Electric_Coat and Kimono_White when the garment is clearly a white kimono with black triangle pattern
    if (traits.traits?.body === "Electric_Coat") {
      const hasWhiteGarment = description.includes("white kimono") || description.includes("white coat") || description.includes("white cloak") || description.includes("white garment");
      const hasBlackTrianglePattern = description.includes("black triangles") || description.includes("triangle pattern") || description.includes("triangular pattern") || description.includes("black triangle pattern");

      if (hasWhiteGarment && hasBlackTrianglePattern) {
        console.log("BODY OVERRIDE: Electric_Coat → Kimono_White (description indicates white kimono with black triangles)");
        traits.traits.body = "Kimono_White";
      }
    }

    // Fix Shirt_Blue → Small_T_Blue when description mentions exposed belly
    if (traits.traits?.body === "Shirt_Blue") {
      const hasExposedBelly = description.includes("exposed belly") || description.includes("belly exposed") || description.includes("belly visible") || description.includes("showing belly") || description.includes("crop") || description.includes("short shirt") || description.includes("cut short");
      const hasNoLogo = !description.includes("logo") && !description.includes("igloo");
      
      if (hasExposedBelly || hasNoLogo) {
        console.log("BODY OVERRIDE: Shirt_Blue → Small_T_Blue (description indicates exposed belly / no logo)");
        traits.traits.body = "Small_T_Blue";
      }
    }
    
    // Fix Shirt_Red → Small_T_Red when description mentions exposed belly
    if (traits.traits?.body === "Shirt_Red") {
      const hasExposedBelly = description.includes("exposed belly") || description.includes("belly exposed") || description.includes("belly visible") || description.includes("showing belly") || description.includes("crop") || description.includes("short shirt") || description.includes("cut short");
      const hasNoLogo = !description.includes("logo") && !description.includes("igloo");
      
      if (hasExposedBelly || hasNoLogo) {
        console.log("BODY OVERRIDE: Shirt_Red → Small_T_Red (description indicates exposed belly / no logo)");
        traits.traits.body = "Small_T_Red";
      }
    }
    
    // Additional body recovery for black igloo t-shirt (Shirt_Black)
    if ((!traits.traits?.body || traits.traits.body === null) && description.includes("igloo") && description.includes("logo")) {
      const hasShirtWord = description.includes("shirt") || description.includes("t-shirt") || description.includes("t shirt") || description.includes("tee");
      const hasBlack = description.includes("black");
      
      if (hasShirtWord && hasBlack) {
        console.log("BODY RECOVERY: Detected black t-shirt with igloo logo → Shirt_Black");
        traits.traits.body = "Shirt_Black";
      }
    }
    
    // If AI returned null for body but description mentions a known body trait, recover it
    if (!traits.traits?.body || traits.traits.body === null) {
      const bodyTraitKeywords: Record<string, string> = {
        "toga": "Toga",
        "overalls": "Overalls",
        "hoodie": "Hoodie_Black",
        "kimono": "Kimono_White",
        "poncho": "Poncho_Black",
        "karate": "White_Belt",
        "turtleneck": "Turtle_Neck_Pink",
        "scarf": "Scarf_Green",
        "bib": "Bib_Pudgy",
        "toolbelt": "Toolbelt",
        "tank top": "Tank_Top_Red",
        "flannel": "Flannel_Red",
        "sweater": "Christmas_Sweater_Red",
        "pj": "PJs_Stripes_Pink",
        "pijama": "PJs_Stripes_Pink",
        "robe": "Kings_Robe_Red",
        "cape": "Pudgy_Boy_White",
        "medal": "Gold_Medal",
        "chain": "Gold_Chain",
        "bow tie": "Bow_Tie_Black",
        "bowtie": "Bow_Tie_Black",
      };
      
      for (const [keyword, traitName] of Object.entries(bodyTraitKeywords)) {
        if (description.includes(keyword)) {
          console.log(`BODY RECOVERY: Found "${keyword}" in description → setting body to ${traitName}`);
          traits.traits.body = traitName;
          break;
        }
      }
    }
    
    console.log("Final traits after global overrides:", JSON.stringify(traits.traits));
 
    // Validate and normalize the body trait
    if (traits.traits?.body && typeof traits.traits.body === 'string') {
      const bodyTrait = traits.traits.body;
      const isLilPudgy = traits.isLilPudgy === true;
      
      // Check against appropriate list based on penguin type
      const bodyTraitList = isLilPudgy ? AVAILABLE_LIL_BODY_TRAITS : AVAILABLE_BODY_TRAITS;
      const allBodyTraits = [...AVAILABLE_BODY_TRAITS, ...AVAILABLE_LIL_BODY_TRAITS];
      
      // First check if it's in the appropriate list
      if (bodyTraitList.includes(bodyTrait)) {
        // Valid trait for this penguin type, keep it
        console.log(`Valid ${isLilPudgy ? 'Lil' : 'Big'} body trait: ${bodyTrait}`);
      } else if (allBodyTraits.includes(bodyTrait)) {
        // Valid trait but for the other penguin type - still keep it
        console.log(`Body trait "${bodyTrait}" is for ${isLilPudgy ? 'Big' : 'Lil'} Pudgy but keeping it`);
      } else {
        console.log(`Body trait "${bodyTrait}" not in available list, attempting to match...`);
        // Try to find a close match in the combined list
        const normalizedInput = bodyTrait.toLowerCase().replace(/[\s-]/g, '_');
        const match = allBodyTraits.find(t => 
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
