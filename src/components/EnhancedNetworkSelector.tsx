import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

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
  number_patterns: string[];
}

interface EnhancedNetworkSelectorProps {
  selectedCountry: string;
  onCountryChange: (countryId: string, countryData: Country) => void;
  selectedOperator: string;
  onOperatorChange: (operatorId: string) => void;
  phoneNumber: string;
  onPhoneNumberChange: (phone: string) => void;
  onValidationChange: (isValid: boolean) => void;
}

const EnhancedNetworkSelector: React.FC<EnhancedNetworkSelectorProps> = ({
  selectedCountry,
  onCountryChange,
  selectedOperator,
  onOperatorChange,
  phoneNumber,
  onPhoneNumberChange,
  onValidationChange
}) => {
  const [countries, setCountries] = useState<Country[]>([]);
  const [operators, setOperators] = useState<MobileOperator[]>([]);
  const [loading, setLoading] = useState(false);
  const [validation, setValidation] = useState<{
    isValid: boolean;
    message: string;
    detectedOperator?: string;
  }>({ isValid: false, message: '' });

  // Charger les pays
  useEffect(() => {
    const fetchCountries = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('countries')
          .select('*')
          .order('name');
        
        if (error) throw error;
        setCountries(data || []);
      } catch (error) {
        console.error('Erreur lors du chargement des pays:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCountries();
  }, []);

  // Charger les opérateurs quand un pays est sélectionné
  useEffect(() => {
    const fetchOperators = async () => {
      if (!selectedCountry) {
        setOperators([]);
        return;
      }

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('mobile_operators')
          .select('*')
          .eq('country_id', selectedCountry)
          .order('name');
        
        if (error) throw error;
        setOperators(data || []);
      } catch (error) {
        console.error('Erreur lors du chargement des opérateurs:', error);
        setOperators([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchOperators();
  }, [selectedCountry]);

  // Valider le numéro de téléphone
  useEffect(() => {
    const validatePhoneNumber = () => {
      if (!phoneNumber || !selectedCountry) {
        setValidation({ isValid: false, message: '' });
        onValidationChange(false);
        return;
      }

      const selectedCountryData = countries.find(c => c.id === selectedCountry);
      if (!selectedCountryData) {
        setValidation({ isValid: false, message: 'Pays non trouvé' });
        onValidationChange(false);
        return;
      }

      // Nettoyer le numéro
      const cleanNumber = phoneNumber.replace(/[\s\-\(\)]/g, '');
      
      // Vérifier le format avec l'indicatif du pays
      const fullNumber = cleanNumber.startsWith(selectedCountryData.phone_prefix) 
        ? cleanNumber 
        : selectedCountryData.phone_prefix + cleanNumber;

      // Chercher l'opérateur correspondant
      const matchingOperator = operators.find(op => 
        op.number_patterns.some(pattern => {
          const regex = new RegExp(`^${pattern.replace(/x/g, '\\d')}`);
          return regex.test(fullNumber);
        })
      );

      if (matchingOperator) {
        setValidation({
          isValid: true,
          message: `Numéro valide pour ${matchingOperator.name}`,
          detectedOperator: matchingOperator.id
        });
        onValidationChange(true);
        
        // Auto-sélectionner l'opérateur si pas encore sélectionné
        if (!selectedOperator) {
          onOperatorChange(matchingOperator.id);
        }
      } else {
        setValidation({
          isValid: false,
          message: `Numéro non valide pour ${selectedCountryData.name}`
        });
        onValidationChange(false);
      }
    };

    validatePhoneNumber();
  }, [phoneNumber, selectedCountry, operators, countries, selectedOperator, onValidationChange, onOperatorChange]);

  const handleCountryChange = (countryId: string) => {
    const countryData = countries.find(c => c.id === countryId);
    if (countryData) {
      onCountryChange(countryId, countryData);
      // Reset operator when country changes
      onOperatorChange('');
    }
  };

  const formatPhoneNumber = (phone: string) => {
    const clean = phone.replace(/[\s\-\(\)]/g, '');
    if (clean.length >= 8) {
      return clean.replace(/(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4');
    }
    return phone;
  };

  return (
    <div className="space-y-4">
      {/* Sélection du pays */}
      <div className="space-y-2">
        <Label>Pays</Label>
        <Select value={selectedCountry} onValueChange={handleCountryChange}>
          <SelectTrigger>
            <SelectValue placeholder="Sélectionnez un pays" />
          </SelectTrigger>
          <SelectContent>
            {countries.map((country) => (
              <SelectItem key={country.id} value={country.id}>
                <div className="flex items-center gap-2">
                  <span>{country.flag_emoji}</span>
                  <span>{country.name}</span>
                  <Badge variant="outline">{country.phone_prefix}</Badge>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Numéro de téléphone */}
      <div className="space-y-2">
        <Label>Numéro Mobile Money</Label>
        <div className="relative">
          <Input
            type="tel"
            placeholder="Ex: 70 12 34 56"
            value={formatPhoneNumber(phoneNumber)}
            onChange={(e) => onPhoneNumberChange(e.target.value.replace(/\s/g, ''))}
            className={validation.isValid ? 'border-green-500' : validation.message && !validation.isValid ? 'border-red-500' : ''}
          />
          {validation.message && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              {validation.isValid ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-500" />
              )}
            </div>
          )}
        </div>
        {validation.message && (
          <p className={`text-xs ${validation.isValid ? 'text-green-600' : 'text-red-600'}`}>
            {validation.message}
          </p>
        )}
      </div>

      {/* Sélection de l'opérateur */}
      {operators.length > 0 && (
        <div className="space-y-2">
          <Label>Opérateur Mobile Money</Label>
          <Select value={selectedOperator} onValueChange={onOperatorChange}>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionnez un opérateur" />
            </SelectTrigger>
            <SelectContent>
              {operators.map((operator) => (
                <SelectItem key={operator.id} value={operator.id}>
                  {operator.name}
                  {validation.detectedOperator === operator.id && (
                    <Badge variant="secondary" className="ml-2">Détecté</Badge>
                  )}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {loading && (
        <div className="text-sm text-muted-foreground">
          Chargement...
        </div>
      )}
    </div>
  );
};

export default EnhancedNetworkSelector;