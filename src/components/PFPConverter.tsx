import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Download, RefreshCw, AlertCircle, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import Template from '@/assets/pfp-templates/Template.png';
import Template_2 from '@/assets/pfp-templates/Template_2.png';
import Backwards_Template from '@/assets/pfp-templates/Backwards_Template.png';
import Gold_Template from '@/assets/pfp-templates/Gold_Template.png';
import Gold_Template_2 from '@/assets/pfp-templates/Gold_Template_2.png';
import Ice_Template from '@/assets/pfp-templates/Ice_Template.png';
import Ice_Template_2 from '@/assets/pfp-templates/Ice_Template_2.png';
import Lil_Template from '@/assets/pfp-templates/Lil_Template.png';
import Lil_Template_Blank from '@/assets/pfp-templates/Lil_Template_Blank.png';

// Pudgy Knight 1:1 output templates
import Pudgy_Knight_Black_Output from '@/assets/pfp-templates/lil/Pudgy_Knight_Black_Output.png';
import Pudgy_Knight_Ice_Output from '@/assets/pfp-templates/lil/Pudgy_Knight_Ice_Output.png';
import Pudgy_Knight_Blue_Output from '@/assets/pfp-templates/lil/Pudgy_Knight_Blue_Output.png';
import Pudgy_Knight_Purple_Output from '@/assets/pfp-templates/lil/Pudgy_Knight_Purple_Output.png';
import Pudgy_Knight_White_Output from '@/assets/pfp-templates/lil/Pudgy_Knight_White_Output.png';
import Pudgy_Knight_Gray_Output from '@/assets/pfp-templates/lil/Pudgy_Knight_Gray_Output.png';
import Pudgy_Knight_Gold_Output from '@/assets/pfp-templates/lil/Pudgy_Knight_Gold_Output.png';
import Pudgy_Knight_Red_Output from '@/assets/pfp-templates/lil/Pudgy_Knight_Red_Output.png';

// Other 1:1 Lil Pudgy output templates
import Backward_Output from '@/assets/pfp-templates/lil/Backward_Output.png';
import Jetpack_Output from '@/assets/pfp-templates/lil/Jetpack_Output.png';
import Runt_Output from '@/assets/pfp-templates/lil/Runt_Output.png';
import Taco_Output from '@/assets/pfp-templates/lil/Taco_Output.png';
import Tree_Output from '@/assets/pfp-templates/lil/Tree_Output.png';
import Avocado_Output from '@/assets/pfp-templates/lil/Avocado_Output.png';
import Stuck_Output from '@/assets/pfp-templates/lil/Stuck_Output.png';
import Astronaut_Output from '@/assets/pfp-templates/lil/Astronaut_Output.png';
import Hot_Dog_Output from '@/assets/pfp-templates/lil/Hot_Dog_Output.png';

// Mapping of special Lil penguin types to their output templates (1:1 NFTs)
const LIL_SPECIAL_OUTPUT_MAP: Record<string, string> = {
  // Pudgy Knights
  pudgy_knight_black: Pudgy_Knight_Black_Output,
  pudgy_knight_ice: Pudgy_Knight_Ice_Output,
  pudgy_knight_blue: Pudgy_Knight_Blue_Output,
  pudgy_knight_purple: Pudgy_Knight_Purple_Output,
  pudgy_knight_white: Pudgy_Knight_White_Output,
  pudgy_knight_gray: Pudgy_Knight_Gray_Output,
  pudgy_knight_gold: Pudgy_Knight_Gold_Output,
  pudgy_knight_red: Pudgy_Knight_Red_Output,
  // Other 1:1 Lils
  lil_backward: Backward_Output,
  lil_jetpack: Jetpack_Output,
  lil_runt: Runt_Output,
  lil_taco: Taco_Output,
  lil_tree: Tree_Output,
  lil_avocado: Avocado_Output,
  lil_stuck: Stuck_Output,
  lil_astronaut: Astronaut_Output,
  lil_hot_dog: Hot_Dog_Output,
};

// Lil face traits that require Lil_Template_Blank (blank eyes) instead of default Lil_Template
const LIL_BLANK_FACE_TRAITS = [
  'Football',
  'Reading_Normal',
  'Goofy_Glasses',
  'Scouter',
  'Nerd_Normal',
  'Reading_Cross_eyed',
  'Curious',
  'Mad',
  'Winking',
  'Cross_Eyed',
  'Normal',
];

// Lil face trait remapping - when detected trait maps to a different overlay image
// The original trait is used for detection, but the "_2" version is used for the output
const LIL_FACE_TRAIT_REMAP: Record<string, string> = {
  'Reading_Cute': 'Reading_Cute_2',
  'Reading_Cross_eyed': 'Reading_Cross_eyed_2',
  'Nerd_Normal': 'Nerd_Normal_2',
  'Scouter': 'Scouter_2',
  'Goofy_Glasses': 'Goofy_Glasses_2',
  'Nerd_Blushing': 'Nerd_Blushing_2',
  'Reading_Normal': 'Reading_Normal_2',
  'Nerd_Cute': 'Nerd_Cute_2',
};

// Import Lil face trait overlays (remapped _2 versions)
import LilNerdCute2 from '@/assets/pfp-traits/lil/face/Nerd_Cute_2.png';
import LilReadingNormal2 from '@/assets/pfp-traits/lil/face/Reading_Normal_2.png';
import LilNerdBlushing2 from '@/assets/pfp-traits/lil/face/Nerd_Blushing_2.png';
import LilGoofyGlasses2 from '@/assets/pfp-traits/lil/face/Goofy_Glasses_2.png';
import LilScouter2 from '@/assets/pfp-traits/lil/face/Scouter_2.png';
import LilNerdNormal2 from '@/assets/pfp-traits/lil/face/Nerd_Normal_2.png';
import LilReadingCrossEyed2 from '@/assets/pfp-traits/lil/face/Reading_Cross_eyed_2.png';
import LilReadingCute2 from '@/assets/pfp-traits/lil/face/Reading_Cute_2.png';

// Import Lil face trait overlays (direct 1:1 mappings)
import LilCircleGlasses from '@/assets/pfp-traits/lil/face/Circle_Glasses.png';
import LilBlushing from '@/assets/pfp-traits/lil/face/Blushing.png';
import LilCrossEyed from '@/assets/pfp-traits/lil/face/Cross_Eyed.png';
import LilCurious from '@/assets/pfp-traits/lil/face/Curious.png';
import LilMad from '@/assets/pfp-traits/lil/face/Mad.png';
import LilNormal from '@/assets/pfp-traits/lil/face/Normal.png';
import LilReadingCute from '@/assets/pfp-traits/lil/face/Reading_Cute.png';
import LilWinking from '@/assets/pfp-traits/lil/face/Winking.png';

