import type { Alert, KpiCardData, Report, OsintMatch, MapOrganization, FullReport } from '@/lib/types';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export const kpiData: KpiCardData[] = [
  { label: 'Monitored Chains', value: '4', change: '+1', changeType: 'up' },
  { label: 'High-Risk Alerts (24h)', value: '1,204', change: '+18%', changeType: 'up' },
  { label: 'OSINT Correlations', value: '8,192', change: '+5%', changeType: 'up' },
  { label: 'AI Model Accuracy', value: '94.2%', change: '-0.1%', changeType: 'down' },
];

export const liveAlerts: Alert[] = [
  { id: '1', timestamp: '2 mins ago', address: '0xAb58...E32b', riskScore: 98, message: 'Interaction with sanctioned entity.' },
  { id: '2', timestamp: '5 mins ago', address: '0x742d...d27B', riskScore: 85, message: 'Anomalous transaction volume.' },
  { id: '3', timestamp: '10 mins ago', address: '0x90e4...F274', riskScore: 72, message: 'Funds routed through mixer.' },
  { id: '4', timestamp: '1 hour ago', address: '0xBE0e...e116', riskScore: 91, message: 'Linked to known phishing scam.' },
  { id: '5', timestamp: '3 hours ago', address: '0x1F90...bA16', riskScore: 75, message: 'High fan-out ratio detected.' },
  { id: '6', timestamp: '15 mins ago', address: '0x3c9c...89b2', riskScore: 65, message: 'Unusual deposit to high-risk exchange.' },
  { id: '7', timestamp: '22 mins ago', address: '0xd13c...ab4e', riskScore: 58, message: 'Interaction with unverified smart contract.' },
  { id: '8', timestamp: '45 mins ago', address: '0x5a2d...34c1', riskScore: 68, message: 'Rapid funding and withdrawal pattern.' },
  { id: '9', timestamp: '2 hours ago', address: '0x88f2...cd3d', riskScore: 99, message: 'Address linked to ransomware attack.' },
  { id: '10', timestamp: '4 hours ago', address: '0xb3e1...dfa9', riskScore: 45, message: 'First-time interaction with DeFi protocol.' },
];

export const recentReports: Report[] = [
  { id: 'ST-2025-0816-04B', title: 'Crimson Syndicate Takedown', case_id: 'ST-2025-0816-04B', classification: 'SECRET', date_generated: '2024-07-28', preview: 'Deep-dive into the financial network of the Crimson Syndicate.' },
  { id: 'ST-2025-0712-01A', title: 'Project Chimera Analysis', case_id: 'ST-2025-0712-01A', classification: 'CONFIDENTIAL', date_generated: '2024-07-12', preview: 'Investigation of a major darknet marketplace.' },
  { id: 'ST-2025-0620-09C', title: 'Gilded Serpent Mixer', case_id: 'ST-2025-0620-09C', classification: 'UNCLASSIFIED', date_generated: '2024-06-20', preview: 'Tracing funds through a popular mixing service.' },
];

export const osintMatches: OsintMatch[] = [
  { entity: 'crimson_syndicate_ops', source: 'DarkLeakDB', confidence: 95, category: 'Hacker Group', lastUpdated: '2024-07-25', snapshot: { handles: ['@crimson_ops', 'syndicate_master'], emails: ['contact@crimson-syndicate.onion'], domains: ['crimson-syndicate.onion'], evidence: 'Leaked forum posts discussing money laundering techniques.' } },
  { entity: '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B', source: 'OpenSanctions', confidence: 100, category: 'Sanctioned Entity', lastUpdated: '2024-07-29', snapshot: { handles: [], emails: [], domains: [], evidence: 'Address listed on OFAC Specially Designated Nationals (SDN) list.' } },
  { entity: 'John Doe', source: 'Social Media Analysis', confidence: 60, category: 'Person of Interest', lastUpdated: '2024-07-10', snapshot: { handles: ['@johndoe_crypto'], emails: ['j.doe@email.com'], domains: [], evidence: 'Public posts boasting about gains from high-risk DeFi protocols.' } },
];

export const mapOrganizations: MapOrganization[] = [
  { id: 'ST-2025-0816-04B', name: 'Crimson Syndicate', country: 'Russia', type: 'Terrorist Org', riskScore: 98, coordinates: { lat: 55.7558, lng: 37.6173 } },
  { id: 'org-2', name: 'Hydra Market', country: 'Germany', type: 'Darknet Vendor', riskScore: 95, coordinates: { lat: 51.1657, lng: 10.4515 } },
  { id: 'org-3', name: 'Lazarus Group', country: 'North Korea', type: 'Sanctions Suspect', riskScore: 100, coordinates: { lat: 39.0392, lng: 125.7625 } },
  { id: 'org-4', name: 'Coin-Swap-XYZ', country: 'Unknown', type: 'High-Risk Exchange', riskScore: 88, coordinates: { lat: 23.6345, lng: -102.5528 } },
  { id: 'org-5', name: 'Shadow Brokers', country: 'United States', type: 'Terrorist Org', riskScore: 92, coordinates: { lat: 38.9072, lng: -77.0369 } },
];

