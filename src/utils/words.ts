/**
 * Kid friendly words and emojis for letters and numbers
 */

export interface LearnItem {
  word: string;
  emoji: string;
  color: string; // Tailwind color classes for the background wrapper
  textColor: string;
  borderTheme: string;
  fact?: string;
}

export const TODDLER_WORDS: Record<string, LearnItem> = {
  A: {
    word: "Apple",
    emoji: "🍎",
    color: "bg-rose-50 dark:bg-rose-950/20",
    textColor: "text-rose-600 dark:text-rose-400",
    borderTheme: "border-rose-200 dark:border-rose-800",
    fact: "Apples are crunchy and grow on trees!"
  },
  B: {
    word: "Butterfly",
    emoji: "🦋",
    color: "bg-sky-50 dark:bg-sky-950/20",
    textColor: "text-sky-600 dark:text-sky-400",
    borderTheme: "border-sky-200 dark:border-sky-800",
    fact: "Butterflies start as little caterpillars."
  },
  C: {
    word: "Cat",
    emoji: "🐱",
    color: "bg-amber-50 dark:bg-amber-950/20",
    textColor: "text-amber-600 dark:text-amber-400",
    borderTheme: "border-amber-200 dark:border-amber-800",
    fact: "Cats say meow and love warm naps!"
  },
  D: {
    word: "Dinosaur",
    emoji: "🦖",
    color: "bg-emerald-50 dark:bg-emerald-950/20",
    textColor: "text-emerald-600 dark:text-emerald-400",
    borderTheme: "border-emerald-200 dark:border-emerald-800",
    fact: "Dinosaurs lived millions of years ago!"
  },
  E: {
    word: "Elephant",
    emoji: "🐘",
    color: "bg-slate-50 dark:bg-slate-950/20",
    textColor: "text-slate-600 dark:text-slate-400",
    borderTheme: "border-slate-200 dark:border-slate-800",
    fact: "Elephants have super long trunks!"
  },
  F: {
    word: "Frog",
    emoji: "🐸",
    color: "bg-green-50 dark:bg-green-950/20",
    textColor: "text-green-600 dark:text-green-400",
    borderTheme: "border-green-200 dark:border-green-800",
    fact: "Frogs go ribbit and jump really high!"
  },
  G: {
    word: "Giraffe",
    emoji: "🦒",
    color: "bg-yellow-50 dark:bg-yellow-950/20",
    textColor: "text-yellow-600 dark:text-yellow-400",
    borderTheme: "border-yellow-200 dark:border-yellow-800",
    fact: "Giraffes have super duper long necks!"
  },
  H: {
    word: "Horse",
    emoji: "🐎",
    color: "bg-orange-50 dark:bg-orange-950/20",
    textColor: "text-orange-600 dark:text-orange-400",
    borderTheme: "border-orange-200 dark:border-orange-800",
    fact: "Horses can run very fast across fields."
  },
  I: {
    word: "Ice Cream",
    emoji: "🍦",
    color: "bg-pink-50 dark:bg-pink-950/20",
    textColor: "text-pink-600 dark:text-pink-400",
    borderTheme: "border-pink-200 dark:border-pink-800",
    fact: "Ice cream is sweet, cold, and yummy!"
  },
  J: {
    word: "Jellyfish",
    emoji: "🪼",
    color: "bg-purple-50 dark:bg-purple-950/20",
    textColor: "text-purple-600 dark:text-purple-400",
    borderTheme: "border-purple-200 dark:border-purple-800",
    fact: "Jellyfish float gracefully in the ocean."
  },
  K: {
    word: "Kangaroo",
    emoji: "🦘",
    color: "bg-amber-50 dark:bg-amber-950/20",
    textColor: "text-amber-700 dark:text-amber-400",
    borderTheme: "border-amber-200 dark:border-amber-800",
    fact: "Kangaroos carry their babies in a pocket!"
  },
  L: {
    word: "Lion",
    emoji: "🦁",
    color: "bg-yellow-50 dark:bg-yellow-950/20",
    textColor: "text-yellow-700 dark:text-yellow-400",
    borderTheme: "border-yellow-200 dark:border-yellow-800",
    fact: "Lions have big fluffy hair called a mane!"
  },
  M: {
    word: "Monkey",
    emoji: "🐵",
    color: "bg-neutral-100 dark:bg-neutral-900/40",
    textColor: "text-amber-800 dark:text-amber-400",
    borderTheme: "border-amber-300 dark:border-amber-800",
    fact: "Monkeys love to swing on jungle branches!"
  },
  N: {
    word: "Nests",
    emoji: "🪹",
    color: "bg-orange-50 dark:bg-orange-950/20",
    textColor: "text-orange-700 dark:text-orange-300",
    borderTheme: "border-orange-200 dark:border-orange-800",
    fact: "Birds make cozy nests in tall trees."
  },
  O: {
    word: "Octopus",
    emoji: "🐙",
    color: "bg-indigo-50 dark:bg-indigo-950/20",
    textColor: "text-indigo-600 dark:text-indigo-400",
    borderTheme: "border-indigo-200 dark:border-indigo-800",
    fact: "An octopus has eight wiggly arms!"
  },
  P: {
    word: "Puppy",
    emoji: "🐶",
    color: "bg-yellow-50/70 dark:bg-yellow-950/10",
    textColor: "text-yellow-800 dark:text-yellow-500",
    borderTheme: "border-yellow-100 dark:border-yellow-900",
    fact: "Puppies love to wag their tails and play!"
  },
  Q: {
    word: "Queen",
    emoji: "👑",
    color: "bg-amber-100/50 dark:bg-amber-950/20",
    textColor: "text-amber-600 dark:text-amber-400",
    borderTheme: "border-amber-200 dark:border-amber-800",
    fact: "Queens wear lovely crowns on their heads."
  },
  R: {
    word: "Rainbow",
    emoji: "🌈",
    color: "bg-rose-50/40 dark:bg-rose-950/10",
    textColor: "text-violet-600 dark:text-violet-400",
    borderTheme: "border-violet-200 dark:border-violet-800",
    fact: "Rainbows appear when it's sunny and rainy."
  },
  S: {
    word: "Star",
    emoji: "⭐",
    color: "bg-yellow-50 dark:bg-yellow-950/20",
    textColor: "text-amber-500 dark:text-amber-300",
    borderTheme: "border-yellow-150 dark:border-yellow-800",
    fact: "Stars twinkle far, far away in space."
  },
  T: {
    word: "Train",
    emoji: "🚂",
    color: "bg-cyan-50 dark:bg-cyan-950/20",
    textColor: "text-cyan-600 dark:text-cyan-400",
    borderTheme: "border-cyan-200 dark:border-cyan-800",
    fact: "Trains say choo-choo along the tracks!"
  },
  U: {
    word: "Unicorn",
    emoji: "🦄",
    color: "bg-fuchsia-50 dark:bg-fuchsia-950/20",
    textColor: "text-fuchsia-500 dark:text-fuchsia-400",
    borderTheme: "border-fuchsia-200 dark:border-fuchsia-800",
    fact: "Unicorns are magical horsies with horns!"
  },
  V: {
    word: "Volcano",
    emoji: "🌋",
    color: "bg-red-50 dark:bg-red-950/20",
    textColor: "text-red-500 dark:text-red-400",
    borderTheme: "border-red-200 dark:border-red-800",
    fact: "Volcanoes can shoot out hot red lava!"
  },
  W: {
    word: "Whale",
    emoji: "🐋",
    color: "bg-blue-50 dark:bg-blue-950/20",
    textColor: "text-blue-600 dark:text-blue-400",
    borderTheme: "border-blue-200 dark:border-blue-800",
    fact: "Whales are the biggest creatures on Earth!"
  },
  X: {
    word: "Xylophone",
    emoji: "🪘",
    color: "bg-teal-50 dark:bg-teal-950/20",
    textColor: "text-teal-600 dark:text-teal-400",
    borderTheme: "border-teal-200 dark:border-teal-800",
    fact: "Xylophones make lovely ding-dong music!"
  },
  Y: {
    word: "Yo-Yo",
    emoji: "🪀",
    color: "bg-green-50 dark:bg-green-950/20",
    textColor: "text-green-600 dark:text-green-400",
    borderTheme: "border-green-200 dark:border-green-800",
    fact: "Yo-yos go down and up on a little string!"
  },
  Z: {
    word: "Zebra",
    emoji: "🦓",
    color: "bg-neutral-100 dark:bg-neutral-900/30",
    textColor: "text-neutral-800 dark:text-neutral-300",
    borderTheme: "border-neutral-300 dark:border-neutral-700",
    fact: "Zebras have beautiful black and white stripes!"
  },
  // Nums
  "0": { word: "Zero", emoji: "🍩", color: "bg-pink-50", textColor: "text-pink-600", borderTheme: "border-pink-200" },
  "1": { word: "One", emoji: "🦄", color: "bg-purple-50", textColor: "text-purple-600", borderTheme: "border-purple-200" },
  "2": { word: "Two Ducks", emoji: "🦆🦆", color: "bg-yellow-50", textColor: "text-yellow-600", borderTheme: "border-yellow-200" },
  "3": { word: "Three Cats", emoji: "🐱🐱🐱", color: "bg-orange-50", textColor: "text-orange-600", borderTheme: "border-orange-200" },
  "4": { word: "Four Apples", emoji: "🍎🍎🍎🍎", color: "bg-rose-50", textColor: "text-rose-600", borderTheme: "border-rose-200" },
  "5": { word: "Five Stars", emoji: "⭐⭐⭐⭐⭐", color: "bg-amber-100", textColor: "text-amber-600", borderTheme: "border-amber-200" },
  "6": { word: "Six Balloons", emoji: "🎈🎈🎈🎈🎈🎈", color: "bg-red-50", textColor: "text-red-600", borderTheme: "border-red-200" },
  "7": { word: "Seven Flowers", emoji: "🌸🌸🌸🌸🌸🌸🌸", color: "bg-lime-50", textColor: "text-lime-600", borderTheme: "border-lime-200" },
  "8": { word: "Eight Fishes", emoji: "🐟🐟🐟🐟🐟🐟🐟🐟", color: "bg-sky-50", textColor: "text-sky-600", borderTheme: "border-sky-200" },
  "9": { word: "Nine Cookies", emoji: "🍪🍪🍪🍪🍪🍪🍪🍪🍪", color: "bg-amber-50", textColor: "text-amber-800", borderTheme: "border-amber-200" },
};