// Import Lil right flipper trait overlays
import LilRightFlipper_Chop_Sticks from '@/assets/pfp-traits/lil/right_flipper/Chop_Sticks.png';
import LilRightFlipper_Kite_Red from '@/assets/pfp-traits/lil/right_flipper/Kite_Red.png';
import LilRightFlipper_Sunflower from '@/assets/pfp-traits/lil/right_flipper/Sunflower.png';
import LilRightFlipper_Surfboard_Tan from '@/assets/pfp-traits/lil/right_flipper/Surfboard_Tan.png';
import LilRightFlipper_Roses from '@/assets/pfp-traits/lil/right_flipper/Roses.png';
import LilRightFlipper_Carrot from '@/assets/pfp-traits/lil/right_flipper/Carrot.png';
import LilRightFlipper_Croissant from '@/assets/pfp-traits/lil/right_flipper/Croissant.png';
import LilRightFlipper_Popsicle from '@/assets/pfp-traits/lil/right_flipper/Popsicle.png';
import LilRightFlipper_Maraca from '@/assets/pfp-traits/lil/right_flipper/Maraca.png';
import LilRightFlipper_Football from '@/assets/pfp-traits/lil/right_flipper/Football.png';
import LilRightFlipper_Surfboard_Blue from '@/assets/pfp-traits/lil/right_flipper/Surfboard_Blue.png';
import LilRightFlipper_Lollipop from '@/assets/pfp-traits/lil/right_flipper/Lollipop.png';
import LilRightFlipper_Balloon_Sword_Blue from '@/assets/pfp-traits/lil/right_flipper/Balloon_Sword_Blue.png';
import LilRightFlipper_Pickett_Sign from '@/assets/pfp-traits/lil/right_flipper/Pickett_Sign.png';
import LilRightFlipper_GM_Sign from '@/assets/pfp-traits/lil/right_flipper/GM_Sign.png';
import LilRightFlipper_Golden_Plunger from '@/assets/pfp-traits/lil/right_flipper/Golden_Plunger.png';
import LilRightFlipper_Sword_Gold from '@/assets/pfp-traits/lil/right_flipper/Sword_Gold.png';
import LilRightFlipper_Stick from '@/assets/pfp-traits/lil/right_flipper/Stick.png';
import LilRightFlipper_Kite_Green from '@/assets/pfp-traits/lil/right_flipper/Kite_Green.png';
import LilRightFlipper_Chocolate from '@/assets/pfp-traits/lil/right_flipper/Chocolate.png';
import LilRightFlipper_Plushie_Green from '@/assets/pfp-traits/lil/right_flipper/Plushie_Green.png';
import LilRightFlipper_Plushie_Pink from '@/assets/pfp-traits/lil/right_flipper/Plushie_Pink.png';
import LilRightFlipper_Plushie_Blue from '@/assets/pfp-traits/lil/right_flipper/Plushie_Blue.png';
import LilRightFlipper_Plushie_Black from '@/assets/pfp-traits/lil/right_flipper/Plushie_Black.png';
import LilRightFlipper_Balloon_Sword_Red from '@/assets/pfp-traits/lil/right_flipper/Balloon_Sword_Red.png';
import LilRightFlipper_Candycane_Green from '@/assets/pfp-traits/lil/right_flipper/Candycane_Green.png';
import LilRightFlipper_Candycane_Red from '@/assets/pfp-traits/lil/right_flipper/Candycane_Red.png';
import LilRightFlipper_Bat from '@/assets/pfp-traits/lil/right_flipper/Bat.png';
import LilRightFlipper_Basketball from '@/assets/pfp-traits/lil/right_flipper/Basketball.png';
import LilRightFlipper_Cheeseburger from '@/assets/pfp-traits/lil/right_flipper/Cheeseburger.png';
import LilRightFlipper_Balloon_Red from '@/assets/pfp-traits/lil/right_flipper/Balloon_Red.png';
import LilRightFlipper_Plushie_Red from '@/assets/pfp-traits/lil/right_flipper/Plushie_Red.png';
import LilRightFlipper_Balloon_Blue from '@/assets/pfp-traits/lil/right_flipper/Balloon_Blue.png';
import LilRightFlipper_Plunger from '@/assets/pfp-traits/lil/right_flipper/Plunger.png';
import LilRightFlipper_Plushie_Purple from '@/assets/pfp-traits/lil/right_flipper/Plushie_Purple.png';
import LilRightFlipper_Plushie_Gold from '@/assets/pfp-traits/lil/right_flipper/Plushie_Gold.png';
import LilRightFlipper_Balloon_Sword_Black from '@/assets/pfp-traits/lil/right_flipper/Balloon_Sword_Black.png';
import LilRightFlipper_Balloon_Sword_Purple from '@/assets/pfp-traits/lil/right_flipper/Balloon_Sword_Purple.png';
import LilRightFlipper_Sword from '@/assets/pfp-traits/lil/right_flipper/Sword.png';
import LilRightFlipper_Turkey_Leg from '@/assets/pfp-traits/lil/right_flipper/Turkey_Leg.png';
import LilRightFlipper_Juice_Box from '@/assets/pfp-traits/lil/right_flipper/Juice_Box.png';
import LilRightFlipper_Sword_Ice from '@/assets/pfp-traits/lil/right_flipper/Sword_Ice.png';
import LilRightFlipper_Plushie_Ice from '@/assets/pfp-traits/lil/right_flipper/Plushie_Ice.png';
import LilRightFlipper_Balloon_Gold from '@/assets/pfp-traits/lil/right_flipper/Balloon_Gold.png';
import LilRightFlipper_Spoon_Gold from '@/assets/pfp-traits/lil/right_flipper/Spoon_Gold.png';
import LilRightFlipper_Staff_Gold from '@/assets/pfp-traits/lil/right_flipper/Staff_Gold.png';
import LilRightFlipper_Rubber_Duck from '@/assets/pfp-traits/lil/right_flipper/Rubber_Duck.png';
import LilRightFlipper_Star_Wand from '@/assets/pfp-traits/lil/right_flipper/Star_Wand.png';
import LilRightFlipper_Kite_Gold from '@/assets/pfp-traits/lil/right_flipper/Kite_Gold.png';
import LilRightFlipper_Spoon from '@/assets/pfp-traits/lil/right_flipper/Spoon.png';
import LilRightFlipper_Ice_Cream from '@/assets/pfp-traits/lil/right_flipper/Ice_Cream.png';
// Import Lil right flipper OUTPUT trait overlays (used in place of regular traits when detected)
import LilRightFlipper_GM_Sign_Output from '@/assets/pfp-traits/lil/right_flipper/GM_Sign_Output.png';
import LilRightFlipper_Pickett_Sign_Output from '@/assets/pfp-traits/lil/right_flipper/Pickett_Sign_Output.png';
import LilRightFlipper_Plushie_Green_Output from '@/assets/pfp-traits/lil/right_flipper/Plushie_Green_Output.png';
import LilRightFlipper_Plushie_Pink_Output from '@/assets/pfp-traits/lil/right_flipper/Plushie_Pink_Output.png';
import LilRightFlipper_Plushie_Blue_Output from '@/assets/pfp-traits/lil/right_flipper/Plushie_Blue_Output.png';
import LilRightFlipper_Plushie_Black_Output from '@/assets/pfp-traits/lil/right_flipper/Plushie_Black_Output.png';
import LilRightFlipper_Plushie_Purple_Output from '@/assets/pfp-traits/lil/right_flipper/Plushie_Purple_Output.png';
import LilRightFlipper_Plushie_Gold_Output from '@/assets/pfp-traits/lil/right_flipper/Plushie_Gold_Output.png';
import LilRightFlipper_Plushie_Ice_Output from '@/assets/pfp-traits/lil/right_flipper/Plushie_Ice_Output.png';
import LilRightFlipper_Plushie_Red_Output from '@/assets/pfp-traits/lil/right_flipper/Plushie_Red_Output.png';

// Mapping for right flipper traits that have special output versions
const LIL_RIGHT_FLIPPER_OUTPUT_MAP: Record<string, string> = {
  GM_Sign: LilRightFlipper_GM_Sign_Output,
  Pickett_Sign: LilRightFlipper_Pickett_Sign_Output,
  Plushie_Green: LilRightFlipper_Plushie_Green_Output,
  Plushie_Pink: LilRightFlipper_Plushie_Pink_Output,
  Plushie_Blue: LilRightFlipper_Plushie_Blue_Output,
  Plushie_Black: LilRightFlipper_Plushie_Black_Output,
  Plushie_Purple: LilRightFlipper_Plushie_Purple_Output,
  Plushie_Gold: LilRightFlipper_Plushie_Gold_Output,
  Plushie_Ice: LilRightFlipper_Plushie_Ice_Output,
  Plushie_Red: LilRightFlipper_Plushie_Red_Output,
};

