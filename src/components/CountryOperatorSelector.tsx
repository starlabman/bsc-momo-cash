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
    validatePhoneNumber();
  }, [phoneNumber, selectedOperator, operators]);

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

  const validatePhoneNumber = () => {
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
    return <div className="space-y-4">Chargement des pays...</div>;
  }

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="country">Pays</Label>
        <Select value={selectedCountry} onValueChange={(value) => {
          const country = countries.find(c => c.id === value);
          if (country) {
            onCountryChange(value, country);
            onOperatorChange(''); // Reset operator when country changes
            onPhoneNumberChange(''); // Reset phone number when country changes
          }
        }}>
          <SelectTrigger>
            <SelectValue placeholder="Sélectionnez un pays" />
          </SelectTrigger>
          <SelectContent className="bg-background border border-border">
            {countries.map((country) => (
              <SelectItem key={country.id} value={country.id}>
                <div className="flex items-center gap-2">
                  <span>{country.flag_emoji}</span>
                  <span>{country.name}</span>
                  <span className="text-muted-foreground">({country.phone_prefix})</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedCountry && (
        <div>
          <Label htmlFor="operator">Opérateur Mobile Money</Label>
          <Select value={selectedOperator} onValueChange={onOperatorChange}>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionnez un opérateur" />
            </SelectTrigger>
            <SelectContent className="bg-background border border-border">
              {operators.map((operator) => (
                <SelectItem key={operator.id} value={operator.name}>
                  {operator.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {selectedCountry && selectedOperator && (
        <div>
          <Label htmlFor="phoneNumber">
            Numéro Mobile Money
            {getSelectedCountry() && (
              <span className="text-muted-foreground ml-2">
                ({getSelectedCountry()?.phone_prefix})
              </span>
            )}
          </Label>
          <div className="relative">
            <Input
              id="phoneNumber"
              type="tel"
              value={phoneNumber}
              onChange={(e) => {
                const formatted = formatPhoneNumber(e.target.value);
                onPhoneNumberChange(formatted);
              }}
              placeholder="Ex: 70123456"
              className={`
                ${isPhoneNumberValid() === false ? 'border-destructive' : ''}
                ${isPhoneNumberValid() === true ? 'border-green-500' : ''}
              `}
            />
            {phoneNumber && (
              <div className="text-sm text-muted-foreground mt-1">
                Numéro complet: {getDisplayPhoneNumber()}
              </div>
            )}
            {isPhoneNumberValid() === false && phoneNumber && (
              <div className="text-sm text-destructive mt-1">
                Format de numéro invalide pour cet opérateur
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};