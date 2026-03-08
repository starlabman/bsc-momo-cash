import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowRightLeft, ArrowDownUp } from 'lucide-react';
import OfframpForm from '@/components/OfframpForm';
import OnrampForm from '@/components/OnrampForm';
import Footer from '@/components/Footer';
import Header from '@/components/Header';
import TestimonialsSection from '@/components/TestimonialsSection';
import TransactionHistory from '@/components/TransactionHistory';
import FloatingParticles from '@/components/FloatingParticles';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 relative overflow-hidden">
      <FloatingParticles />
      <Header />

      {/* Main Content */}
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <div className="space-y-8 sm:space-y-12">
          {/* Hero Section */}
          <div className="text-center space-y-6 sm:space-y-8 py-10 sm:py-16 md:py-24 relative">
            {/* Background glow effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute top-1/2 left-1/4 w-72 h-72 bg-primary/20 rounded-full blur-[100px] animate-pulse" />
              <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-orange-500/15 rounded-full blur-[120px] animate-pulse delay-1000" />
            </div>
            
            <div className="space-y-6 relative z-10">
              <h2 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold leading-tight">
                <span className="inline-block animate-fade-in opacity-0 [animation-delay:0.1s] [animation-fill-mode:forwards] bg-gradient-to-r from-primary via-violet-500 to-primary bg-clip-text text-transparent">
                  Échangez Crypto
                </span>
                <span className="inline-block mx-3 md:mx-4 animate-fade-in opacity-0 [animation-delay:0.3s] [animation-fill-mode:forwards] text-primary/80 animate-pulse">
                  ↔
                </span>
                <span className="inline-block animate-fade-in opacity-0 [animation-delay:0.5s] [animation-fill-mode:forwards] bg-gradient-to-r from-orange-400 via-amber-500 to-orange-600 bg-clip-text text-transparent">
                  Mobile Money
                </span>
              </h2>
              <p className="text-lg md:text-xl lg:text-2xl text-muted-foreground max-w-3xl mx-auto animate-fade-in opacity-0 [animation-delay:0.8s] [animation-fill-mode:forwards] font-medium leading-relaxed">
                Solution multi-blockchain rapide et sécurisée pour vos conversions crypto ↔ XOF
              </p>
              
              {/* Animated underline */}
              <div className="flex justify-center animate-fade-in opacity-0 [animation-delay:1s] [animation-fill-mode:forwards]">
                <div className="h-1 w-24 bg-gradient-to-r from-primary via-violet-500 to-orange-500 rounded-full animate-shimmer" />
              </div>
            </div>
          </div>

          {/* Conversion Forms */}
          <div className="max-w-6xl mx-auto animate-fade-in opacity-0 [animation-delay:1.2s] [animation-fill-mode:forwards]">
            <Tabs defaultValue="crypto-to-momo" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-10 bg-muted/30 backdrop-blur-md border border-primary/20 h-16 p-1.5 rounded-2xl shadow-lg">
                <TabsTrigger 
                  value="crypto-to-momo" 
                  className="flex items-center justify-center gap-3 text-base font-semibold h-full rounded-xl transition-all duration-500 ease-out
                    data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground data-[state=inactive]:hover:bg-muted/50
                    data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:via-violet-500 data-[state=active]:to-primary 
                    data-[state=active]:text-white data-[state=active]:shadow-xl data-[state=active]:shadow-primary/30 data-[state=active]:scale-[1.02]"
                >
                  <ArrowRightLeft className="h-5 w-5 transition-transform duration-300 group-hover:rotate-180" />
                  <span className="hidden sm:inline">Crypto → Mobile Money</span>
                  <span className="sm:hidden">Crypto → MoMo</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="momo-to-crypto" 
                  className="flex items-center justify-center gap-3 text-base font-semibold h-full rounded-xl transition-all duration-500 ease-out
                    data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground data-[state=inactive]:hover:bg-muted/50
                    data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:via-amber-500 data-[state=active]:to-orange-400 
                    data-[state=active]:text-white data-[state=active]:shadow-xl data-[state=active]:shadow-orange-500/30 data-[state=active]:scale-[1.02]"
                >
                  <ArrowDownUp className="h-5 w-5 transition-transform duration-300" />
                  <span className="hidden sm:inline">Mobile Money → Crypto</span>
                  <span className="sm:hidden">MoMo → Crypto</span>
                </TabsTrigger>
              </TabsList>
              
              <TabsContent 
                value="crypto-to-momo" 
                className="mt-0 data-[state=active]:animate-fade-in focus-visible:outline-none focus-visible:ring-0"
              >
                <OfframpForm />
              </TabsContent>
              
              <TabsContent 
                value="momo-to-crypto" 
                className="mt-0 data-[state=active]:animate-fade-in focus-visible:outline-none focus-visible:ring-0"
              >
                <OnrampForm />
              </TabsContent>
            </Tabs>
          </div>

          {/* Transaction History Section */}
          <div className="max-w-4xl mx-auto animate-fade-in opacity-0 [animation-delay:1.4s] [animation-fill-mode:forwards]">
            <TransactionHistory />
          </div>

          {/* Testimonials Section */}
          <div className="animate-fade-in opacity-0 [animation-delay:1.6s] [animation-fill-mode:forwards]">
            <TestimonialsSection />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
