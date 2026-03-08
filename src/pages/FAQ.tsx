import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import ScrollReveal from "@/components/ScrollReveal";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Footer from "@/components/Footer";
import Header from "@/components/Header";

const FAQ = () => {
  const faqs = [
    {
      question: "Qu'est-ce que SikaPay ?",
      answer: "SikaPay est une plateforme de conversion entre cryptomonnaies et Mobile Money. Elle permet aux utilisateurs d'Afrique de l'Ouest de convertir leurs crypto (USDT, USDC, etc.) en francs CFA (XOF) directement sur leur Mobile Money, et inversement."
    },
    {
      question: "Comment fonctionne l'Off-Ramp (Crypto → Mobile Money) ?",
      answer: "Pour convertir vos cryptos en XOF : 1) Sélectionnez le token et le réseau blockchain, 2) Entrez le montant à convertir, 3) Renseignez votre numéro Mobile Money, 4) Envoyez vos cryptos à l'adresse fournie, 5) Recevez vos XOF sur votre Mobile Money en quelques minutes."
    },
    {
      question: "Comment fonctionne l'On-Ramp (Mobile Money → Crypto) ?",
      answer: "Pour acheter des cryptos avec votre Mobile Money : 1) Sélectionnez le token et le réseau souhaités, 2) Entrez le montant en XOF à convertir, 3) Renseignez votre adresse de portefeuille blockchain, 4) Effectuez le paiement Mobile Money, 5) Recevez vos cryptos dans votre portefeuille."
    },
    {
      question: "Dois-je créer un compte ou faire une vérification KYC ?",
      answer: "Non, SikaPay fonctionne sans inscription ni vérification d'identité (KYC). Vous pouvez effectuer vos transactions de manière anonyme et rapide, en préservant votre confidentialité."
    },
    {
      question: "Quels tokens et réseaux sont supportés ?",
      answer: "SikaPay supporte les stablecoins USDT et USDC sur 9 réseaux blockchain : Base, BSC (BNB Smart Chain), Ethereum, Arbitrum, Optimism, Polygon, Solana, Avalanche et Lisk. D'autres tokens et réseaux peuvent être ajoutés à l'avenir."
    },
    {
      question: "Quels opérateurs Mobile Money sont acceptés ?",
      answer: "Nous supportons les principaux opérateurs Mobile Money d'Afrique de l'Ouest : Orange Money, MTN Mobile Money, Wave, Moov Money, et Free Money. La disponibilité peut varier selon votre pays."
    },
    {
      question: "Dans quels pays SikaPay est-il disponible ?",
      answer: "SikaPay est disponible dans les pays de la zone UEMOA utilisant le franc CFA (XOF) : Sénégal, Mali, Burkina Faso, Côte d'Ivoire, Togo, et Bénin."
    },
    {
      question: "Quels sont les frais de transaction ?",
      answer: "Les frais sont inclus dans le taux de change affiché. Vous voyez exactement combien vous recevrez avant de confirmer votre transaction. Aucun frais caché n'est appliqué."
    },
    {
      question: "Combien de temps prend une transaction ?",
      answer: "La plupart des transactions sont traitées en quelques minutes. Le délai exact dépend du réseau blockchain utilisé et de la confirmation du paiement Mobile Money. En général, comptez entre 5 et 30 minutes."
    },
    {
      question: "Quel est le montant minimum/maximum par transaction ?",
      answer: "Le montant minimum est généralement de 5 USD (environ 3 000 XOF). Le montant maximum peut varier selon les limites de votre opérateur Mobile Money et les politiques de SikaPay. Contactez notre support pour des montants importants."
    },
    {
      question: "Que faire si ma transaction est en attente ?",
      answer: "Si votre transaction reste en attente plus de 30 minutes, vérifiez d'abord que vous avez bien envoyé les fonds à la bonne adresse avec le bon réseau. Ensuite, contactez notre support avec votre numéro de transaction pour assistance."
    },
    {
      question: "Comment contacter le support ?",
      answer: "Notre équipe de support est disponible 24h/24 et 7j/7. Vous pouvez nous contacter via WhatsApp, Telegram, ou par email. Les coordonnées de contact sont disponibles sur notre site."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="py-16 px-4">
        <div className="container max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-hero bg-clip-text text-transparent">
            Questions Fréquentes
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Trouvez les réponses à vos questions sur SikaPay et nos services de conversion crypto/Mobile Money.
          </p>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-12 px-4">
        <div className="container max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="w-full space-y-4">
            {faqs.map((faq, index) => (
              <ScrollReveal key={index} delay={index * 60}>
                <AccordionItem 
                  value={`item-${index}`}
                  className="border border-border/50 rounded-lg px-6 bg-card/50"
                >
                  <AccordionTrigger className="text-left font-medium hover:no-underline">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              </ScrollReveal>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-gradient-to-r from-primary/10 to-primary/5">
        <div className="container max-w-2xl mx-auto text-center">
          <h3 className="text-2xl font-bold mb-4 text-foreground">Vous avez d'autres questions ?</h3>
          <p className="text-muted-foreground mb-6">
            Notre équipe est disponible 24/7 pour vous aider.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/">
              <Button size="lg" className="bg-gradient-primary hover:opacity-90">
                Commencer une transaction
              </Button>
            </Link>
            <Link to="/about">
              <Button size="lg" variant="outline">
                En savoir plus
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
