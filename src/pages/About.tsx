import { Shield, Zap, Globe, Users, HeadphonesIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { useTranslation } from "react-i18next";

const About = () => {
  const { t } = useTranslation();

  const features = [
    { icon: Shield, titleKey: "noKyc", descKey: "noKycDesc" },
    { icon: Zap, titleKey: "speed", descKey: "speedDesc" },
    { icon: Shield, titleKey: "security", descKey: "securityDesc" },
    { icon: Globe, titleKey: "multiChain", descKey: "multiChainDesc" },
    { icon: Users, titleKey: "accessibility", descKey: "accessibilityDesc" },
    { icon: HeadphonesIcon, titleKey: "support", descKey: "supportDesc" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <section className="py-16 px-4">
        <div className="container max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-hero bg-clip-text text-transparent">
            {t('about.title')}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('about.subtitle')}
          </p>
        </div>
      </section>

      <section className="py-12 px-4 bg-muted/30">
        <div className="container max-w-4xl mx-auto">
          <Card className="border-primary/20">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold mb-4 text-foreground">{t('about.missionTitle')}</h3>
              <p className="text-muted-foreground leading-relaxed">{t('about.missionP1')}</p>
              <p className="text-muted-foreground leading-relaxed mt-4">{t('about.missionP2')}</p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="container max-w-5xl mx-auto">
          <h3 className="text-2xl font-bold mb-8 text-center text-foreground">{t('about.whyTitle')}</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="border-primary/10 hover:border-primary/30 transition-colors">
                <CardContent className="p-6">
                  <div className="h-12 w-12 bg-gradient-primary rounded-xl flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                  <h4 className="text-lg font-semibold mb-2 text-foreground">{t(`about.features.${feature.titleKey}`)}</h4>
                  <p className="text-sm text-muted-foreground">{t(`about.features.${feature.descKey}`)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 px-4 bg-muted/30">
        <div className="container max-w-4xl mx-auto">
          <h3 className="text-2xl font-bold mb-8 text-center text-foreground">{t('about.servicesTitle')}</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="border-primary/20">
              <CardContent className="p-6">
                <h4 className="text-xl font-semibold mb-3 text-foreground">{t('about.offrampTitle')}</h4>
                <p className="text-muted-foreground">{t('about.offrampDesc')}</p>
              </CardContent>
            </Card>
            <Card className="border-primary/20">
              <CardContent className="p-6">
                <h4 className="text-xl font-semibold mb-3 text-foreground">{t('about.onrampTitle')}</h4>
                <p className="text-muted-foreground">{t('about.onrampDesc')}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="container max-w-4xl mx-auto text-center">
          <h3 className="text-2xl font-bold mb-6 text-foreground">{t('about.countriesTitle')}</h3>
          <p className="text-muted-foreground mb-8">{t('about.countriesSubtitle')}</p>
          <div className="flex flex-wrap justify-center gap-4">
            {["🇸🇳 Sénégal", "🇲🇱 Mali", "🇧🇫 Burkina Faso", "🇨🇮 Côte d'Ivoire", "🇹🇬 Togo", "🇧🇯 Bénin"].map((country, index) => (
              <span key={index} className="px-4 py-2 bg-muted rounded-full text-sm font-medium">
                {country}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-4 bg-gradient-to-r from-primary/10 to-primary/5">
        <div className="container max-w-2xl mx-auto text-center">
          <h3 className="text-2xl font-bold mb-4 text-foreground">{t('about.ctaTitle')}</h3>
          <p className="text-muted-foreground mb-6">{t('about.ctaSubtitle')}</p>
          <Link to="/">
            <Button size="lg" className="bg-gradient-primary hover:opacity-90">
              {t('about.ctaButton')}
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default About;