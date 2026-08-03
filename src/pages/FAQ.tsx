import { Link } from "react-router-dom";
import { Calculator, Clock, ShieldCheck, CheckCircle2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import ScrollReveal from "@/components/ScrollReveal";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Footer from "@/components/Footer";
import Seo from "@/components/Seo";
import Header from "@/components/Header";
import { useTranslation } from "react-i18next";

const FAQ = () => {
  const { t } = useTranslation();
  const faqItems = t('faq.items', { returnObjects: true }) as Array<{ q: string; a: string }>;
  const topItems = t('faq.top.items', { returnObjects: true }) as Array<{ q: string; a: string }>;
  const rateExamples = t('faq.rate.examples', { returnObjects: true }) as Array<{ amount: string; calc: string; result: string }>;
  const rateNotes = t('faq.rate.notes', { returnObjects: true }) as string[];
  const payoutRows = t('faq.payout.rows', { returnObjects: true }) as Array<{ label: string; value: string }>;
  const payoutFactors = t('faq.payout.factors', { returnObjects: true }) as string[];
  const safetyChecklist = t('faq.safety.checklist', { returnObjects: true }) as string[];
  const safetyKnow = t('faq.safety.know', { returnObjects: true }) as string[];


  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: (faqItems || []).map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: { "@type": "Answer", text: faq.a },
    })),
  };

  return (
    <div className="min-h-screen bg-background">
      <Seo
        title="FAQ SikaPay — Questions fréquentes"
        description="Réponses aux questions fréquentes sur SikaPay : délais, frais, réseaux blockchain supportés, opérateurs Mobile Money et sécurité des transactions."
        path="/faq"
        jsonLd={faqJsonLd}
      />
      <Header />

      <section className="py-16 px-4">
        <div className="container max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-hero bg-clip-text text-transparent">
            {t('faq.title')}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('faq.subtitle')}
          </p>
        </div>
      </section>

      <section className="pb-4 px-4">
        <div className="container max-w-3xl mx-auto">
          <h3 className="text-2xl font-bold mb-2 text-foreground">{t('faq.top.title')}</h3>
          <p className="text-muted-foreground mb-6">{t('faq.top.subtitle')}</p>
          <div className="space-y-5">
            {topItems.map((item, index) => (
              <ScrollReveal key={item.q} delay={index * 60}>
                <article className="rounded-xl border border-border/60 bg-card/50 p-6">
                  <h4 className="font-semibold text-foreground mb-2">
                    <span className="text-primary mr-2">{index + 1}.</span>
                    {item.q}
                  </h4>
                  <p className="text-muted-foreground leading-relaxed">{item.a}</p>
                </article>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 px-4">

        <div className="container max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="w-full space-y-4">
            {faqItems.map((faq, index) => (
              <ScrollReveal key={index} delay={index * 60}>
                <AccordionItem 
                  value={`item-${index}`}
                  className="border border-border/50 rounded-lg px-6 bg-card/50"
                >
                  <AccordionTrigger className="text-left font-medium hover:no-underline">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              </ScrollReveal>
            ))}
          </Accordion>
        </div>
      </section>

      <section className="py-16 px-4 bg-gradient-to-r from-primary/10 to-primary/5">
        <div className="container max-w-2xl mx-auto text-center">
          <h3 className="text-2xl font-bold mb-4 text-foreground">{t('faq.moreQTitle')}</h3>
          <p className="text-muted-foreground mb-6">{t('faq.moreQSubtitle')}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/">
              <Button size="lg" className="bg-gradient-primary hover:opacity-90">
                {t('faq.startTransaction')}
              </Button>
            </Link>
            <Link to="/about">
              <Button size="lg" variant="outline">
                {t('faq.learnMore')}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default FAQ;