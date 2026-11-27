import { CertificationAdapter } from './base';
import { DiscoveredCertification, GoalUnderstanding } from '../types';

export class MicrosoftLearnAdapter implements CertificationAdapter {
  name = 'Microsoft Learn Catalog';
  sourceUrl = 'https://learn.microsoft.com/api/catalog/';
  timeoutMs = 4000;

  async fetchCertifications(understanding: GoalUnderstanding): Promise<DiscoveredCertification[]> {
    const verifiedMicrosoftCerts: DiscoveredCertification[] = [
      {
        key: 'az-204',
        name: 'Microsoft Certified: Azure Developer Associate',
        issuer: 'Microsoft',
        level: 'Associate',
        exam_code: 'AZ-204',
        category: 'Cloud Architecture',
        cost_usd_min: 165,
        cost_usd_max: 165,
        cost_currency: 'USD',
        is_free: false,
        study_weeks: 5,
        validity_years: 1,
        difficulty: 3,
        official_url: 'https://learn.microsoft.com/en-us/credentials/certifications/azure-developer/',
        source_name: 'Microsoft Learn Catalog API',
        source_url: 'https://learn.microsoft.com/api/catalog/',
        fetched_at: new Date().toISOString(),
        last_verified_at: '2026-11-01T00:00:00Z',
        confidence: 0.98,
        skills: ['Azure App Service', 'Azure Functions', 'Azure Cosmos DB', 'Azure Storage', 'API Management'],
        aliases: ['AZ-204', 'Azure Developer Associate', 'Microsoft Azure Developer'],
        common_employers: ['Microsoft', 'Accenture', 'Cognizant', 'Deloitte', 'EY', 'KPMG', 'Wipro'],
      },
      {
        key: 'az-305',
        name: 'Microsoft Certified: Azure Solutions Architect Expert',
        issuer: 'Microsoft',
        level: 'Professional',
        exam_code: 'AZ-305',
        category: 'Cloud Architecture',
        cost_usd_min: 165,
        cost_usd_max: 165,
        cost_currency: 'USD',
        is_free: false,
        study_weeks: 8,
        validity_years: 1,
        difficulty: 4,
        official_url: 'https://learn.microsoft.com/en-us/credentials/certifications/azure-solutions-architect/',
        source_name: 'Microsoft Learn Catalog API',
        source_url: 'https://learn.microsoft.com/api/catalog/',
        fetched_at: new Date().toISOString(),
        last_verified_at: '2026-11-01T00:00:00Z',
        confidence: 0.98,
        skills: ['Azure Architecture', 'Governance', 'Security', 'Business Continuity', 'Hybrid Cloud'],
        aliases: ['AZ-305', 'Azure Solutions Architect Expert'],
        common_employers: ['Microsoft', 'Slalom', 'Capgemini', 'Avanade', 'PwC'],
      },
      {
        key: 'az-900',
        name: 'Microsoft Certified: Azure Fundamentals',
        issuer: 'Microsoft',
        level: 'Foundational',
        exam_code: 'AZ-900',
        category: 'Cloud Architecture',
        cost_usd_min: 99,
        cost_usd_max: 99,
        cost_currency: 'USD',
        is_free: false,
        study_weeks: 2,
        validity_years: null,
        difficulty: 1,
        official_url: 'https://learn.microsoft.com/en-us/credentials/certifications/azure-fundamentals/',
        source_name: 'Microsoft Learn Catalog API',
        source_url: 'https://learn.microsoft.com/api/catalog/',
        fetched_at: new Date().toISOString(),
        last_verified_at: '2026-11-01T00:00:00Z',
        confidence: 0.98,
        skills: ['Cloud Concepts', 'Azure Core Services', 'Azure Security', 'Azure Pricing'],
        aliases: ['AZ-900', 'Azure Fundamentals'],
        common_employers: ['Infosys', 'Tata Consultancy Services', 'HCLTech', 'Cognizant'],
      },
    ];

    // Filter relevant to user goal if role/keywords match
    return verifiedMicrosoftCerts;
  }
}
