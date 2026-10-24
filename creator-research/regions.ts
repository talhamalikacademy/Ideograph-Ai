import { FactType } from './types';

export interface RegionPack {
  id: string;
  name: string;
  note: string;
  localLanguages: string[];
  examplesByType: Partial<Record<FactType, string[]>>;
}

export const PAKISTAN_REGION_PACK: RegionPack = {
  id: 'pakistan',
  name: 'Pakistan',
  note: 'Hints only, user can edit',
  localLanguages: ['Urdu (Proper)', 'Roman Urdu', 'English'],
  examplesByType: {
    official_data: [
      'Pakistan Bureau of Statistics (PBS)',
      'State Bank of Pakistan (SBP)',
      'Pakistan Institute of Development Economics (PIDE)',
      'Provincial Planning & Finance Departments',
      'Regulators (NEPRA, OGRA, PTA)',
      'Civic utilities (e.g., KWSB, WAPDA)'
    ],
    official_documents: [
      'Auditor General of Pakistan reports',
      'National Assembly and Senate committee records',
      'Supreme Court and High Court judgments',
      'Inquiry commission reports'
    ],
    news: [
      'Dawn',
      'The News International',
      'The Express Tribune',
      'Business Recorder',
      'Local Urdu and regional newspapers'
    ],
    public_voices: [
      'Local community forums and resident discussions (always labelled "unverified")'
    ],
    books_history: [
      'Published South Asian and Pakistani histories, memoirs, and archival records'
    ]
  }
};

export const INDIA_REGION_PACK: RegionPack = {
  id: 'india',
  name: 'India',
  note: 'Hints only, user can edit',
  localLanguages: ['Hindi (Devanagari)', 'Hinglish (Roman)', 'English'],
  examplesByType: {
    official_data: [
      'Reserve Bank of India (RBI)',
      'MoSPI / National Statistical Office (NSO)',
      'NITI Aayog data tables and ministry dashboards'
    ],
    official_documents: [
      'CAG (Comptroller and Auditor General) audit reports',
      'PRS Legislative Research summaries and bills',
      'Parliament Q&A (Lok Sabha / Rajya Sabha)',
      'RTI replies',
      'Supreme Court and High Court judgments'
    ],
    news: [
      'The Hindu',
      'The Indian Express',
      'Mint / Business Standard',
      'Major national and regional newspapers'
    ],
    public_voices: [
      'Public discussion forums and citizen accounts (always labelled "unverified")'
    ]
  }
};

export const GLOBAL_REGION_PACK: RegionPack = {
  id: 'global',
  name: 'Global',
  note: 'Hints only, user can edit',
  localLanguages: ['English'],
  examplesByType: {
    official_data: [
      'National statistics offices of the target or comparison countries',
      'Central banks and treasury reports'
    ],
    official_documents: [
      'National audit bodies, legislative committee records, and court rulings'
    ],
    global_studies: [
      'World Bank',
      'International Monetary Fund (IMF)',
      'OECD',
      'World Health Organization (WHO)',
      'UN agencies',
      'Peer-reviewed academic journals'
    ],
    news: [
      'Reuters, Associated Press, Financial Times, and major national newspapers'
    ],
    public_voices: [
      'Public discussion threads and interviews (always labelled "unverified")'
    ]
  }
};

export const REGION_PACKS: Record<string, RegionPack> = {
  pakistan: PAKISTAN_REGION_PACK,
  india: INDIA_REGION_PACK,
  global: GLOBAL_REGION_PACK
};

/**
 * Returns the matching RegionPack hints for a region string.
 * For any other country, returns a dynamic hint pack instructing the planner to look up
 * that country's own statistics office, central bank, audit body, and legislature.
 */
export function getRegionPack(regionName?: string): RegionPack {
  const clean = (regionName || 'Global').trim().toLowerCase();
  if (clean.includes('pakistan')) return PAKISTAN_REGION_PACK;
  if (clean.includes('india')) return INDIA_REGION_PACK;
  if (clean === 'global' || clean === 'world' || clean === 'international') {
    return GLOBAL_REGION_PACK;
  }

  return {
    id: clean,
    name: regionName || 'Target Country',
    note: 'Hints only, user can edit',
    localLanguages: ['English'],
    examplesByType: {
      official_data: [
        `${regionName} national statistics office`,
        `${regionName} central bank and ministry data tables`
      ],
      official_documents: [
        `${regionName} national audit body reports`,
        `${regionName} legislature records and court judgments`
      ],
      global_studies: GLOBAL_REGION_PACK.examplesByType.global_studies,
      news: [`Major newspapers and investigative outlets covering ${regionName}`],
      public_voices: [`Public forums and resident voices in ${regionName} (always labelled "unverified")`]
    }
  };
}
