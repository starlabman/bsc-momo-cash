import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRightLeft, Shield, Zap, Users } from 'lucide-react';
import OfframpForm from '@/components/OfframpForm';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
                <ArrowRightLeft className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold">CryptoMomo</h1>
                <p className="text-xs text-muted-foreground">Crypto → Mobile Money</p>
              </div>
            </div>
            <Badge variant="outline" className="text-xs">
              BSC Network
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Hero Section */}
          <div className="text-center space-y-4 py-8">
            <h2 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Convertissez vos cryptos en XOF
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Solution rapide et sécurisée pour convertir vos USDC/USDT (BSC) directement sur votre Mobile Money
            </p>
            
            {/* Features */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 max-w-4xl mx-auto">
              <Card className="border-primary/20">
                <CardContent className="pt-6 text-center">
                  <Shield className="h-12 w-12 text-primary mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">Sans KYC</h3>
                  <p className="text-sm text-muted-foreground">
                    Aucune vérification d'identité requise, conversion rapide et anonyme
                  </p>
                </CardContent>
              </Card>
              
              <Card className="border-primary/20">
                <CardContent className="pt-6 text-center">
                  <Zap className="h-12 w-12 text-primary mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">Instantané</h3>
                  <p className="text-sm text-muted-foreground">
                    Transaction détectée automatiquement, paiement mobile sous 24h
                  </p>
                </CardContent>
              </Card>
              
              <Card className="border-primary/20">
                <CardContent className="pt-6 text-center">
                  <Users className="h-12 w-12 text-primary mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">Tous opérateurs</h3>
                  <p className="text-sm text-muted-foreground">
                    Compatible Moov, MTN, Orange Money et Wave
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Conversion Form */}
          <OfframpForm />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-muted/30 mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-sm text-muted-foreground">
              © 2024 CryptoMomo. Solution off-ramp crypto vers Mobile Money.
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>BSC Network</span>
              <span>•</span>
              <span>USDC/USDT → XOF</span>
              <span>•</span>
              <span>Sans frais utilisateur</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
