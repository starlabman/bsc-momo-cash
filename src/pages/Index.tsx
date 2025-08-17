import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowRightLeft, Shield, Zap, Users, ArrowDownUp } from 'lucide-react';
import OfframpForm from '@/components/OfframpForm';
import OnrampForm from '@/components/OnrampForm';

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
                <p className="text-xs text-muted-foreground">Crypto ↔ Mobile Money</p>
              </div>
            </div>
            <Badge variant="outline" className="text-xs animate-fade-in">
              Multi-Blockchain
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Hero Section */}
          <div className="text-center space-y-4 py-8 animate-slide-in-down">
            <h2 className="text-4xl font-bold bg-gradient-hero bg-clip-text text-transparent animate-fade-in">
              Échangez Crypto ↔ Mobile Money
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto animate-slide-in-up">
              Solution multi-blockchain rapide et sécurisée pour vos conversions crypto ↔ XOF
            </p>
            
            {/* Features */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 max-w-4xl mx-auto">
              <Card className="border-primary/20 hover-scale animate-bounce-in shadow-card">
                <CardContent className="pt-6 text-center">
                  <Shield className="h-12 w-12 text-primary mx-auto mb-4 animate-float" />
                  <h3 className="font-semibold mb-2">Sans KYC</h3>
                  <p className="text-sm text-muted-foreground">
                    Aucune vérification d'identité requise, conversion rapide et anonyme
                  </p>
                </CardContent>
              </Card>
              
              <Card className="border-primary/20 hover-scale animate-bounce-in shadow-card" style={{ animationDelay: '0.1s' }}>
                <CardContent className="pt-6 text-center">
                  <Zap className="h-12 w-12 text-primary mx-auto mb-4 animate-float" style={{ animationDelay: '1s' }} />
                  <h3 className="font-semibold mb-2">Multi-Blockchain</h3>
                  <p className="text-sm text-muted-foreground">
                    Support BSC, Ethereum, Tron, Solana, Arbitrum, Optimism et Lisk
                  </p>
                </CardContent>
              </Card>
              
              <Card className="border-primary/20 hover-scale animate-bounce-in shadow-card" style={{ animationDelay: '0.2s' }}>
                <CardContent className="pt-6 text-center">
                  <Users className="h-12 w-12 text-primary mx-auto mb-4 animate-float" style={{ animationDelay: '2s' }} />
                  <h3 className="font-semibold mb-2">Tous opérateurs</h3>
                  <p className="text-sm text-muted-foreground">
                    Compatible Moov, MTN, Orange Money et Wave
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Conversion Forms */}
          <Tabs defaultValue="crypto-to-momo" className="w-full max-w-4xl mx-auto animate-zoom-in">
            <TabsList className="grid w-full grid-cols-2 mb-8 bg-muted/30 hover:bg-muted/50 transition-colors">
              <TabsTrigger value="crypto-to-momo" className="flex items-center gap-2 hover-scale">
                <ArrowRightLeft className="h-4 w-4" />
                Crypto → Mobile Money
              </TabsTrigger>
              <TabsTrigger value="momo-to-crypto" className="flex items-center gap-2 hover-scale">
                <ArrowDownUp className="h-4 w-4" />
                Mobile Money → Crypto
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="crypto-to-momo" className="animate-fade-in">
              <OfframpForm />
            </TabsContent>
            
            <TabsContent value="momo-to-crypto" className="animate-fade-in">
              <OnrampForm />
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-muted/30 mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-sm text-muted-foreground">
              © 2024 CryptoMomo. Solution off-ramp crypto vers Mobile Money.
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground animate-fade-in">
              <span>Multi-Blockchain</span>
              <span>•</span>
              <span>USDC/USDT ↔ XOF</span>
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
