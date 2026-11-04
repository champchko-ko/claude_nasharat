import { compliancePairKey } from "./compliancePairKey";

interface ResponseItem {
  circular_id: string;
  department_id: string;
  status: string;
}

/**
 * Latest response status per (circular, department).
 *
 * Rows are already filtered to `is_latest` by the query; building the map once
 * keeps the calculation linear instead of filtering the response list per pair.
 */
export function indexResponseStatusByPair(responses: ResponseItem[]): Map<string, string> {
  const byPair = new Map<string, string>();

  for (const response of responses) {
    if (!response.department_id) {
      continue;
    }
    byPair.set(compliancePairKey(response.circular_id, response.department_id), response.status);
  }

  return byPair;
}