// Mapping of remapped Lil face trait names (_2 versions) to imported images
const LIL_FACE_REMAP_IMAGE_MAP: Record<string, string> = {
  Reading_Cute_2: LilReadingCute2,
  Reading_Cross_eyed_2: LilReadingCrossEyed2,
  Nerd_Normal_2: LilNerdNormal2,
  Scouter_2: LilScouter2,
  Goofy_Glasses_2: LilGoofyGlasses2,
  Nerd_Blushing_2: LilNerdBlushing2,
  Reading_Normal_2: LilReadingNormal2,
  Nerd_Cute_2: LilNerdCute2,
};

// Mapping of direct Lil face trait names to imported images (no remapping needed)
const LIL_FACE_DIRECT_MAP: Record<string, string> = {
  Circle_Glasses: LilCircleGlasses,
  Blushing: LilBlushing,
  Cross_Eyed: LilCrossEyed,
  Curious: LilCurious,
  Mad: LilMad,
  Normal: LilNormal,
  Reading_Cute: LilReadingCute,
  Winking: LilWinking,
};

// Mapping of Lil right flipper trait names to imported images
const LIL_RIGHT_FLIPPER_TRAIT_MAP: Record<string, string> = {
  Chop_Sticks: LilRightFlipper_Chop_Sticks,
  Kite_Red: LilRightFlipper_Kite_Red,
  Sunflower: LilRightFlipper_Sunflower,
  Surfboard_Tan: LilRightFlipper_Surfboard_Tan,
  Roses: LilRightFlipper_Roses,
  Carrot: LilRightFlipper_Carrot,
  Croissant: LilRightFlipper_Croissant,
  Popsicle: LilRightFlipper_Popsicle,
  Maraca: LilRightFlipper_Maraca,
  Football: LilRightFlipper_Football,
  Surfboard_Blue: LilRightFlipper_Surfboard_Blue,
  Lollipop: LilRightFlipper_Lollipop,
  Balloon_Sword_Blue: LilRightFlipper_Balloon_Sword_Blue,
  Pickett_Sign: LilRightFlipper_Pickett_Sign,
  GM_Sign: LilRightFlipper_GM_Sign,
  Golden_Plunger: LilRightFlipper_Golden_Plunger,
  Sword_Gold: LilRightFlipper_Sword_Gold,
  Stick: LilRightFlipper_Stick,
  Kite_Green: LilRightFlipper_Kite_Green,
  Chocolate: LilRightFlipper_Chocolate,
  Plushie_Green: LilRightFlipper_Plushie_Green,
  Plushie_Pink: LilRightFlipper_Plushie_Pink,
  Plushie_Blue: LilRightFlipper_Plushie_Blue,
  Plushie_Black: LilRightFlipper_Plushie_Black,
  Balloon_Sword_Red: LilRightFlipper_Balloon_Sword_Red,
  Candycane_Green: LilRightFlipper_Candycane_Green,
  Candycane_Red: LilRightFlipper_Candycane_Red,
  Bat: LilRightFlipper_Bat,
  Basketball: LilRightFlipper_Basketball,
  Cheeseburger: LilRightFlipper_Cheeseburger,
  Balloon_Red: LilRightFlipper_Balloon_Red,
  Plushie_Red: LilRightFlipper_Plushie_Red,
  Balloon_Blue: LilRightFlipper_Balloon_Blue,
  Plunger: LilRightFlipper_Plunger,
  Plushie_Purple: LilRightFlipper_Plushie_Purple,
  Plushie_Gold: LilRightFlipper_Plushie_Gold,
  Balloon_Sword_Black: LilRightFlipper_Balloon_Sword_Black,
  Balloon_Sword_Purple: LilRightFlipper_Balloon_Sword_Purple,
  Sword: LilRightFlipper_Sword,
  Turkey_Leg: LilRightFlipper_Turkey_Leg,
  Juice_Box: LilRightFlipper_Juice_Box,
  Sword_Ice: LilRightFlipper_Sword_Ice,
  Plushie_Ice: LilRightFlipper_Plushie_Ice,
  Balloon_Gold: LilRightFlipper_Balloon_Gold,
  Spoon_Gold: LilRightFlipper_Spoon_Gold,
  Staff_Gold: LilRightFlipper_Staff_Gold,
  Rubber_Duck: LilRightFlipper_Rubber_Duck,
  Star_Wand: LilRightFlipper_Star_Wand,
  Kite_Gold: LilRightFlipper_Kite_Gold,
  Spoon: LilRightFlipper_Spoon,
  Ice_Cream: LilRightFlipper_Ice_Cream,
};

// Head traits that require Template_2 instead of the default Template
const TEMPLATE_2_HEAD_TRAITS = [
  'Headband',
  'Backwards_Hat_Red',
  'Backwards_Hat_Blue',
  'Hat_Red',
  'Hat_Blue',
  'Jester_Hat',
  'Sideways_Blue',
  'Sideways_Red',
  'Blue_Durag',
  'Red_Durag',
  'Ninja_Headband',
];

// Face traits that require Template_2 instead of the default Template
const TEMPLATE_2_FACE_TRAITS = [
  'Villain_Mask',
];

// Import all head trait overlays
import Afro_with_Pick from '@/assets/pfp-traits/head/Afro_with_Pick.png';
import Backwards_Hat_Blue from '@/assets/pfp-traits/head/Backwards_Hat_Blue.png';
import Backwards_Hat_Red from '@/assets/pfp-traits/head/Backwards_Hat_Red.png';
import Banana_Suit from '@/assets/pfp-traits/head/Banana_Suit.png';
import Beanie_Gray from '@/assets/pfp-traits/head/Beanie_Gray.png';
import Beanie_Orange from '@/assets/pfp-traits/head/Beanie_Orange.png';
import Biker_Helmet from '@/assets/pfp-traits/head/Biker_Helmet.png';
import Blue_Durag from '@/assets/pfp-traits/head/Blue_Durag.png';
import Bucket_Hat_Green from '@/assets/pfp-traits/head/Bucket_Hat_Green.png';
import Bucket_Hat_Tan from '@/assets/pfp-traits/head/Bucket_Hat_Tan.png';
import Camo_Helmet from '@/assets/pfp-traits/head/Camo_Helmet.png';
import Cowboy_Hat from '@/assets/pfp-traits/head/Cowboy_Hat.png';
import Crown from '@/assets/pfp-traits/head/Crown.png';
import Egg from '@/assets/pfp-traits/head/Egg.png';
import Egg_Gold from '@/assets/pfp-traits/head/Egg_Gold.png';
import Fish_Blue from '@/assets/pfp-traits/head/Fish_Blue.png';
import Fish_Gold from '@/assets/pfp-traits/head/Fish_Gold.png';
import Fish_Green from '@/assets/pfp-traits/head/Fish_Green.png';
import Fish_Orange from '@/assets/pfp-traits/head/Fish_Orange.png';
import Flat_Cap_Black from '@/assets/pfp-traits/head/Flat_Cap_Black.png';
import Flat_Cap_Blue from '@/assets/pfp-traits/head/Flat_Cap_Blue.png';
import Flat_Cap_Tan from '@/assets/pfp-traits/head/Flat_Cap_Tan.png';
import Flower_Crown from '@/assets/pfp-traits/head/Flower_Crown.png';
import Ghost from '@/assets/pfp-traits/head/Ghost.png';
import Grizzly_Bear_Hat from '@/assets/pfp-traits/head/Grizzly_Bear_Hat.png';
import Hat_Blue from '@/assets/pfp-traits/head/Hat_Blue.png';
import Hat_Red from '@/assets/pfp-traits/head/Hat_Red.png';
import Hatched from '@/assets/pfp-traits/head/Hatched.png';
import Hatched_Gold from '@/assets/pfp-traits/head/Hatched_Gold.png';
import Headband from '@/assets/pfp-traits/head/Headband.png';
import Hippy_Hair from '@/assets/pfp-traits/head/Hippy_Hair.png';
import Ice_Crown from '@/assets/pfp-traits/head/Ice_Crown.png';
import Jester_Hat from '@/assets/pfp-traits/head/Jester_Hat.png';
import Macaroni from '@/assets/pfp-traits/head/Macaroni.png';
import Mohawk_Green from '@/assets/pfp-traits/head/Mohawk_Green.png';
import Mohawk_Purple from '@/assets/pfp-traits/head/Mohawk_Purple.png';
import Ninja_Headband from '@/assets/pfp-traits/head/Ninja_Headband.png';
import Panda_Hat from '@/assets/pfp-traits/head/Panda_Hat.png';
import Party_Hat from '@/assets/pfp-traits/head/Party_Hat.png';
import Pineapple from '@/assets/pfp-traits/head/Pineapple.png';
import Pink_Beanie from '@/assets/pfp-traits/head/Pink_Beanie.png';
import Pirate_Hat from '@/assets/pfp-traits/head/Pirate_Hat.png';
import Polar_Bear_Hat from '@/assets/pfp-traits/head/Polar_Bear_Hat.png';
import Red_Durag from '@/assets/pfp-traits/head/Red_Durag.png';
import Rice_Hat from '@/assets/pfp-traits/head/Rice_Hat.png';
import Santa_Hat from '@/assets/pfp-traits/head/Santa_Hat.png';
import Shark_Suit from '@/assets/pfp-traits/head/Shark_Suit.png';
import Sideways_Blue from '@/assets/pfp-traits/head/Sideways_Blue.png';
import Sideways_Red from '@/assets/pfp-traits/head/Sideways_Red.png';
import Sombrero from '@/assets/pfp-traits/head/Sombrero.png';
import Top_Hat from '@/assets/pfp-traits/head/Top_Hat.png';
import Viking_Hat from '@/assets/pfp-traits/head/Viking_Hat.png';
import Wizard_Hat from '@/assets/pfp-traits/head/Wizard_Hat.png';

