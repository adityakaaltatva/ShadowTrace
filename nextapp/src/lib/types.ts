export type SystemStatus = 'ok' | 'error' | 'syncing';

export type KpiCardData = {
  label: string;
  value: string;
  change?: string;
  changeType?: 'up' | 'down';
};

export type Alert = {
  id: string;
  timestamp: string;
  address: string;
  riskScore: number;
  message: string;
};

export type Report = {
  id: string;
  title: string;
  case_id: string;
  classification: 'UNCLASSIFIED' | 'CONFIDENTIAL' | 'SECRET';
  date_generated: string;
  preview: string;
};

export type OsintMatch = {
  entity: string;
  source: string;
  confidence: number;
  category: string;
  lastUpdated: string;
  snapshot: {
    handles: string[];
    emails: string[];
    domains: string[];
    evidence: string;
  };
};

export type MapOrganization = {
  id: string;
  name: string;
  country?: string;
  type: 'Terrorist Org' | 'Sanctions Suspect' | 'Darknet Vendor' | 'High-Risk Exchange' | 'High-Risk Alert';
  riskScore: number;
  coordinates: { lat: number; lng: number };
};

export type FullReport = {
  id: string;
  metadata: {
    caseId: string;
    dateGenerated: string;
    classification: 'UNCLASSIFIED' | 'CONFIDENTIAL' | 'SECRET';
    analyst: string;
  };
  executiveSummary: string;
  subjectProfile: {
    address: string;
    aliases: string[];
    firstSeen: string;
    lastSeen: string;
    totalValue: string;
    riskScore: number;
    riskFactors: string[];
  };
  onChainAnalysis: {
    summary: string;
    visualization: {
      imageUrl: string;
      imageHint: string;
    };
    keyFindings: string[];
  };
  osintFusion: {
    summary: string;
    matches: {
      source: string;
      data: string;
    }[];
  };
  identifiedTtps: {
    summary: string;
    ttps: string[];
  };
  conclusion: string;
  recommendations: string[];
  worksCited: {
    source: string;
    link: string;
  }[];
};
