import { ArrowRightLeft, Shield, Zap, Globe, Users, HeadphonesIcon, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const About = () => {
  const features = [
    {
      icon: Shield,
      title: "Sans KYC",
      description: "Aucune vérification d'identité requise. Conversion rapide et anonyme pour votre confidentialité."
    },
    {
      icon: Zap,
      title: "Rapidité",
      description: "Transactions traitées en quelques minutes. Recevez votre argent sur Mobile Money sans délai."
    },
    {
      icon: Globe,
      title: "Multi-Blockchain",
      description: "Support de plusieurs réseaux : BSC, Ethereum, Tron, Solana et plus encore."
    },
    {
      icon: Users,
      title: "Accessibilité",
      description: "Interface simple et intuitive, conçue pour tous les utilisateurs, débutants comme experts."
    },
    {
      icon: HeadphonesIcon,
      title: "Support 24/7",
      description: "Notre équipe est disponible à tout moment pour vous accompagner dans vos transactions."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-3">
            <div className="h-10 w-10 bg-gradient-primary rounded-xl flex items-center justify-center shadow-lg">
              <ArrowRightLeft className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-hero bg-clip-text text-transparent">SikaPay</h1>
              <p className="text-xs text-muted-foreground font-medium">Crypto ↔ Mobile Money</p>
            </div>
          </Link>
          <Link to="/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 px-4">
        <div className="container max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-hero bg-clip-text text-transparent">
            À propos de SikaPay
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            SikaPay est votre passerelle de confiance entre le monde des cryptomonnaies et le Mobile Money en Afrique de l'Ouest.
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-12 px-4 bg-muted/30">
        <div className="container max-w-4xl mx-auto">
          <Card className="border-primary/20">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold mb-4 text-foreground">Notre Mission</h3>
              <p className="text-muted-foreground leading-relaxed">
                Chez SikaPay, nous croyons que tout le monde devrait avoir accès aux avantages de la finance décentralisée. 
                Notre mission est de simplifier la conversion entre cryptomonnaies et Mobile Money, en offrant une solution 
                rapide, sécurisée et accessible à tous les utilisateurs en Afrique de l'Ouest.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-4">
                Que vous souhaitiez convertir vos USDT, USDC ou autres stablecoins en francs CFA (XOF), 
                ou acheter des cryptomonnaies avec votre Mobile Money, SikaPay vous accompagne à chaque étape.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4">
        <div className="container max-w-5xl mx-auto">
          <h3 className="text-2xl font-bold mb-8 text-center text-foreground">Pourquoi choisir SikaPay ?</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="border-primary/10 hover:border-primary/30 transition-colors">
                <CardContent className="p-6">
                  <div className="h-12 w-12 bg-gradient-primary rounded-xl flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                  <h4 className="text-lg font-semibold mb-2 text-foreground">{feature.title}</h4>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-12 px-4 bg-muted/30">
        <div className="container max-w-4xl mx-auto">
          <h3 className="text-2xl font-bold mb-8 text-center text-foreground">Nos Services</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="border-primary/20">
              <CardContent className="p-6">
                <h4 className="text-xl font-semibold mb-3 text-foreground">Off-Ramp (Crypto → Mobile Money)</h4>
                <p className="text-muted-foreground">
                  Convertissez vos cryptomonnaies en XOF et recevez l'argent directement sur votre compte 
                  Mobile Money (Orange Money, MTN Mobile Money, Wave, etc.).
                </p>
              </CardContent>
            </Card>
            <Card className="border-primary/20">
              <CardContent className="p-6">
                <h4 className="text-xl font-semibold mb-3 text-foreground">On-Ramp (Mobile Money → Crypto)</h4>
                <p className="text-muted-foreground">
                  Achetez des cryptomonnaies avec votre Mobile Money. Payez en XOF et recevez des tokens 
                  directement dans votre portefeuille blockchain.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Countries Section */}
      <section className="py-16 px-4">
        <div className="container max-w-4xl mx-auto text-center">
          <h3 className="text-2xl font-bold mb-6 text-foreground">Pays Supportés</h3>
          <p className="text-muted-foreground mb-8">
            SikaPay est disponible dans plusieurs pays d'Afrique de l'Ouest utilisant le franc CFA (XOF).
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            {["🇸🇳 Sénégal", "🇲🇱 Mali", "🇧🇫 Burkina Faso", "🇨🇮 Côte d'Ivoire", "🇹🇬 Togo", "🇧🇯 Bénin"].map((country, index) => (
              <span key={index} className="px-4 py-2 bg-muted rounded-full text-sm font-medium">
                {country}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-gradient-to-r from-primary/10 to-primary/5">
        <div className="container max-w-2xl mx-auto text-center">
          <h3 className="text-2xl font-bold mb-4 text-foreground">Prêt à commencer ?</h3>
          <p className="text-muted-foreground mb-6">
            Effectuez votre première transaction en quelques minutes.
          </p>
          <Link to="/">
            <Button size="lg" className="bg-gradient-primary hover:opacity-90">
              Commencer maintenant
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-border/40">
        <div className="container max-w-4xl mx-auto text-center">
          <p className="text-sm text-muted-foreground">
            © 2024 SikaPay. Tous droits réservés.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default About;