export const alertLocations: MapOrganization[] = [
    { id: 'alert-1', name: '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B', type: 'High-Risk Alert', riskScore: 98, coordinates: { lat: 40.7128, lng: -74.0060 } },
    { id: 'alert-2', name: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e', type: 'High-Risk Alert', riskScore: 85, coordinates: { lat: 51.5074, lng: -0.1278 } },
    { id: 'alert-3', name: '0x90e46A4673A422590210481546050332f274f274', type: 'High-Risk Alert', riskScore: 72, coordinates: { lat: 35.6895, lng: 139.6917 } },
    { id: 'alert-4', name: '0xBE0eB53F46cd790Cd13851d5Ea43943145e11699', type: 'High-Risk Alert', riskScore: 91, coordinates: { lat: 34.0522, lng: -118.2437 } },
    { id: 'alert-5', name: '0x1F9090aaE28b8a3dCeaDf281B0F12828e676c326', type: 'High-Risk Alert', riskScore: 75, coordinates: { lat: -33.8688, lng: 151.2093 } },
];

const onChainViz = PlaceHolderImages.find(img => img.id === 'on-chain-analysis-graph');

export const sampleReport: FullReport = {
  id: 'ST-2025-0816-04B',
  metadata: {
    caseId: 'ST-2025-0816-04B',
    dateGenerated: '2024-08-16',
    classification: 'SECRET',
    analyst: 'J. Smith',
  },
  executiveSummary: 'This report details the investigation into the financial activities of the "Crimson Syndicate," a transnational cyber-criminal organization. Analysis of on-chain data and fused OSINT has identified key operational wallets, money laundering patterns, and links to sanctioned entities. The subject address (0xAb58...) serves as a primary consolidation point for illicit funds before distribution through a network of peel chains and high-risk exchanges.',
  subjectProfile: {
    address: '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B',
    aliases: ['Crimson One', 'Syndicate Treasury'],
    firstSeen: '2022-01-15',
    lastSeen: '2024-08-15',
    totalValue: '$15.2M USD (BTC, ETH)',
    riskScore: 98,
    riskFactors: ['Interaction with sanctioned entity', 'High transaction volume with known mixers', 'Anomalous transaction timing (off-hours)'],
  },
  onChainAnalysis: {
    summary: 'The subject wallet exhibits a sophisticated pattern of fund movement designed to obscure origins. Funds are received from over 500 distinct addresses, consolidated, and then rapidly moved through a series of peel chains. A significant portion of the funds is funneled to two major high-risk exchanges known for lax KYC/AML policies.',
    visualization: {
      imageUrl: onChainViz?.imageUrl || '',
      imageHint: onChainViz?.imageHint || 'data visualization',
    },
    keyFindings: [
      'Use of peel chains to launder over $10M.',
      'Direct transactions with wallets on OFAC sanction list.',
      'Periodic, large-sum transfers to exchange deposit addresses.',
    ],
  },
  osintFusion: {
    summary: 'Open-source intelligence links the wallet activity to online personas associated with the Crimson Syndicate. Forum posts on darknet sites under the alias "Crimson_Ops" discuss laundering techniques that match the on-chain behavior observed.',
    matches: [
      { source: 'DarkLeakDB', data: 'Found alias "Crimson_Ops" discussing BTC mixing strategies.' },
      { source: 'OpenSanctions', data: 'Linked address found in a leaked database from a sanctioned exchange.' },
    ],
  },
  identifiedTtps: {
    summary: 'The organization employs a combination of tactics, techniques, and procedures (TTPs) common among sophisticated financial criminals.',
    ttps: [
      'Peel Chaining: Rapidly moving funds through new addresses to break the transaction trail.',
      'Chain Hopping: Using bridges to move funds between Bitcoin and Ethereum networks.',
      'Use of High-Risk Exchanges: Cashing out through exchanges with weak regulatory oversight.',
    ],
  },
  conclusion: 'The evidence strongly suggests that wallet 0xAb58... is a critical component of the Crimson Syndicate\'s money laundering infrastructure. The combined on-chain and OSINT data paint a clear picture of a well-organized and ongoing criminal enterprise.',
  recommendations: [
    'Add all identified addresses to the national blocklist.',
    'Share intelligence with international law enforcement partners.',
    'Monitor newly created addresses linked to the peel chains for further activity.',
  ],
  worksCited: [
    { source: 'OFAC SDN List', link: 'https://sanctionssearch.ofac.treas.gov/' },
    { source: 'DarkLeakDB Analysis', link: 'Internal Report #DL-2024-112' },
  ],
};
