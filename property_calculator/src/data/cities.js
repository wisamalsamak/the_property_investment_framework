// City definitions for the portfolio overview.
//
// Each city carries:
//  - an immowelt.de search URL (immowelt is used as the live data source
//    because, unlike ImmoScout24, its public search results are reachable
//    and can be parsed – see utils/immoweltProvider.js)
//  - market estimates (cold rent €/m², Bundesland for church tax)
//  - a curated fallback list of listings shown when no live data is loaded.
//
// Curated München listings are reused from muenchenListings.js. The Leipzig
// entries are based on live immowelt data; the remaining cities use realistic
// illustrative examples until you load live data.

import { MUENCHEN_LISTINGS } from './muenchenListings';

export const CITIES = [
  {
    id: 'muenchen',
    name: 'München',
    slug: 'muenchen',
    bundesland: 'Bayern',
    mietProQm: '20',
    immoweltUrl: 'https://www.immowelt.de/liste/muenchen/wohnungen/kaufen',
    listings: MUENCHEN_LISTINGS
  },
  {
    id: 'leipzig',
    name: 'Leipzig',
    slug: 'leipzig',
    bundesland: 'Sachsen',
    mietProQm: '9',
    immoweltUrl: 'https://www.immowelt.de/liste/leipzig/wohnungen/kaufen',
    listings: [
      { id: 'le-1', titel: '3-Zi-Wohnung Kapitalanlage', lage: 'Böhlitz-Ehrenberg', plz: '04178', kaufpreis: 140000, groesse: 61, zimmer: 3, quelle: 'immowelt' },
      { id: 'le-2', titel: '3-Zi-Wohnung', lage: 'Wahren', plz: '04159', kaufpreis: 200000, groesse: 64.6, zimmer: 3, quelle: 'immowelt' },
      { id: 'le-3', titel: '2-Zi-Wohnung', lage: 'Südvorstadt', plz: '04275', kaufpreis: 189000, groesse: 62, zimmer: 2, quelle: 'immowelt' },
      { id: 'le-4', titel: '4-Zi-Neubau Erstbezug', lage: 'Großzschocher', plz: '04249', kaufpreis: 622000, groesse: 107.4, zimmer: 4, provision: 0, quelle: 'immowelt' },
      { id: 'le-5', titel: '3-Zi-Wohnung', lage: 'Gohlis-Mitte', plz: '04157', kaufpreis: 324000, groesse: 80, zimmer: 3, quelle: 'immowelt' },
      { id: 'le-6', titel: '2-Zi-Wohnung', lage: 'Heiterblick', plz: '04329', kaufpreis: 110000, groesse: 48.9, zimmer: 2, quelle: 'immowelt' }
    ]
  },
  {
    id: 'dresden',
    name: 'Dresden',
    slug: 'dresden',
    bundesland: 'Sachsen',
    mietProQm: '10',
    immoweltUrl: 'https://www.immowelt.de/liste/dresden/wohnungen/kaufen',
    listings: [
      { id: 'dd-1', titel: '2-Zi-Altbau', lage: 'Neustadt', plz: '01099', kaufpreis: 285000, groesse: 58, zimmer: 2, quelle: 'Beispiel' },
      { id: 'dd-2', titel: '3-Zi-Wohnung', lage: 'Striesen', plz: '01309', kaufpreis: 369000, groesse: 78, zimmer: 3, quelle: 'Beispiel' },
      { id: 'dd-3', titel: '4-Zi-Familienwohnung', lage: 'Blasewitz', plz: '01307', kaufpreis: 520000, groesse: 102, zimmer: 4, quelle: 'Beispiel' },
      { id: 'dd-4', titel: '2-Zi-Kapitalanlage', lage: 'Pieschen', plz: '01127', kaufpreis: 199000, groesse: 55, zimmer: 2, quelle: 'Beispiel' }
    ]
  },
  {
    id: 'magdeburg',
    name: 'Magdeburg',
    slug: 'magdeburg',
    bundesland: 'Sachsen-Anhalt',
    mietProQm: '8',
    immoweltUrl: 'https://www.immowelt.de/liste/magdeburg/wohnungen/kaufen',
    listings: [
      { id: 'md-1', titel: '3-Zi-Altbau saniert', lage: 'Stadtfeld Ost', plz: '39108', kaufpreis: 215000, groesse: 84, zimmer: 3, quelle: 'Beispiel' },
      { id: 'md-2', titel: '2-Zi-Kapitalanlage', lage: 'Buckau', plz: '39104', kaufpreis: 129000, groesse: 56, zimmer: 2, quelle: 'Beispiel' },
      { id: 'md-3', titel: '4-Zi-Wohnung', lage: 'Sudenburg', plz: '39112', kaufpreis: 269000, groesse: 98, zimmer: 4, quelle: 'Beispiel' },
      { id: 'md-4', titel: '2-Zi-Neubau', lage: 'Werder', plz: '39114', kaufpreis: 245000, groesse: 60, zimmer: 2, provision: 0, quelle: 'Beispiel' }
    ]
  },
  {
    id: 'hamburg',
    name: 'Hamburg',
    slug: 'hamburg',
    bundesland: 'Hamburg',
    mietProQm: '15',
    immoweltUrl: 'https://www.immowelt.de/liste/hamburg/wohnungen/kaufen',
    listings: [
      { id: 'hh-1', titel: '2-Zi-Wohnung', lage: 'Eimsbüttel', plz: '20255', kaufpreis: 459000, groesse: 56, zimmer: 2, quelle: 'Beispiel' },
      { id: 'hh-2', titel: '3-Zi-Altbau', lage: 'Altona', plz: '22765', kaufpreis: 595000, groesse: 78, zimmer: 3, quelle: 'Beispiel' },
      { id: 'hh-3', titel: '4-Zi-Familienwohnung', lage: 'Winterhude', plz: '22299', kaufpreis: 849000, groesse: 105, zimmer: 4, quelle: 'Beispiel' },
      { id: 'hh-4', titel: '2-Zi-Kapitalanlage', lage: 'Wandsbek', plz: '22041', kaufpreis: 329000, groesse: 54, zimmer: 2, quelle: 'Beispiel' }
    ]
  },
  {
    id: 'berlin',
    name: 'Berlin',
    slug: 'berlin',
    bundesland: 'Berlin',
    mietProQm: '14',
    immoweltUrl: 'https://www.immowelt.de/liste/berlin/wohnungen/kaufen',
    listings: [
      { id: 'be-1', titel: '2-Zi-Altbau', lage: 'Prenzlauer Berg', plz: '10405', kaufpreis: 425000, groesse: 58, zimmer: 2, quelle: 'Beispiel' },
      { id: 'be-2', titel: '3-Zi-Wohnung', lage: 'Friedrichshain', plz: '10245', kaufpreis: 529000, groesse: 79, zimmer: 3, quelle: 'Beispiel' },
      { id: 'be-3', titel: '2-Zi-Kapitalanlage', lage: 'Neukölln', plz: '12047', kaufpreis: 319000, groesse: 55, zimmer: 2, quelle: 'Beispiel' },
      { id: 'be-4', titel: '4-Zi-Neubau', lage: 'Charlottenburg', plz: '10625', kaufpreis: 769000, groesse: 104, zimmer: 4, provision: 0, quelle: 'Beispiel' }
    ]
  }
];

export const getCityById = (id) => CITIES.find((c) => c.id === id) || CITIES[0];