// Import all face trait overlays
import Handlebar_Bear from '@/assets/pfp-traits/face/Handlebar_Bear.png';
import Football from '@/assets/pfp-traits/face/Football.png';
import Goggles from '@/assets/pfp-traits/face/Goggles.png';
import Moustache from '@/assets/pfp-traits/face/Moustache.png';
import Hero_Mask_Blue from '@/assets/pfp-traits/face/Hero_Mask_Blue.png';
import Hero_Mask_Red from '@/assets/pfp-traits/face/Hero_Mask_Red.png';
import Star_Glasses from '@/assets/pfp-traits/face/Star_Glasses.png';
import Villain_Mask from '@/assets/pfp-traits/face/Villain_Mask.png';
import Circle_Glasses from '@/assets/pfp-traits/face/Circle_Glasses.png';
import Blush from '@/assets/pfp-traits/face/Blush.png';
import Scouter from '@/assets/pfp-traits/face/Scouter.png';
import Star_Eyes from '@/assets/pfp-traits/face/Star_Eyes.png';
import Clout_Goggles from '@/assets/pfp-traits/face/Clout_Goggles.png';
import Aviators from '@/assets/pfp-traits/face/Aviators.png';
import Beard from '@/assets/pfp-traits/face/Beard.png';
import Scar from '@/assets/pfp-traits/face/Scar.png';
import Cucumbers from '@/assets/pfp-traits/face/Cucumbers.png';
import Eye_Patch from '@/assets/pfp-traits/face/Eye_Patch.png';
import Squad from '@/assets/pfp-traits/face/Squad.png';
import Monacle from '@/assets/pfp-traits/face/Monacle.png';

// Import all body trait overlays
import Lei_Blue from '@/assets/pfp-traits/body/Lei_Blue.png';
import Lei_Purple from '@/assets/pfp-traits/body/Lei_Purple.png';
import Lei_Pink from '@/assets/pfp-traits/body/Lei_Pink.png';
import Hoodie_Black from '@/assets/pfp-traits/body/Hoodie_Black.png';
import Hoodie_Pink from '@/assets/pfp-traits/body/Hoodie_Pink.png';
import Puffer_Orange from '@/assets/pfp-traits/body/Puffer_Orange.png';
import Puffer_Blue from '@/assets/pfp-traits/body/Puffer_Blue.png';
import Puffer_Green from '@/assets/pfp-traits/body/Puffer_Green.png';
import Bow_Tie_Blue from '@/assets/pfp-traits/body/Bow_Tie_Blue.png';
import Bowtie_Black from '@/assets/pfp-traits/body/Bowtie_Black.png';
import Bowtie_Pink from '@/assets/pfp-traits/body/Bowtie_Pink.png';
import Turtleneck_Pink from '@/assets/pfp-traits/body/Turtleneck_Pink.png';
import Turtleneck_Green from '@/assets/pfp-traits/body/Turtleneck_Green.png';
import Kimono_Brown from '@/assets/pfp-traits/body/Kimono_Brown.png';
import Kimono_Red from '@/assets/pfp-traits/body/Kimono_Red.png';
import Kimono_White from '@/assets/pfp-traits/body/Kimono_White.png';
import Kimono_Orange from '@/assets/pfp-traits/body/Kimono_Orange.png';
import Kimono_Blue from '@/assets/pfp-traits/body/Kimono_Blue.png';
import Kimono_Abstract from '@/assets/pfp-traits/body/Kimono_Abstract.png';
import Blue_Shirt from '@/assets/pfp-traits/body/Blue_Shirt.png';
import Hawaiian_Shirt from '@/assets/pfp-traits/body/Hawaiian_Shirt.png';
import Bronze_Medal from '@/assets/pfp-traits/body/Bronze_Medal.png';
import Silver_Medal from '@/assets/pfp-traits/body/Silver_Medal.png';
import Gold_Medal from '@/assets/pfp-traits/body/Gold_Medal.png';
import Scarf_Pink from '@/assets/pfp-traits/body/Scarf_Pink.png';
import Overalls from '@/assets/pfp-traits/body/Overalls.png';
import Poncho from '@/assets/pfp-traits/body/Poncho.png';
import Surfboard_Necklace from '@/assets/pfp-traits/body/Surfboard_Necklace.png';
import Christmas_Lights from '@/assets/pfp-traits/body/Christmas_Lights.png';
import Ice_Coat from '@/assets/pfp-traits/body/Ice_Coat.png';
import Tribal_Necklace from '@/assets/pfp-traits/body/Tribal_Necklace.png';
import Heart from '@/assets/pfp-traits/body/Heart.png';
import Crop_Top from '@/assets/pfp-traits/body/Crop_Top.png';
import Biker_Jacket from '@/assets/pfp-traits/body/Biker_Jacket.png';
import Swordman from '@/assets/pfp-traits/body/Swordman.png';
import Kimono_Pink from '@/assets/pfp-traits/body/Kimono_Pink.png';
import Kimono_Gold from '@/assets/pfp-traits/body/Kimono_Gold.png';
import Kimono_Ice from '@/assets/pfp-traits/body/Kimono_Ice.png';
import Suit_Blue from '@/assets/pfp-traits/body/Suit_Blue.png';
import Suit_Red from '@/assets/pfp-traits/body/Suit_Red.png';
import Pudgy_Man from '@/assets/pfp-traits/body/Pudgy_Man.png';
import Lei_Assorted from '@/assets/pfp-traits/body/Lei_Assorted.png';
import I_Love_Fish from '@/assets/pfp-traits/body/I_Love_Fish.png';
import Big_P from '@/assets/pfp-traits/body/Big_P.png';
import Shark_Tooth from '@/assets/pfp-traits/body/Shark_Tooth.png';
import Christmas_Sweater_Red from '@/assets/pfp-traits/body/Christmas_Sweater_Red.png';
import Christmas_Sweater_Blue from '@/assets/pfp-traits/body/Christmas_Sweater_Blue.png';
import The_Huddle from '@/assets/pfp-traits/body/The_Huddle.png';
import Tanktop_Yellow from '@/assets/pfp-traits/body/Tanktop_Yellow.png';
import Tanktop_Blue from '@/assets/pfp-traits/body/Tanktop_Blue.png';
import Vote_4_Pudgy from '@/assets/pfp-traits/body/Vote_4_Pudgy.png';
import Turtleneck_Gray from '@/assets/pfp-traits/body/Turtleneck_Gray.png';
import Turtleneck_Blue from '@/assets/pfp-traits/body/Turtleneck_Blue.png';
import Labcoat from '@/assets/pfp-traits/body/Labcoat.png';
import Apron from '@/assets/pfp-traits/body/Apron.png';
import Scarf_Blue from '@/assets/pfp-traits/body/Scarf_Blue.png';
import Scarf_Green from '@/assets/pfp-traits/body/Scarf_Green.png';
import Shirt_Red from '@/assets/pfp-traits/body/Shirt_Red.png';
import Bathrobe from '@/assets/pfp-traits/body/Bathrobe.png';

