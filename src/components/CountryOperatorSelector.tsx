import React, { useState, useEffect } from 'react';
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from 'react-i18next';

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
  deposit_number: string | null;
}

interface CountryOperatorSelectorProps {
  selectedCountry?: string;
  selectedOperator?: string;
  phoneNumber: string;
  onCountryChange: (countryId: string, country: Country) => void;
  onOperatorChange: (operatorName: string, operator?: MobileOperator) => void;
  onPhoneNumberChange: (phoneNumber: string) => void;
  onValidationChange: (isValid: boolean) => void;
}

export type { MobileOperator, Country };

export const CountryOperatorSelector: React.FC<CountryOperatorSelectorProps> = ({
  selectedCountry,
  selectedOperator,
  phoneNumber,
  onCountryChange,
  onOperatorChange,
  onPhoneNumberChange,
  onValidationChange
}) => {
  const { t } = useTranslation();
  const [countries, setCountries] = useState<Country[]>([]);
  const [operators, setOperators] = useState<MobileOperator[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchCountries();
  }, []);

  useEffect(() => {
    if (selectedCountry) {
      fetchOperators(selectedCountry);
    } else {
      setOperators([]);
    }
  }, [selectedCountry]);

  useEffect(() => {
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
      const { data: visData } = await supabase
        .from('country_visibility')
        .select('country_id, is_visible');

      const visibleIds = visData
        ? (visData as any[]).filter(v => v.is_visible).map(v => v.country_id)
        : null;

      let query = supabase.from('countries').select('*').order('name');

      if (visibleIds && visibleIds.length > 0) {
        query = query.in('id', visibleIds);
      }

      const { data, error } = await query;
      if (error) throw error;
      setCountries(data || []);
    } catch (error) {
      console.error('Error fetching countries:', error);
      toast({
        title: t('errors.error'),
        description: t('countrySelector.loadError'),
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
        .eq('is_visible', true)
        .order('name');

      if (error) throw error;
      setOperators(data || []);
    } catch (error) {
      console.error('Error fetching operators:', error);
      toast({
        title: t('errors.error'),
        description: t('countrySelector.operatorLoadError'),
        variant: "destructive",
      });
    }
  };

  const getSelectedCountry = () => {
    return countries.find(c => c.id === selectedCountry);
  };

  const formatPhoneNumber = (value: string) => {
    const digits = value.replace(/\D/g, '');
    const country = getSelectedCountry();
    if (!country) return digits;

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
          <span className="text-sm">{t('countrySelector.loadingCountries')}</span>
        </div>
      </div>
    );
  }

  const selectedCountryObj = getSelectedCountry();

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <Label className="text-sm font-medium flex items-center gap-2">
          {t('countrySelector.country')}
        </Label>
        
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-1.5 sm:gap-2 mb-2">
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
        
        <Select value={selectedCountry} onValueChange={(value) => {
          const country = countries.find(c => c.id === value);
          if (country) {
            onCountryChange(value, country);
            onOperatorChange('');
            onPhoneNumberChange('');
          }
        }}>
          <SelectTrigger className="h-11">
            <SelectValue placeholder={t('countrySelector.selectCountry')} />
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

      {selectedCountry && operators.length > 0 && (
        <div className="space-y-3 animate-fade-in">
          <Label className="text-sm font-medium flex items-center gap-2">
            {t('countrySelector.operator')}
          </Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {operators.map((operator) => (
              <button
                key={operator.id}
                type="button"
                onClick={() => onOperatorChange(operator.name, operator)}
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

      {selectedCountry && selectedOperator && (
        <div className="space-y-2 animate-fade-in">
          <Label htmlFor="phoneNumber" className="text-sm font-medium flex items-center gap-2">
            {t('countrySelector.phoneNumber')}
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
                placeholder={t('countrySelector.phonePlaceholder')}
                className={`
                  rounded-l-none text-base h-11
                  ${isPhoneNumberValid() === false ? 'border-destructive focus-visible:ring-destructive' : ''}
                  ${isPhoneNumberValid() === true ? 'border-green-500 focus-visible:ring-green-500' : ''}
                `}
              />
            </div>
            
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
                    ? t('countrySelector.validNumber', { number: getDisplayPhoneNumber() })
                    : isPhoneNumberValid() === false 
                    ? t('countrySelector.invalidFormat')
                    : t('countrySelector.number', { number: getDisplayPhoneNumber() })
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
