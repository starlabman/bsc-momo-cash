// Shared MoMo number validation for offramp/onramp edge functions
// Validates a mobile money number against country phone_prefix and operator number_patterns
// stored in the public.countries and public.mobile_operators tables.

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.52.1';

export interface MomoValidationResult {
  valid: boolean;
  error?: string;
  sanitizedNumber: string;
  detectedOperatorId?: string;
  detectedOperatorName?: string;
}

/**
 * Normalize a momo number: strip non-digit/non-plus, then drop leading +.
 * Returns a digits-only string suitable for prefix matching.
 */
export function normalizeMomoNumber(input: string): string {
  const cleaned = input.replace(/[^\d+]/g, '');
  return cleaned.startsWith('+') ? cleaned.slice(1) : cleaned;
}

/**
 * Validate a momo number against a specific country and (optional) operator.
 * - Requires the number to start with the country phone_prefix (digits-only).
 * - If momoProvider is given, requires the number to match one of that operator's number_patterns.
 * - If momoProvider is omitted, requires the number to match SOME visible operator of the country.
 */
export async function validateMomoNumber(
  supabase: SupabaseClient,
  rawNumber: string,
  countryId?: string,
  momoProvider?: string,
): Promise<MomoValidationResult> {
  const sanitizedNumber = normalizeMomoNumber(rawNumber);

  if (sanitizedNumber.length < 8 || sanitizedNumber.length > 18) {
    return { valid: false, sanitizedNumber, error: 'Mobile number length is invalid' };
  }

  if (!countryId) {
    // No country provided: cannot perform contextual validation.
    // Accept format-only (already validated by zod regex upstream).
    return { valid: true, sanitizedNumber };
  }

  // Load country
  const { data: country, error: countryErr } = await supabase
    .from('countries')
    .select('id, name, phone_prefix')
    .eq('id', countryId)
    .maybeSingle();

  if (countryErr || !country) {
    return { valid: false, sanitizedNumber, error: 'Invalid country' };
  }

  const countryDigits = String(country.phone_prefix || '').replace(/[^\d]/g, '');
  if (countryDigits && !sanitizedNumber.startsWith(countryDigits)) {
    return {
      valid: false,
      sanitizedNumber,
      error: `Mobile number does not match the selected country (+${countryDigits} expected)`,
    };
  }

  // Load operators for the country
  const { data: operators, error: opsErr } = await supabase
    .from('mobile_operators')
    .select('id, name, number_patterns, is_visible')
    .eq('country_id', countryId);

  if (opsErr) {
    return { valid: false, sanitizedNumber, error: 'Unable to validate operator' };
  }

  const visibleOps = (operators || []).filter((o: any) => o.is_visible !== false);
  if (visibleOps.length === 0) {
    // No operators configured for this country: skip operator check.
    return { valid: true, sanitizedNumber };
  }

  // Patterns are regexes matching the LOCAL part of the number (without country prefix).
  const localNumber = countryDigits && sanitizedNumber.startsWith(countryDigits)
    ? sanitizedNumber.slice(countryDigits.length)
    : sanitizedNumber;

  const matchesPattern = (local: string, patterns: string[] | null | undefined): boolean => {
    if (!patterns || patterns.length === 0) return false;
    return patterns.some((p) => {
      try {
        return new RegExp(String(p)).test(local);
      } catch {
        return false;
      }
    });
  };


  if (momoProvider) {
    const target = visibleOps.find(
      (o: any) => String(o.name).toLowerCase() === momoProvider.toLowerCase(),
    );
    if (!target) {
      return { valid: false, sanitizedNumber, error: 'Selected operator is not available for this country' };
    }
    if (!matchesPattern(localNumber, target.number_patterns as string[])) {
      return {
        valid: false,
        sanitizedNumber,
        error: `Mobile number does not match ${target.name} prefixes for the selected country`,
      };
    }
    return {
      valid: true,
      sanitizedNumber,
      detectedOperatorId: target.id,
      detectedOperatorName: target.name,
    };
  }

  // No provider: must match at least one operator
  const detected = visibleOps.find((o: any) =>
    matchesPattern(sanitizedNumber, o.number_patterns as string[]),
  );
  if (!detected) {
    return {
      valid: false,
      sanitizedNumber,
      error: 'Mobile number prefix does not match any operator for the selected country',
    };
  }
  return {
    valid: true,
    sanitizedNumber,
    detectedOperatorId: detected.id,
    detectedOperatorName: detected.name,
  };
}
