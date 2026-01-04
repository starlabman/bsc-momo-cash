import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowRightLeft, ArrowDownUp } from 'lucide-react';
import OfframpForm from '@/components/OfframpForm';
import OnrampForm from '@/components/OnrampForm';
import Footer from '@/components/Footer';
import Header from '@/components/Header';
import TestimonialsSection from '@/components/TestimonialsSection';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/3">
      <Header />

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

          {/* Testimonials Section */}
          <TestimonialsSection />
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