// Mapping of trait names to imported images
const HEAD_TRAIT_MAP: Record<string, string> = {
  Afro_with_Pick,
  Backwards_Hat_Blue,
  Backwards_Hat_Red,
  Banana_Suit,
  Beanie_Gray,
  Beanie_Orange,
  Biker_Helmet,
  Blue_Durag,
  Bucket_Hat_Green,
  Bucket_Hat_Tan,
  Camo_Helmet,
  Cowboy_Hat,
  Crown,
  Egg,
  Egg_Gold,
  Fish_Blue,
  Fish_Gold,
  Fish_Green,
  Fish_Orange,
  Flat_Cap_Black,
  Flat_Cap_Blue,
  Flat_Cap_Tan,
  Flower_Crown,
  Ghost,
  Grizzly_Bear_Hat,
  Hat_Blue,
  Hat_Red,
  Hatched,
  Hatched_Gold,
  Headband,
  Hippy_Hair,
  Ice_Crown,
  Jester_Hat,
  Macaroni,
  Mohawk_Green,
  Mohawk_Purple,
  Ninja_Headband,
  Panda_Hat,
  Party_Hat,
  Pineapple,
  Pink_Beanie,
  Pirate_Hat,
  Polar_Bear_Hat,
  Red_Durag,
  Rice_Hat,
  Santa_Hat,
  Shark_Suit,
  Sideways_Blue,
  Sideways_Red,
  Sombrero,
  Top_Hat,
  Viking_Hat,
  Wizard_Hat,
};

// Mapping of face trait names to imported images
const FACE_TRAIT_MAP: Record<string, string> = {
  Handlebar_Bear,
  Football,
  Goggles,
  Moustache,
  Hero_Mask_Blue,
  Hero_Mask_Red,
  Star_Glasses,
  Villain_Mask,
  Circle_Glasses,
  Blush,
  Scouter,
  Star_Eyes,
  Clout_Goggles,
  Aviators,
  Beard,
  Scar,
  Cucumbers,
  Eye_Patch,
  Squad,
  Monacle,
};

// Mapping of body trait names to imported images
const BODY_TRAIT_MAP: Record<string, string> = {
  Lei_Blue,
  Lei_Purple,
  Lei_Pink,
  Hoodie_Black,
  Hoodie_Pink,
  Puffer_Orange,
  Puffer_Blue,
  Puffer_Green,
  Bow_Tie_Blue,
  Bowtie_Black,
  Bowtie_Pink,
  Turtleneck_Pink,
  Turtleneck_Green,
  Kimono_Brown,
  Kimono_Red,
  Kimono_White,
  Kimono_Orange,
  Kimono_Blue,
  Kimono_Abstract,
  Blue_Shirt,
  Hawaiian_Shirt,
  Bronze_Medal,
  Silver_Medal,
  Gold_Medal,
  Scarf_Pink,
  Overalls,
  Poncho,
  Surfboard_Necklace,
  Christmas_Lights,
  Ice_Coat,
  Tribal_Necklace,
  Heart,
  Crop_Top,
  Biker_Jacket,
  Swordman,
  Kimono_Pink,
  Kimono_Gold,
  Kimono_Ice,
  Suit_Blue,
  Suit_Red,
  Pudgy_Man,
  Lei_Assorted,
  I_Love_Fish,
  Big_P,
  Shark_Tooth,
  Christmas_Sweater_Red,
  Christmas_Sweater_Blue,
  The_Huddle,
  Tanktop_Yellow,
  Tanktop_Blue,
  Vote_4_Pudgy,
  Turtleneck_Gray,
  Turtleneck_Blue,
  Labcoat,
  Apron,
  Scarf_Blue,
  Scarf_Green,
  Shirt_Red,
  Bathrobe,
};

interface DetectedTraits {
  isPudgy: boolean;
  isSpecialPenguin?: 'left_facing' | 'gold_kimono_special' | 
    'pudgy_knight_black' | 'pudgy_knight_ice' | 'pudgy_knight_blue' | 
    'pudgy_knight_purple' | 'pudgy_knight_white' | 'pudgy_knight_gray' | 
    'pudgy_knight_gold' | 'pudgy_knight_red' | null;
  traits: {
    background: string | null;
    skin: string | null;
    body: string | null;
    face: string | null;
    head: string | null;
    right_flipper: string | null;
    hand: string | null;
  };
  confidence: 'high' | 'medium' | 'low';
  description: string;
}

type AnalysisStep = 'idle' | 'uploading' | 'analyzing' | 'compositing' | 'complete' | 'error';