export const FALLBACK_WORDS: Record<string, LearnItem> = {
  " ": { word: "Space Rocket", emoji: "🚀", color: "bg-indigo-900/40 text-black", textColor: "text-white", borderTheme: "border-indigo-400" },
  "Enter": { word: "Magic Stars", emoji: "🌟", color: "bg-amber-100", textColor: "text-amber-600", borderTheme: "border-amber-300" },
  "Backspace": { word: "Clear Broom", emoji: "🧹", color: "bg-slate-100", textColor: "text-slate-600", borderTheme: "border-slate-300" },
  "Shift": { word: "Rainbow Balloon", emoji: "🎈", color: "bg-red-50", textColor: "text-red-600", borderTheme: "border-red-300" },
  "Tab": { word: "Wiggle Worm", emoji: "🪱", color: "bg-orange-50", textColor: "text-orange-600", borderTheme: "border-orange-200" },
};

/**
 * Returns clean LearnItem for key
 */
export function getLearnItem(key: string): LearnItem {
  const clean = key.toUpperCase();
  if (TODDLER_WORDS[clean]) {
    return TODDLER_WORDS[clean];
  }
  if (FALLBACK_WORDS[key]) {
    return FALLBACK_WORDS[key];
  }
  // Generic character
  return {
    word: `Key: ${key}`,
    emoji: "🎉",
    color: "bg-violet-50 dark:bg-violet-950/20",
    textColor: "text-violet-600 dark:text-violet-400",
    borderTheme: "border-violet-200",
  };
}
