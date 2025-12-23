import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowRightLeft, Shield, Zap, Users, ArrowDownUp } from 'lucide-react';
import OfframpForm from '@/components/OfframpForm';
import OnrampForm from '@/components/OnrampForm';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/3">
      {/* Header */}
      <header className="border-b bg-background/90 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 hover-lift">
              <div className="h-10 w-10 bg-gradient-primary rounded-xl flex items-center justify-center shadow-glow">
                <ArrowRightLeft className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-hero bg-clip-text text-transparent">SikaPay</h1>
                <p className="text-xs text-muted-foreground font-medium">Crypto ↔ Mobile Money</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="text-xs animate-glow-pulse border-primary/30 bg-primary/5">
                Multi-Blockchain
              </Badge>
              <Link to="/about">
                <Button variant="ghost" size="sm" className="text-xs hover:bg-primary/10">
                  À propos
                </Button>
              </Link>
              <Button 
                variant="ghost" 
                size="sm" 
                className="glass-button text-xs hover:bg-primary/10"
                onClick={() => window.location.href = '/admin/login'}
              >
                Admin
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-12">
          {/* Hero Section */}
          <div className="text-center space-y-6 py-12 animate-slide-in-down">
            <div className="space-y-4">
              <h2 className="text-4xl md:text-6xl font-bold bg-gradient-hero bg-clip-text text-transparent animate-fade-in">
                Échangez Crypto ↔ Mobile Money
              </h2>
              <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto animate-slide-in-up font-medium">
                Solution multi-blockchain rapide et sécurisée pour vos conversions crypto ↔ XOF
              </p>
            </div>
            {/* Features */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 max-w-5xl mx-auto">
              <Card className="glass-card interactive-card border-primary/20 hover:border-primary/40 group">
                <CardContent className="pt-8 text-center">
                  <div className="mb-6 relative">
                    <div className="h-16 w-16 bg-gradient-primary rounded-2xl mx-auto flex items-center justify-center shadow-glow group-hover:animate-float">
                      <Shield className="h-8 w-8 text-white" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors">Sans KYC</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Aucune vérification d'identité requise, conversion rapide et anonyme
                  </p>
                </CardContent>
              </Card>
              
              <Card className="glass-card interactive-card border-primary/20 hover:border-primary/40 group" style={{ animationDelay: '0.1s' }}>
                <CardContent className="pt-8 text-center">
                  <div className="mb-6 relative">
                    <div className="h-16 w-16 bg-gradient-primary rounded-2xl mx-auto flex items-center justify-center shadow-glow group-hover:animate-float">
                      <Zap className="h-8 w-8 text-white" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors">Multi-Blockchain</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Support BSC, Ethereum, Tron, Solana, Arbitrum, Optimism et Lisk
                  </p>
                </CardContent>
              </Card>
              
              <Card className="glass-card interactive-card border-primary/20 hover:border-primary/40 group" style={{ animationDelay: '0.2s' }}>
                <CardContent className="pt-8 text-center">
                  <div className="mb-6 relative">
                    <div className="h-16 w-16 bg-gradient-primary rounded-2xl mx-auto flex items-center justify-center shadow-glow group-hover:animate-float">
                      <Users className="h-8 w-8 text-white" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors">Tous opérateurs</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Compatible Moov, MTN, Orange Money et Wave
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Conversion Forms */}
          <div className="max-w-6xl mx-auto">
            <Tabs defaultValue="crypto-to-momo" className="w-full animate-zoom-in">
              <TabsList className="grid w-full grid-cols-2 mb-10 bg-muted/20 backdrop-blur-sm border border-primary/10 h-14">
                <TabsTrigger 
                  value="crypto-to-momo" 
                  className="flex items-center gap-3 hover-lift text-base font-medium h-12 data-[state=active]:bg-gradient-primary data-[state=active]:text-white"
                >
                  <ArrowRightLeft className="h-5 w-5" />
                  Crypto → Mobile Money
                </TabsTrigger>
                <TabsTrigger 
                  value="momo-to-crypto" 
                  className="flex items-center gap-3 hover-lift text-base font-medium h-12 data-[state=active]:bg-gradient-primary data-[state=active]:text-white"
                >
                  <ArrowDownUp className="h-5 w-5" />
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
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-gradient-to-r from-muted/10 via-muted/20 to-muted/10 backdrop-blur-sm mt-20">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                  <ArrowRightLeft className="h-5 w-5 text-white" />
                </div>
                <span className="text-lg font-bold bg-gradient-hero bg-clip-text text-transparent">SikaPay</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Solution off-ramp crypto vers Mobile Money multi-blockchain.
              </p>
            </div>
            
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground">Réseaux supportés</h3>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="text-xs">BSC</Badge>
                <Badge variant="outline" className="text-xs">Ethereum</Badge>
                <Badge variant="outline" className="text-xs">Tron</Badge>
                <Badge variant="outline" className="text-xs">Solana</Badge>
                <Badge variant="outline" className="text-xs">Arbitrum</Badge>
                <Badge variant="outline" className="text-xs">Optimism</Badge>
                <Badge variant="outline" className="text-xs">Lisk</Badge>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground">Pays supportés</h3>
              <div className="flex flex-wrap gap-3 text-3xl">
                <span className="hover:scale-125 transition-transform cursor-pointer" title="Bénin">🇧🇯</span>
                <span className="hover:scale-125 transition-transform cursor-pointer" title="Burkina Faso">🇧🇫</span>
                <span className="hover:scale-125 transition-transform cursor-pointer" title="Côte d'Ivoire">🇨🇮</span>
                <span className="hover:scale-125 transition-transform cursor-pointer" title="Guinée">🇬🇳</span>
                <span className="hover:scale-125 transition-transform cursor-pointer" title="Mali">🇲🇱</span>
                <span className="hover:scale-125 transition-transform cursor-pointer" title="Niger">🇳🇪</span>
                <span className="hover:scale-125 transition-transform cursor-pointer" title="Sénégal">🇸🇳</span>
                <span className="hover:scale-125 transition-transform cursor-pointer" title="Togo">🇹🇬</span>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground">Avantages</h3>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• Sans frais utilisateur</li>
                <li>• Conversion instantanée</li>
                <li>• Sans vérification KYC</li>
                <li>• Support 24/7</li>
              </ul>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8 border-t border-primary/10">
            <div className="text-sm text-muted-foreground">
              © 2024 SikaPay. Tous droits réservés.
            </div>
            <div className="flex items-center gap-6 text-xs text-muted-foreground">
              <span className="flex items-center gap-2">
                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                Service en ligne
              </span>
              <span>USDC/USDT ↔ XOF</span>
              <span>Multi-Blockchain</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
