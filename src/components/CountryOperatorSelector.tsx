import React, { useState, useEffect } from 'react';
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Country {
  id: string;
  name: string;
  code: string;
  phone_prefix: string;
  flag_emoji: string;
}

interface MobileOperator {
  id: string;
  name: string;
  country_id: string;
  number_patterns: string[];
}

interface CountryOperatorSelectorProps {
  selectedCountry?: string;
  selectedOperator?: string;
  phoneNumber: string;
  onCountryChange: (countryId: string, country: Country) => void;
  onOperatorChange: (operatorName: string) => void;
  onPhoneNumberChange: (phoneNumber: string) => void;
  onValidationChange: (isValid: boolean) => void;
}

export const CountryOperatorSelector: React.FC<CountryOperatorSelectorProps> = ({
  selectedCountry,
  selectedOperator,
  phoneNumber,
  onCountryChange,
  onOperatorChange,
  onPhoneNumberChange,
  onValidationChange
}) => {
  const [countries, setCountries] = useState<Country[]>([]);
  const [operators, setOperators] = useState<MobileOperator[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Load countries on component mount
  useEffect(() => {
    fetchCountries();
  }, []);

  // Load operators when country changes
  useEffect(() => {
    if (selectedCountry) {
      fetchOperators(selectedCountry);
    } else {
      setOperators([]);
    }
  }, [selectedCountry]);

  // Validate phone number when it changes or operator changes
  useEffect(() => {
    // Use setTimeout to avoid calling setState during render of parent component
    const timeoutId = setTimeout(() => {
      if (!phoneNumber || !selectedOperator) {
        onValidationChange(false);
        return;
      }

      const selectedOp = operators.find(op => op.name === selectedOperator);
      if (!selectedOp) {
        onValidationChange(false);
        return;
      }

      // Check if phone number matches any of the operator's patterns
      const isValid = selectedOp.number_patterns.some(pattern => {
        const regex = new RegExp(pattern);
        return regex.test(phoneNumber);
      });

      onValidationChange(isValid);
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [phoneNumber, selectedOperator, operators, onValidationChange]);

  const fetchCountries = async () => {
    try {
      const { data, error } = await supabase
        .from('countries')
        .select('*')
        .order('name');

      if (error) throw error;
      setCountries(data || []);
    } catch (error) {
      console.error('Error fetching countries:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les pays",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchOperators = async (countryId: string) => {
    try {
      const { data, error } = await supabase
        .from('mobile_operators')
        .select('*')
        .eq('country_id', countryId)
        .order('name');

      if (error) throw error;
      setOperators(data || []);
    } catch (error) {
      console.error('Error fetching operators:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les opérateurs",
        variant: "destructive",
      });
    }
  };

  const getSelectedCountry = () => {
    return countries.find(c => c.id === selectedCountry);
  };

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    
    // Get current country
    const country = getSelectedCountry();
    if (!country) return digits;

    // Remove country prefix if user typed it
    const prefixDigits = country.phone_prefix.replace(/\D/g, '');
    if (digits.startsWith(prefixDigits)) {
      return digits.substring(prefixDigits.length);
    }

    return digits;
  };

  const getDisplayPhoneNumber = () => {
    const country = getSelectedCountry();
    if (!country || !phoneNumber) return phoneNumber;
    
    return `${country.phone_prefix} ${phoneNumber}`;
  };

  const isPhoneNumberValid = () => {
    if (!phoneNumber || !selectedOperator) return null;
    
    const selectedOp = operators.find(op => op.name === selectedOperator);
    if (!selectedOp) return null;

    return selectedOp.number_patterns.some(pattern => {
      const regex = new RegExp(pattern);
      return regex.test(phoneNumber);
    });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">Chargement des pays...</span>
        </div>
      </div>
    );
  }

  const selectedCountryObj = getSelectedCountry();

  return (
    <div className="space-y-4">
      {/* Country Selection with visual cards for popular countries */}
      <div className="space-y-3">
        <Label className="text-sm font-medium flex items-center gap-2">
          <span>🌍</span> Pays
        </Label>
        
        {/* Quick select for popular countries */}
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 mb-2">
          {countries.slice(0, 8).map((country) => (
            <button
              key={country.id}
              type="button"
              onClick={() => {
                onCountryChange(country.id, country);
                onOperatorChange('');
                onPhoneNumberChange('');
              }}
              className={`
                flex flex-col items-center p-2 rounded-lg border-2 transition-all duration-200
                hover:scale-105 hover:border-primary/50
                ${selectedCountry === country.id 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border hover:bg-muted/50'
                }
              `}
              title={country.name}
            >
              <span className="text-2xl">{country.flag_emoji}</span>
              <span className="text-[10px] text-muted-foreground mt-1 truncate w-full text-center">
                {country.code}
              </span>
            </button>
          ))}
        </div>
        
        {/* Dropdown for all countries */}
        <Select value={selectedCountry} onValueChange={(value) => {
          const country = countries.find(c => c.id === value);
          if (country) {
            onCountryChange(value, country);
            onOperatorChange('');
            onPhoneNumberChange('');
          }
        }}>
          <SelectTrigger className="h-11">
            <SelectValue placeholder="Ou sélectionnez un autre pays..." />
          </SelectTrigger>
          <SelectContent className="bg-background border border-border max-h-[300px]">
            {countries.map((country) => (
              <SelectItem key={country.id} value={country.id}>
                <div className="flex items-center gap-2">
                  <span className="text-lg">{country.flag_emoji}</span>
                  <span>{country.name}</span>
                  <span className="text-muted-foreground text-xs">({country.phone_prefix})</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Operator Selection with visual cards */}
      {selectedCountry && operators.length > 0 && (
        <div className="space-y-3 animate-fade-in">
          <Label className="text-sm font-medium flex items-center gap-2">
            <span>📱</span> Opérateur Mobile Money
          </Label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {operators.map((operator) => (
              <button
                key={operator.id}
                type="button"
                onClick={() => onOperatorChange(operator.name)}
                className={`
                  flex items-center justify-center p-3 rounded-lg border-2 transition-all duration-200
                  hover:scale-[1.02] hover:border-primary/50 font-medium text-sm
                  ${selectedOperator === operator.name 
                    ? 'border-primary bg-primary/5 text-primary' 
                    : 'border-border hover:bg-muted/50'
                  }
                `}
              >
                {operator.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Phone Number Input with better UX */}
      {selectedCountry && selectedOperator && (
        <div className="space-y-2 animate-fade-in">
          <Label htmlFor="phoneNumber" className="text-sm font-medium flex items-center gap-2">
            <span>📞</span> Numéro Mobile Money
          </Label>
          <div className="relative">
            <div className="flex">
              <div className="flex items-center px-3 bg-muted border border-r-0 border-input rounded-l-md text-sm text-muted-foreground">
                {selectedCountryObj?.flag_emoji} {selectedCountryObj?.phone_prefix}
              </div>
              <Input
                id="phoneNumber"
                type="tel"
                value={phoneNumber}
                onChange={(e) => {
                  const formatted = formatPhoneNumber(e.target.value);
                  onPhoneNumberChange(formatted);
                }}
                placeholder="70 123 456"
                className={`
                  rounded-l-none text-base h-11
                  ${isPhoneNumberValid() === false ? 'border-destructive focus-visible:ring-destructive' : ''}
                  ${isPhoneNumberValid() === true ? 'border-green-500 focus-visible:ring-green-500' : ''}
                `}
              />
            </div>
            
            {/* Validation feedback */}
            {phoneNumber && (
              <div className={`
                flex items-center gap-1.5 mt-2 text-sm
                ${isPhoneNumberValid() === true ? 'text-green-600' : ''}
                ${isPhoneNumberValid() === false ? 'text-destructive' : 'text-muted-foreground'}
              `}>
                {isPhoneNumberValid() === true && <span>✓</span>}
                {isPhoneNumberValid() === false && <span>✗</span>}
                <span>
                  {isPhoneNumberValid() === true 
                    ? `Numéro valide: ${getDisplayPhoneNumber()}`
                    : isPhoneNumberValid() === false 
                    ? 'Format invalide pour cet opérateur'
                    : `Numéro: ${getDisplayPhoneNumber()}`
                  }
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};