const PFPConverter = () => {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [detectedTraits, setDetectedTraits] = useState<DetectedTraits | null>(null);
  const [retsbafiedImage, setRetsbafiedImage] = useState<string | null>(null);
  const [step, setStep] = useState<AnalysisStep>('idle');
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLilMode, setIsLilMode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isAutoSwitchingRef = useRef(false);
  const isLilModeRef = useRef(isLilMode); // Track current mode to avoid stale closures
  
  // Keep the ref in sync with state
  useEffect(() => {
    isLilModeRef.current = isLilMode;
  }, [isLilMode]);

  // Clear uploaded image when manually switching between Big and Lil modes
  useEffect(() => {
    if (isAutoSwitchingRef.current) {
      // Don't clear when auto-switching from detection
      isAutoSwitchingRef.current = false;
      return;
    }
    setUploadedImage(null);
    setDetectedTraits(null);
    setRetsbafiedImage(null);
    setStep('idle');
    setError(null);
  }, [isLilMode]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      processFile(file);
    } else {
      toast.error('Please upload an image file');
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  }, []);

  const processFile = async (file: File) => {
    setStep('uploading');
    setError(null);
    setDetectedTraits(null);
    setRetsbafiedImage(null);

    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result as string;
      setUploadedImage(base64);
      await analyzeImage(base64);
    };
    reader.readAsDataURL(file);
  };

  const analyzeImage = async (imageBase64: string, isReanalysis: boolean = false) => {
    setStep('analyzing');
    
    try {
      // Get current mode from ref to avoid stale closure
      const currentIsLilMode = isLilModeRef.current;
      
      const { data, error } = await supabase.functions.invoke('analyze-pudgy', {
        body: { 
          imageBase64,
          expectedMode: currentIsLilMode ? 'lil' : 'big' // Tell the AI what mode we're in
        }
      });

      if (error) {
        // Check if the error contains a more specific message from the edge function
        const errorMessage = error.message || 'Failed to analyze image';
        
        // Handle specific error cases
        if (errorMessage.includes('402') || errorMessage.includes('credits')) {
          throw new Error('AI credits exhausted. Please try again later or contact support.');
        }
        if (errorMessage.includes('429') || errorMessage.includes('rate limit')) {
          throw new Error('Too many requests. Please wait a moment and try again.');
        }
        
        throw new Error(errorMessage);
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      if (!data.isPudgy) {
        setError("This doesn't appear to be a Pudgy Penguin NFT. Please upload a valid Pudgy image.");
        setStep('error');
        return;
      }

      // Determine the correct mode based on detection
      const detectedIsLil = data.isLilPudgy === true;
      
      // If mode mismatch and this is NOT a re-analysis, switch mode and re-analyze
      if (detectedIsLil !== currentIsLilMode && !isReanalysis) {
        console.log(`Mode mismatch detected: expected ${currentIsLilMode ? 'Lil' : 'Big'}, got ${detectedIsLil ? 'Lil' : 'Big'}. Switching and re-analyzing...`);
        
        // Switch to the correct mode
        isAutoSwitchingRef.current = true;
        setIsLilMode(detectedIsLil);
        isLilModeRef.current = detectedIsLil; // Update ref immediately for re-analysis
        
        toast.info(`Detected a ${detectedIsLil ? 'Lil Pudgy' : 'Big Pudgy'}! Re-analyzing with correct mode...`);
        
        // Re-analyze with the correct mode (mark as re-analysis to prevent infinite loop)
        await analyzeImage(imageBase64, true);
        return; // Exit this call, the re-analysis will handle the rest
      }

      setDetectedTraits(data);
      setStep('compositing');
      
      // Generate the Retsbafied image using the DETECTED mode
      await generateRetsbafiedImage(data, detectedIsLil);
      
    } catch (err) {
      console.error('Analysis error:', err);
      setError(err instanceof Error ? err.message : 'Failed to analyze image');
      setStep('error');
    }
  };

  const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  };

  const generateRetsbafiedImage = async (traits: DetectedTraits, useLilMode: boolean) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 1000;
    canvas.height = 1000;

    try {
      // Check for special penguins first - these use unique templates with NO trait overlays
      
      // Special 1:1 Lil Pudgy variants with unique output templates (Pudgy Knights and others)
      if (traits.isSpecialPenguin && LIL_SPECIAL_OUTPUT_MAP[traits.isSpecialPenguin]) {
        const specialTemplate = LIL_SPECIAL_OUTPUT_MAP[traits.isSpecialPenguin];
        console.log(`Special Lil Pudgy detected: ${traits.isSpecialPenguin}. Using dedicated output template.`);
        const baseImg = await loadImage(specialTemplate);
        ctx.drawImage(baseImg, 0, 0, 1000, 1000);
        const dataUrl = canvas.toDataURL('image/png');
        setRetsbafiedImage(dataUrl);
        setStep('complete');
        
        // Format the special penguin name for display
        const displayName = traits.isSpecialPenguin
          .replace('pudgy_knight_', 'Pudgy Knight ')
          .replace('lil_', '')
          .split('_')
          .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
        toast.success(`${displayName} detected! Retsbafied with special template.`);
        return;
      }
      
      if (traits.isSpecialPenguin === 'left_facing') {
        console.log('Special penguin detected: Left-Facing. Using Backwards_Template with no overlays.');
        const baseImg = await loadImage(Backwards_Template);
        ctx.drawImage(baseImg, 0, 0, 1000, 1000);
        const dataUrl = canvas.toDataURL('image/png');
        setRetsbafiedImage(dataUrl);
        setStep('complete');
        toast.success('Special Left-Facing Penguin detected! Retsbafied with Backwards Template.');
        return;
      }
      
      // Gold Kimono Special penguin - uses Gold_Template_2 with Kimono_Gold overlay
      if (traits.isSpecialPenguin === 'gold_kimono_special') {
        console.log('Special penguin detected: Gold Kimono Special. Using Gold_Template_2 with Kimono_Gold and Backwards_Hat_Red overlays.');
        // Use Gold_Template_2 as base (for backwards hat compatibility)
        const baseImg = await loadImage(Gold_Template_2);
        ctx.drawImage(baseImg, 0, 0, 1000, 1000);
        
        // Apply Kimono_Gold body overlay
        if (BODY_TRAIT_MAP['Kimono_Gold']) {
          const bodyOverlay = await loadImage(BODY_TRAIT_MAP['Kimono_Gold']);
          ctx.drawImage(bodyOverlay, 0, 0, 1000, 1000);
        }
        
        // Apply Backwards_Hat_Red head overlay
        if (HEAD_TRAIT_MAP['Backwards_Hat_Red']) {
          const headOverlay = await loadImage(HEAD_TRAIT_MAP['Backwards_Hat_Red']);
          ctx.drawImage(headOverlay, 0, 0, 1000, 1000);
        }
        
        const dataUrl = canvas.toDataURL('image/png');
        setRetsbafiedImage(dataUrl);
        setStep('complete');
        toast.success('Special Gold Kimono Penguin detected! Retsbafied with Gold Template.');
        return;
      }
      
      // Determine which template to use based on skin, head, or face trait
      const headTrait = traits.traits.head;
      const faceTrait = traits.traits.face;
      const bodyTrait = traits.traits.body;
      const skinTrait = traits.traits.skin?.toLowerCase() || '';
      
      // Check for special skin types
      const isGoldSkin = skinTrait.includes('gold') || skinTrait.includes('golden');
      const isIceSkin = skinTrait.includes('ice');
      
      // Check if Template_2 traits are present
      const hasTemplate2Trait = (headTrait && TEMPLATE_2_HEAD_TRAITS.includes(headTrait)) || 
                                (faceTrait && TEMPLATE_2_FACE_TRAITS.includes(faceTrait));
      
      let templateSrc = Template;
      let templateName = 'Template';
      
      // Handle Lil mode template selection
      if (useLilMode) {
        // Check if face trait requires blank template (no eyes on base)
        const needsBlankTemplate = faceTrait && LIL_BLANK_FACE_TRAITS.includes(faceTrait);
        
        if (needsBlankTemplate) {
          templateSrc = Lil_Template_Blank;
          templateName = 'Lil_Template_Blank';
        } else {
          templateSrc = Lil_Template;
          templateName = 'Lil_Template';
        }
      } else if (isIceSkin && hasTemplate2Trait) {
        // Ice skin + Template_2 trait = Ice_Template_2
        templateSrc = Ice_Template_2;
        templateName = 'Ice_Template_2';
      } else if (isIceSkin) {
        // Ice skin only = Ice_Template
        templateSrc = Ice_Template;
        templateName = 'Ice_Template';
      } else if (isGoldSkin && hasTemplate2Trait) {
        // Gold skin + Template_2 trait = Gold_Template_2
        templateSrc = Gold_Template_2;
        templateName = 'Gold_Template_2';
      } else if (isGoldSkin) {
        // Gold skin only = Gold_Template
        templateSrc = Gold_Template;
        templateName = 'Gold_Template';
      } else if (hasTemplate2Trait) {
        // Template_2 trait only = Template_2
        templateSrc = Template_2;
        templateName = 'Template_2';
      }
      
      console.log(`Using template: ${templateName} for skin: ${skinTrait}, head: ${headTrait}, face: ${faceTrait}, body: ${bodyTrait}`);
      
      // Load and draw base template
      const baseImg = await loadImage(templateSrc);
      ctx.drawImage(baseImg, 0, 0, 1000, 1000);

      // LAYERING ORDER: body (bottom) → face → head (top)
      
      // In Lil mode, only use Lil-specific trait overlays (never fall back to Big traits)
      // In Big mode, only use Big-specific trait overlays
      
      // 1. Apply body trait overlay first (bottom layer)
      if (bodyTrait) {
        if (useLilMode) {
          // TODO: Add LIL_BODY_TRAIT_MAP when Lil body traits are uploaded
          console.log(`Lil mode: No Lil body overlay available for: ${bodyTrait}`);
        } else if (BODY_TRAIT_MAP[bodyTrait]) {
          console.log(`Applying body trait: ${bodyTrait}`);
          const bodyOverlay = await loadImage(BODY_TRAIT_MAP[bodyTrait]);
          ctx.drawImage(bodyOverlay, 0, 0, 1000, 1000);
        } else {
          console.log(`No overlay found for body trait: ${bodyTrait}`);
        }
      }

      // 2. Apply face trait overlay (middle layer)
      if (faceTrait) {
        if (useLilMode) {
          // In Lil mode, first check if the trait should be remapped to a different overlay
          if (LIL_FACE_TRAIT_REMAP[faceTrait]) {
            const remappedTrait = LIL_FACE_TRAIT_REMAP[faceTrait];
            if (LIL_FACE_REMAP_IMAGE_MAP[remappedTrait]) {
              console.log(`Applying Lil face trait (remapped): ${faceTrait} -> ${remappedTrait}`);
              const faceOverlay = await loadImage(LIL_FACE_REMAP_IMAGE_MAP[remappedTrait]);
              ctx.drawImage(faceOverlay, 0, 0, 1000, 1000);
            } else {
              console.log(`Lil mode: No Lil overlay found for remapped face trait: ${remappedTrait}`);
            }
          } else if (LIL_FACE_DIRECT_MAP[faceTrait]) {
            // Direct 1:1 mapping for Lil face traits
            console.log(`Applying Lil face trait (direct): ${faceTrait}`);
            const faceOverlay = await loadImage(LIL_FACE_DIRECT_MAP[faceTrait]);
            ctx.drawImage(faceOverlay, 0, 0, 1000, 1000);
          } else {
            console.log(`Lil mode: No Lil face overlay available for: ${faceTrait}`);
          }
        } else if (FACE_TRAIT_MAP[faceTrait]) {
          console.log(`Applying face trait: ${faceTrait}`);
          const faceOverlay = await loadImage(FACE_TRAIT_MAP[faceTrait]);
          ctx.drawImage(faceOverlay, 0, 0, 1000, 1000);
        } else {
          console.log(`No overlay found for face trait: ${faceTrait}`);
        }
      }

      // 3. Apply head trait overlay (top layer for Big, middle for Lil)
      if (headTrait) {
        if (useLilMode) {
          // TODO: Add LIL_HEAD_TRAIT_MAP when Lil head traits are uploaded
          console.log(`Lil mode: No Lil head overlay available for: ${headTrait}`);
        } else if (HEAD_TRAIT_MAP[headTrait]) {
          console.log(`Applying head trait: ${headTrait}`);
          const headOverlay = await loadImage(HEAD_TRAIT_MAP[headTrait]);
          ctx.drawImage(headOverlay, 0, 0, 1000, 1000);
        } else {
          console.log(`No overlay found for head trait: ${headTrait}`);
        }
      }

      // 4. Apply right flipper trait overlay (Lil Pudgy only - top layer)
      const rightFlipperTrait = traits.traits.right_flipper;
      if (rightFlipperTrait && useLilMode) {
        // Check if this trait has a special output version first
        if (LIL_RIGHT_FLIPPER_OUTPUT_MAP[rightFlipperTrait]) {
          console.log(`Applying Lil right flipper OUTPUT trait: ${rightFlipperTrait}`);
          const rightFlipperOverlay = await loadImage(LIL_RIGHT_FLIPPER_OUTPUT_MAP[rightFlipperTrait]);
          ctx.drawImage(rightFlipperOverlay, 0, 0, 1000, 1000);
        } else if (LIL_RIGHT_FLIPPER_TRAIT_MAP[rightFlipperTrait]) {
          console.log(`Applying Lil right flipper trait: ${rightFlipperTrait}`);
          const rightFlipperOverlay = await loadImage(LIL_RIGHT_FLIPPER_TRAIT_MAP[rightFlipperTrait]);
          ctx.drawImage(rightFlipperOverlay, 0, 0, 1000, 1000);
        } else {
          console.log(`No overlay found for right flipper trait: ${rightFlipperTrait}`);
        }
      }

      const dataUrl = canvas.toDataURL('image/png');
      setRetsbafiedImage(dataUrl);
      setStep('complete');
      toast.success('Your Pudgy has been Retsbafied!');
    } catch (err) {
      console.error('Compositing error:', err);
      setError('Failed to generate Retsbafied image');
      setStep('error');
    }
  };

  const handleDownload = () => {
    if (!retsbafiedImage) return;
    
    const link = document.createElement('a');
    link.download = 'retsbafied-pudgy.png';
    link.href = retsbafiedImage;
    link.click();
  };

  const handleReset = () => {
    setUploadedImage(null);
    setDetectedTraits(null);
    setRetsbafiedImage(null);
    setStep('idle');
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getStepMessage = () => {
    switch (step) {
      case 'uploading': return 'Uploading your Pudgy...';
      case 'analyzing': return 'Assimilating...';
      case 'compositing': return 'Creating your Retsbafied image...';
      case 'complete': return 'Your Pudgy has been Retsbafied!';
      case 'error': return error || 'Something went wrong';
      default: return '';
    }
  };

  // Format trait name for display
  const formatTraitName = (trait: string | null) => {
    if (!trait) return null;
    return trait.replace(/_/g, ' ');
  };

  // Determine if we should show the result view on mobile (after upload started)
  const showMobileResult = step !== 'idle' && uploadedImage;

  return (
    <div className="w-full">
      <canvas ref={canvasRef} className="hidden" />
      
      {/* Mobile Layout - Single unified window */}
      <div className="lg:hidden space-y-4">
        {/* Mobile Toggle */}
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-black dark:text-white">
            {showMobileResult ? 'Retsbafied' : isLilMode ? 'Your Lil' : 'Your Pudgy'}
          </h2>
          <div className="flex items-center gap-2 bg-black/5 dark:bg-white/5 rounded-full px-3 py-1.5">
            <span className={`text-xs font-medium transition-colors ${!isLilMode ? 'text-black dark:text-white' : 'text-black/40 dark:text-white/40'}`}>
              Big
            </span>
            <Switch
              checked={isLilMode}
              onCheckedChange={setIsLilMode}
              className="data-[state=checked]:bg-primary scale-90"
            />
            <span className={`text-xs font-medium transition-colors ${isLilMode ? 'text-black dark:text-white' : 'text-black/40 dark:text-white/40'}`}>
              Lil
            </span>
          </div>
        </div>
        <p className="text-black/60 dark:text-white/60 text-sm -mt-2">
          {showMobileResult ? 'Your Retsba' : isLilMode ? 'Upload your Lil Pudgy NFT' : 'Upload your Pudgy Penguin NFT'}
        </p>

        <div
            className={`relative border-2 rounded-xl p-6 transition-all duration-300 min-h-[320px] flex items-center justify-center ${
              showMobileResult 
                ? 'border-black/10 dark:border-white/20 bg-gradient-to-br from-primary/5 to-transparent'
                : isDragging 
                  ? 'border-primary bg-primary/10 border-dashed cursor-pointer' 
                  : 'border-black/20 dark:border-white/20 hover:border-black/40 dark:hover:border-white/40 bg-black/5 dark:bg-white/5 border-dashed cursor-pointer'
            }`}
            onDragOver={!showMobileResult ? handleDragOver : undefined}
            onDragLeave={!showMobileResult ? handleDragLeave : undefined}
            onDrop={!showMobileResult ? handleDrop : undefined}
            onClick={!showMobileResult ? () => fileInputRef.current?.click() : undefined}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />

            <AnimatePresence mode="wait">
              {/* Upload state - no image yet */}
              {step === 'idle' && !uploadedImage && (
                <motion.div
                  key="mobile-upload"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center"
                >
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-black/10 dark:bg-white/10 flex items-center justify-center">
                    <Upload className="w-8 h-8 text-black/40 dark:text-white/40" />
                  </div>
                  <p className="text-black dark:text-white font-medium mb-2">Drop your Pudgy here</p>
                  <p className="text-black/40 dark:text-white/40 text-sm">or click to browse</p>
                </motion.div>
              )}

              {/* Processing state */}
              {(step === 'uploading' || step === 'analyzing' || step === 'compositing') && (
                <motion.div
                  key="mobile-processing"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center"
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    className="w-12 h-12 mx-auto mb-4"
                  >
                    <RefreshCw className="w-12 h-12 text-primary" />
                  </motion.div>
                  <p className="text-black dark:text-white font-medium">{getStepMessage()}</p>
                </motion.div>
              )}

              {/* Error state */}
              {step === 'error' && (
                <motion.div
                  key="mobile-error"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="text-center"
                >
                  <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
                  <p className="text-red-500 font-medium text-sm">{error}</p>
                  <Button
                    onClick={handleReset}
                    variant="outline"
                    className="mt-4 border-black/20 dark:border-white/20 text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/10"
                  >
                    Try Again
                  </Button>
                </motion.div>
              )}

              {/* Complete state - show result */}
              {step === 'complete' && retsbafiedImage && (
                <motion.div
                  key="mobile-result"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="relative w-full"
                >
                  <img
                    src={retsbafiedImage}
                    alt="Retsbafied Pudgy"
                    className="w-full h-auto rounded-lg max-h-[320px] object-contain mx-auto"
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReset();
                    }}
                    className="absolute top-2 right-2 p-2 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        {/* Mobile Download Button */}
        <Button
          onClick={handleDownload}
          disabled={step !== 'complete'}
          className="w-full bg-red-500 hover:bg-red-600 text-white"
        >
          <Download className="w-4 h-4 mr-2" />
          Download
        </Button>
      </div>

      {/* Desktop Layout - Two columns side by side */}
      <div className="hidden lg:block">
        {/* Headers row with toggle in center */}
        <div className="grid grid-cols-2 gap-6 mb-4">
          <div className="text-left">
            <h2 className="text-xl font-semibold text-black dark:text-white mb-1">{isLilMode ? 'Your Lil' : 'Your Pudgy'}</h2>
            <p className="text-black/60 dark:text-white/60 text-sm">{isLilMode ? 'Upload your Lil Pudgy NFT' : 'Upload your Pudgy Penguin NFT'}</p>
          </div>
          <div className="flex items-start justify-between">
            <div className="text-left">
              <h2 className="text-xl font-semibold text-black dark:text-white mb-1">Retsbafied</h2>
              <p className="text-black/60 dark:text-white/60 text-sm">Your Retsba</p>
            </div>
            <div className="flex items-center gap-3 bg-black/5 dark:bg-white/5 rounded-full px-4 py-2">
              <span className={`text-sm font-medium transition-colors ${!isLilMode ? 'text-black dark:text-white' : 'text-black/40 dark:text-white/40'}`}>
                Big
              </span>
              <Switch
                checked={isLilMode}
                onCheckedChange={setIsLilMode}
                className="data-[state=checked]:bg-primary"
              />
              <span className={`text-sm font-medium transition-colors ${isLilMode ? 'text-black dark:text-white' : 'text-black/40 dark:text-white/40'}`}>
                Lil
              </span>
            </div>
          </div>
        </div>

        {/* Content grid */}
        <div className="grid grid-cols-2 gap-6 relative">
        
        {/* Left Side - Upload & Original */}
        <div className="space-y-4">

          <motion.div
            className={`relative border-2 border-dashed rounded-xl p-6 transition-all duration-300 cursor-pointer min-h-[320px] flex items-center justify-center ${
              isDragging 
                ? 'border-primary bg-primary/10' 
                : 'border-black/20 dark:border-white/20 hover:border-black/40 dark:hover:border-white/40 bg-black/5 dark:bg-white/5'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />

            <AnimatePresence mode="wait">
              {uploadedImage ? (
                <motion.div
                  key="preview"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="relative w-full"
                >
                  <img
                    src={uploadedImage}
                    alt="Uploaded Pudgy"
                    className="w-full h-auto rounded-lg max-h-[320px] object-contain mx-auto"
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReset();
                    }}
                    className="absolute top-2 right-2 p-2 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key="upload"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center"
                >
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-black/10 dark:bg-white/10 flex items-center justify-center">
                    <Upload className="w-8 h-8 text-black/40 dark:text-white/40" />
                  </div>
                  <p className="text-black dark:text-white font-medium mb-2">Drop your Pudgy here</p>
                  <p className="text-black/40 dark:text-white/40 text-sm">or click to browse</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Detected Traits - Desktop only */}
          <AnimatePresence>
            {detectedTraits && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl p-4"
              >
                <div className="flex items-center gap-2 mb-3">
                  <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                  <h3 className="font-semibold text-black dark:text-white text-sm">Detected Traits</h3>
                  <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${
                    detectedTraits.confidence === 'high' 
                      ? 'bg-green-500/20 text-green-600 dark:text-green-400' 
                      : detectedTraits.confidence === 'medium'
                      ? 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400'
                      : 'bg-red-500/20 text-red-600 dark:text-red-400'
                  }`}>
                    {detectedTraits.confidence} confidence
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(detectedTraits.traits).map(([key, value]) => (
                    value && (
                      <div key={key} className={`bg-white dark:bg-retsba rounded-lg p-2 border ${
                        (key === 'head' && HEAD_TRAIT_MAP[value]) || (key === 'face' && FACE_TRAIT_MAP[value])
                          ? 'border-green-500/50 bg-green-50 dark:bg-green-500/10' 
                          : 'border-black/10 dark:border-white/10'
                      }`}>
                        <p className="text-black/40 dark:text-white/40 text-xs uppercase tracking-wide">{key}</p>
                        <p className="text-black dark:text-white text-sm">{formatTraitName(value)}</p>
                        {key === 'head' && HEAD_TRAIT_MAP[value] && (
                          <p className="text-green-600 dark:text-green-400 text-xs mt-0.5">✓ Overlay applied</p>
                        )}
                        {key === 'face' && FACE_TRAIT_MAP[value] && (
                          <p className="text-green-600 dark:text-green-400 text-xs mt-0.5">✓ Overlay applied</p>
                        )}
                      </div>
                    )
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Side - Retsbafied Result */}
        <div className={`space-y-4 ${isLilMode ? 'blur-sm pointer-events-none' : ''}`}>

          <div className="relative border-2 border-black/10 dark:border-white/20 rounded-xl p-6 bg-gradient-to-br from-primary/5 to-transparent min-h-[320px] flex items-center justify-center">
            <AnimatePresence mode="wait">
              {step === 'idle' && (
                <motion.div
                  key={`waiting-${isLilMode ? 'lil' : 'big'}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="w-full"
                >
                  <img
                    src={isLilMode ? Lil_Template : Template}
                    alt={isLilMode ? "Lil Retsba Template" : "Retsba Base Template"}
                    className="w-full h-auto rounded-lg max-h-[320px] object-contain mx-auto"
                  />
                </motion.div>
              )}

              {(step === 'uploading' || step === 'analyzing' || step === 'compositing') && (
                <motion.div
                  key="processing"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center"
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    className="w-12 h-12 mx-auto mb-4"
                  >
                    <RefreshCw className="w-12 h-12 text-primary" />
                  </motion.div>
                  <p className="text-black dark:text-white font-medium">{getStepMessage()}</p>
                </motion.div>
              )}

              {step === 'error' && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="text-center"
                >
                  <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
                  <p className="text-red-500 font-medium text-sm">{error}</p>
                  <Button
                    onClick={handleReset}
                    variant="outline"
                    className="mt-4 border-black/20 dark:border-white/20 text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/10"
                  >
                    Try Again
                  </Button>
                </motion.div>
              )}

              {step === 'complete' && retsbafiedImage && (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="w-full"
                >
                  <img
                    src={retsbafiedImage}
                    alt="Retsbafied Pudgy"
                    className="w-full h-auto rounded-lg max-h-[320px] object-contain mx-auto"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Action Button */}
          <Button
            onClick={handleDownload}
            disabled={step !== 'complete'}
            className="w-full bg-red-500 hover:bg-red-600 text-white"
          >
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
        </div>
        </div>
      </div>
    </div>
  );
};

export default PFPConverter;
