// Utilitaires pour la détection automatique des opérateurs mobile
// Basé sur les préfixes téléphoniques des pays francophones utilisant XOF

export interface MobileOperator {
  name: string;
  country: string;
  prefixes: string[];
  code: string;
}

// Opérateurs des pays francophones utilisant XOF (UEMOA)
export const FRANCOPHONE_XOF_OPERATORS: MobileOperator[] = [
  // Sénégal (+221)
  {
    name: "Orange",
    country: "Sénégal",
    prefixes: ["22177", "22178", "22170"],
    code: "SN_ORANGE"
  },
  {
    name: "Wave",
    country: "Sénégal", 
    prefixes: ["22176", "22175"],
    code: "SN_WAVE"
  },
  {
    name: "Free",
    country: "Sénégal",
    prefixes: ["22130", "22131", "22132"],
    code: "SN_FREE"
  },
  
  // Côte d'Ivoire (+225)
  {
    name: "Orange",
    country: "Côte d'Ivoire",
    prefixes: ["22507", "22508", "22509", "22547", "22548", "22549"],
    code: "CI_ORANGE"
  },
  {
    name: "MTN",
    country: "Côte d'Ivoire", 
    prefixes: ["22505", "22506", "22545", "22546"],
    code: "CI_MTN"
  },
  {
    name: "Moov",
    country: "Côte d'Ivoire",
    prefixes: ["22501", "22502", "22503", "22541", "22542", "22543"],
    code: "CI_MOOV"
  },
  
  // Mali (+223)
  {
    name: "Orange",
    country: "Mali",
    prefixes: ["22370", "22371", "22372", "22373", "22374", "22375", "22376", "22377"],
    code: "ML_ORANGE"
  },
  {
    name: "Malitel",
    country: "Mali",
    prefixes: ["22366", "22367", "22368", "22369"],
    code: "ML_MALITEL"
  },
  
  // Burkina Faso (+226)
  {
    name: "Orange",
    country: "Burkina Faso",
    prefixes: ["22670", "22671", "22672", "22673", "22674", "22675"],
    code: "BF_ORANGE"
  },
  {
    name: "Moov",
    country: "Burkina Faso",
    prefixes: ["22676", "22677", "22678", "22679"],
    code: "BF_MOOV"
  },
  
  // Togo (+228)
  {
    name: "Moov",
    country: "Togo",
    prefixes: ["22890", "22891", "22892", "22893", "22897", "22898", "22899"],
    code: "TG_MOOV"
  },
  {
    name: "Togocel",
    country: "Togo",
    prefixes: ["22870", "22871", "22872", "22873"],
    code: "TG_TOGOCEL"
  },
  
  // Niger (+227)
  {
    name: "Orange",
    country: "Niger",
    prefixes: ["22796", "22797", "22798", "22799"],
    code: "NE_ORANGE"
  },
  {
    name: "Moov",
    country: "Niger",
    prefixes: ["22790", "22791", "22792", "22793"],
    code: "NE_MOOV"
  },
  
  // Bénin (+229)
  {
    name: "MTN",
    country: "Bénin",
    prefixes: ["22996", "22997", "22953", "22954", "22955", "22956"],
    code: "BJ_MTN"
  },
  {
    name: "Moov",
    country: "Bénin",
    prefixes: ["22998", "22999", "22961", "22962", "22966", "22967"],
    code: "BJ_MOOV"
  }
];

/**
 * Détecte automatiquement l'opérateur mobile basé sur le numéro de téléphone
 * @param phoneNumber - Numéro de téléphone (avec ou sans indicatif pays)
 * @returns Opérateur détecté ou null si non trouvé
 */
export function detectOperator(phoneNumber: string): MobileOperator | null {
  // Nettoyer le numéro (enlever espaces, tirets, etc.)
  const cleanNumber = phoneNumber.replace(/[\s\-\(\)]/g, '');
  
  // Vérifier chaque opérateur
  for (const operator of FRANCOPHONE_XOF_OPERATORS) {
    for (const prefix of operator.prefixes) {
      if (cleanNumber.startsWith(prefix)) {
        return operator;
      }
    }
  }
  
  return null;
}

/**
 * Valide si un numéro appartient aux pays francophones XOF
 * @param phoneNumber - Numéro de téléphone
 * @returns true si valide, false sinon
 */
export function isValidFrancophoneXOFNumber(phoneNumber: string): boolean {
  return detectOperator(phoneNumber) !== null;
}

/**
 * Formate un numéro de téléphone pour l'affichage
 * @param phoneNumber - Numéro brut
 * @returns Numéro formaté
 */
export function formatPhoneNumber(phoneNumber: string): string {
  const clean = phoneNumber.replace(/[\s\-\(\)]/g, '');
  
  // Format pour les numéros avec indicatif pays
  if (clean.length >= 11) {
    const countryCode = clean.substring(0, 3);
    const number = clean.substring(3);
    return `${countryCode} ${number.replace(/(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4')}`;
  }
  
  return clean;
}

/**
 * Obtient la liste des opérateurs disponibles par pays
 * @returns Groupement des opérateurs par pays
 */
export function getOperatorsByCountry(): Record<string, MobileOperator[]> {
  return FRANCOPHONE_XOF_OPERATORS.reduce((acc, operator) => {
    if (!acc[operator.country]) {
      acc[operator.country] = [];
    }
    acc[operator.country].push(operator);
    return acc;
  }, {} as Record<string, MobileOperator[]>);
}