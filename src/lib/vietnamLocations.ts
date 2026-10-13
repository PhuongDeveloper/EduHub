export type AdministrativeUnit = {
  code: number;
  name: string;
  division_type?: string;
  province_code?: number;
};

const API_ROOT = 'https://provinces.open-api.vn/api/v2';
const CACHE_PREFIX = 'eduhub-vn-address-v2:';
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000;

function readCache<T>(key: string): T | null {
  try {
    const stored = localStorage.getItem(CACHE_PREFIX + key);
    if (!stored) return null;
    const entry = JSON.parse(stored) as { savedAt: number; value: T };
    return Date.now() - entry.savedAt < CACHE_TTL ? entry.value : null;
  } catch {
    return null;
  }
}

function writeCache<T>(key: string, value: T) {
  try {
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({ savedAt: Date.now(), value }));
  } catch {
    // The address selector remains usable when browser storage is unavailable.
  }
}

async function fetchUnits<T>(key: string, path: string): Promise<T> {
  const cached = readCache<T>(key);
  if (cached) return cached;
  const response = await fetch(`${API_ROOT}${path}`, { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`Không tải được danh sách địa giới (${response.status}).`);
  const data = await response.json() as T;
  writeCache(key, data);
  return data;
}

export function getVietnamProvinces() {
  return fetchUnits<AdministrativeUnit[]>('provinces', '/p/');
}

export function getVietnamWards(provinceCode: number) {
  return fetchUnits<AdministrativeUnit[]>(`wards:${provinceCode}`, `/w/?province=${provinceCode}`);
}
