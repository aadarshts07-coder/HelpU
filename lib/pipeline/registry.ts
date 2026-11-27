import fs from 'fs';
import path from 'path';

export interface RegisteredCompany {
  id: string;
  name: string;
  domain: string;
  countryCode: string;
  stateCode?: string;
  cities: string[];
  headquarters: string;
  atsVendor: 'greenhouse' | 'lever' | 'ashby' | 'smartrecruiters' | 'workable' | 'direct';
  atsIdentifier: string;
  careersUrl: string;
  hasMaduraiOffice?: boolean;
  active: boolean;
}

const REGISTRY_PATH = path.join(process.cwd(), 'data', 'companies-registry.json');

let cachedRegistry: RegisteredCompany[] | null = null;

export function getCompanyRegistry(): RegisteredCompany[] {
  if (cachedRegistry) return cachedRegistry;

  try {
    if (fs.existsSync(REGISTRY_PATH)) {
      const raw = fs.readFileSync(REGISTRY_PATH, 'utf8');
      cachedRegistry = JSON.parse(raw);
      return cachedRegistry || [];
    }
  } catch (err) {
    console.error('Failed to read companies-registry.json', err);
  }

  return [];
}

export function getCompaniesByCity(cityName: string): RegisteredCompany[] {
  const norm = cityName.toLowerCase().trim();
  const registry = getCompanyRegistry();

  return registry.filter((c) => {
    if (norm === 'madurai' && c.hasMaduraiOffice) return true;
    return c.cities.some((city) => city.toLowerCase() === norm);
  });
}

export function getCompaniesByCountry(countryCode: string): RegisteredCompany[] {
  const norm = countryCode.toLowerCase().trim();
  const registry = getCompanyRegistry();
  return registry.filter((c) => c.countryCode.toLowerCase() === norm);
}

export function addCompanyToRegistry(company: Omit<RegisteredCompany, 'id'>): RegisteredCompany {
  const registry = getCompanyRegistry();
  const newComp: RegisteredCompany = {
    ...company,
    id: `comp_${company.domain.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}`,
    active: true,
  };

  registry.push(newComp);
  cachedRegistry = registry;

  try {
    fs.writeFileSync(REGISTRY_PATH, JSON.stringify(registry, null, 2), 'utf8');
  } catch (e) {
    console.error('Failed to persist company to registry', e);
  }

  return newComp;
}
