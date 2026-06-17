// RETSBA merch — shown on the homepage as Pudgy-style product cards that link
// OUT to each item's Dyli drop page (the Dyli shop can't be embedded directly).
//
// Each item has a gallery (images[]). images[0] is the card thumbnail; the rest
// are browsable via the card arrows / swipe and the lightbox carousel.
// Files live in public/merch/gallery/. Drop-id → product mapping confirmed 2026-06-16.

export interface MerchItem {
  /** Dyli drop id — also the stable React key */
  id: string;
  /** Product title shown on the card */
  name: string;
  /** Price string exactly as displayed, e.g. "$34.99" (or "" to show "View on Dyli") */
  price: string;
  /** Gallery images; images[0] is the primary/thumbnail shot */
  images: string[];
  /** The Dyli drop page this card links out to */
  url: string;
  /** Optional corner badge */
  badge?: 'NEW' | 'POPULAR' | 'LIMITED' | '';
  /** Optional product blurb (not shown on the card yet; kept for future use) */
  blurb?: string;
}

export const MERCH_ITEMS: MerchItem[] = [
  {
    id: '26753',
    name: 'Bootleg Tee 1',
    price: '$34.99',
    images: [
      '/merch/gallery/bootleg-tee-1-1.png',
      '/merch/gallery/bootleg-tee-1-2.png',
      '/merch/gallery/bootleg-tee-1-3.png',
    ],
    url: 'https://www.dyli.io/drop/26753?evergreen=true',
    badge: 'NEW',
    blurb:
      "Our take on the classic 90's/2000's bootleg rap tee. A modern oversized streetwear fit on premium worn fabric with durable print.",
  },
  {
    id: '26028',
    name: 'EVIL Tee',
    price: '$39.99',
    images: ['/merch/gallery/evil-tee-1.png', '/merch/gallery/evil-tee-2.png'],
    url: 'https://www.dyli.io/drop/26028?evergreen=true',
    badge: 'POPULAR',
    blurb:
      'The Evil oversized tee, printed on the most premium tee available through DYLI — a lifelong representation of villainy.',
  },
  {
    id: '26032',
    name: 'BEYOND COMPREHENSION Tee',
    price: '$39.99',
    images: [
      '/merch/gallery/beyond-comprehension-tee-1.png',
      '/merch/gallery/beyond-comprehension-tee-2.png',
    ],
    url: 'https://www.dyli.io/drop/26032?evergreen=true',
    badge: '',
    blurb:
      'Printed on the most premium tee available through DYLI, with inside labeling and long-lasting material — a lifelong representation of villainy.',
  },
  {
    id: '26038',
    name: 'The Classic',
    price: '$24.99',
    images: [
      '/merch/gallery/the-classic-1.png',
      '/merch/gallery/the-classic-2.png',
      '/merch/gallery/the-classic-3.png',
      '/merch/gallery/the-classic-4.png',
      '/merch/gallery/the-classic-5.png',
      '/merch/gallery/the-classic-6.png',
    ],
    url: 'https://www.dyli.io/drop/26038?evergreen=true',
    badge: '',
    blurb:
      'The heart of the Retsba collection. Plain, simple, and shows the world what you stand for — the sigil of the eternal reign.',
  },
];

/** Your full Dyli storefront — used by the "Shop all" CTA. */
export const DYLI_SHOP_URL = 'https://www.dyli.io/profile/retsba';
