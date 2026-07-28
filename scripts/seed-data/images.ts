/**
 * Curated food photography for seed data. Every id below was checked to
 * resolve (HTTP 200) against images.unsplash.com and its content confirmed
 * by hand before being placed in this list, so the demo never ships a menu
 * card with a broken image or one that plainly shows the wrong dish.
 */
function unsplash(id: string): string {
  return `https://images.unsplash.com/photo-${id}?w=800&q=75&auto=format&fit=crop`;
}

export const FOOD_IMAGES = {
  appetisers: [unsplash('1541014741259-de529411b96a'), unsplash('1600891964599-f61ba0e24092')],
  soups: [unsplash('1476718406336-bb5a9690ee2a'), unsplash('1547592166-23ac45744acd')],
  salads: [
    unsplash('1490645935967-10de6ba17061'),
    unsplash('1512621776951-a57141f2eefd'),
    unsplash('1546069901-ba9599a7e63c'),
    unsplash('1554998171-89445e31c52b'),
    unsplash('1600335895229-6e75511892c8'),
  ],
  burgers: [
    unsplash('1512152272829-e3139592d56f'),
    unsplash('1551782450-a2132b4ba21d'),
    unsplash('1565299507177-b0ac66763828'),
    unsplash('1568901346375-23c9450c58cd'),
    unsplash('1571091718767-18b5b1457add'),
    unsplash('1607013251379-e6eecfffe234'),
    unsplash('1554433607-66b5efe9d304'),
  ],
  sandwiches: [
    unsplash('1509722747041-616f39b57569'),
    unsplash('1553909489-cd47e0907980'),
    unsplash('1550507992-eb63ffee0847'),
    unsplash('1553979459-d2229ba7433b'),
    unsplash('1481070555726-e2fe8357725c'),
  ],
  pizza: [
    unsplash('1565299624946-b28f40a0ae38'),
    unsplash('1571997478779-2adcbbe9ab2f'),
    unsplash('1573821663912-6df460f9c684'),
    unsplash('1513104890138-7c749659a591'),
  ],
  pasta: [
    unsplash('1481931098730-318b6f776db0'),
    unsplash('1551183053-bf91a1d81141'),
    unsplash('1563379926898-05f4575a45d8'),
    unsplash('1621996346565-e3dbc646d9a9'),
    unsplash('1608219992759-8d74ed8d76eb'),
  ],
  rice: [unsplash('1512058564366-18510be2db19')],
  curry: [unsplash('1567337710282-00832b415979'), unsplash('1455619452474-d2be8b1e70cd')],
  seafood: [unsplash('1467003909585-2f8a72700288'), unsplash('1563379926898-05f4575a45d8')],
  chickenGrill: [unsplash('1476224203421-9ac39bcb3327'), unsplash('1544025162-d76694265947')],
  desserts: [
    unsplash('1519676867240-f03562e64548'),
    unsplash('1565958011703-44f9829ba187'),
    unsplash('1567620905732-2d1ec7ab7445'),
  ],
  hotDrinks: [
    unsplash('1497636577773-f1231844b336'),
    unsplash('1544716278-ca5e3f4abd8c'),
    unsplash('1495474472287-4d71bcdd2085'),
  ],
  coldDrinks: [unsplash('1544145945-f90425340c7e'), unsplash('1497534446932-c925b458314e')],
  freshJuices: [unsplash('1610970881699-44a5587cabec')],
  comboMeals: [unsplash('1600891964599-f61ba0e24092'), unsplash('1554433607-66b5efe9d304')],
  bread: [unsplash('1509440159596-0249088772ff')],
} as const;

export type FoodImageCategory = keyof typeof FOOD_IMAGES;

/** Deterministic pick so re-seeding always assigns the same photo to the same item. */
export function pickImage(category: FoodImageCategory, index: number): string {
  const pool = FOOD_IMAGES[category];
  return pool[index % pool.length]!;
}

export const AMBIENCE_IMAGES = [
  unsplash('1552566626-52f8b828add9'),
  unsplash('1565895405227-31cffbe0cf86'),
  unsplash('1590846406792-0adc7f938f1d'),
  unsplash('1544148103-0773bf10d330'),
];
