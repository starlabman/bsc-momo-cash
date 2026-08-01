import { Link } from "react-router-dom";
import { ArrowRight, Wallet, Smartphone, ShieldCheck, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Seo from "@/components/Seo";

const steps = [
  {
    icon: Wallet,
    title: "1. Choisissez le réseau et le montant en USDT",
    body:
      "Sur la page d'accueil de SikaPay, ouvrez l'onglet « Crypto → Mobile Money », sélectionnez le réseau sur lequel vous détenez vos USDT (BSC, Ethereum, Base, Solana, Polygon, Arbitrum, Optimism, Avalanche ou Lisk), puis saisissez le montant à convertir. Le taux XOF s'affiche en direct.",
  },
  {
    icon: Smartphone,
    title: "2. Indiquez votre numéro Orange Money",
    body:
      "Choisissez votre pays (Côte d'Ivoire, Sénégal, Mali, Burkina Faso, Togo ou Bénin), sélectionnez Orange Money comme opérateur et entrez le numéro qui recevra les francs CFA. Le format du numéro est vérifié automatiquement selon le pays et l'opérateur.",
  },
  {
    icon: ArrowRight,
    title: "3. Envoyez vos USDT à l'adresse de dépôt",
    body:
      "SikaPay affiche une adresse de dépôt et un QR code correspondant au réseau choisi. Envoyez exactement le montant indiqué depuis votre portefeuille, sur le même réseau — un envoi sur un autre réseau serait irrécupérable.",
  },
  {
    icon: Clock,
    title: "4. Recevez vos XOF sur Orange Money",
    body:
      "Dès confirmation du dépôt sur la blockchain, le paiement Orange Money est déclenché. Le statut de votre transaction se met à jour en temps réel dans l'historique, et vous pouvez télécharger une facture PDF à tout moment.",
  },
];

const faqs = [
  {
    q: "Combien de temps prend une conversion USDT vers Orange Money ?",
    a: "La conversion dépend des confirmations du réseau blockchain choisi. Sur BSC, Base ou Solana, les confirmations prennent généralement moins d'une minute, puis le paiement Orange Money est déclenché immédiatement.",
  },
  {
    q: "Faut-il un KYC pour convertir des USDT en Orange Money ?",
    a: "Non. SikaPay fonctionne sans KYC : vous n'avez besoin que d'une adresse crypto et d'un numéro Orange Money valide dans un pays de la zone XOF.",
  },
  {
    q: "Quel est le taux appliqué entre USDT et le franc CFA ?",
    a: "Le taux USDT/XOF est récupéré en direct depuis des sources de change publiques, avec une marge de service affichée avant confirmation. Le montant final en XOF est visible avant l'envoi de vos fonds.",
  },
  {
    q: "Puis-je aussi acheter des USDT avec Orange Money ?",
    a: "Oui. L'onglet « Mobile Money → Crypto » permet d'acheter des USDT ou USDC en payant avec Orange Money, MTN, Moov ou Wave, puis de recevoir les tokens à l'adresse de votre choix.",
  },
];

const UsdtToOrangeMoney = () => {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "HowTo",
        name: "Convertir des USDT en Orange Money (XOF) avec SikaPay",
        description:
          "Guide étape par étape pour convertir des USDT en francs CFA sur Orange Money en Côte d'Ivoire, au Sénégal, au Mali et au Burkina Faso, sans KYC.",
        step: steps.map((s, i) => ({
          "@type": "HowToStep",
          position: i + 1,
          name: s.title,
          text: s.body,
        })),
      },
      {
        "@type": "FAQPage",
        mainEntity: faqs.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
    ],
  };

  return (
    <div className="min-h-screen bg-background">
      <Seo
        title="Convertir USDT en Orange Money (XOF) — Guide SikaPay"
        description="Guide complet pour convertir vos USDT en Orange Money XOF sans KYC : réseaux supportés, étapes, délais et taux en Côte d'Ivoire, Sénégal, Mali et Burkina Faso."
        path="/guides/usdt-to-orange-money"
        jsonLd={jsonLd}
      />
      <Header />

      <main id="main-content">
        <section className="py-14 px-4">
          <div className="container max-w-3xl mx-auto">
            <p className="text-sm font-medium text-primary mb-3">Guide</p>
            <h2 className="text-3xl md:text-4xl font-bold mb-5 bg-gradient-hero bg-clip-text text-transparent">
              Convertir des USDT en Orange Money (XOF), étape par étape
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Vous détenez des USDT et souhaitez recevoir des francs CFA directement sur
              votre compte Orange Money en Côte d'Ivoire, au Sénégal, au Mali ou au
              Burkina Faso ? Ce guide détaille tout le parcours SikaPay : choix du
              réseau, vérification du numéro Mobile Money, dépôt crypto et réception des
              XOF — sans KYC.
            </p>
          </div>
        </section>

        <section className="pb-4 px-4">
          <div className="container max-w-3xl mx-auto space-y-6">
            {steps.map((step) => (
              <article
                key={step.title}
                className="rounded-xl border border-border/60 bg-card/50 p-6"
              >
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 shrink-0 rounded-lg bg-gradient-primary flex items-center justify-center">
                    <step.icon className="h-5 w-5 text-primary-foreground" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2 text-foreground">{step.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{step.body}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="py-12 px-4">
          <div className="container max-w-3xl mx-auto">
            <h3 className="text-2xl font-bold mb-6 text-foreground">
              Acheter de la crypto avec Mobile Money au Sénégal et ailleurs
            </h3>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Le parcours inverse fonctionne de la même façon : SikaPay accepte Orange
              Money, MTN Mobile Money, Moov Money et Wave pour acheter des USDT ou USDC
              sur neuf blockchains. Les montants vont de 100 à 600 000 XOF par
              transaction, et chaque opération reçoit une référence unique
              (ONR-XXXXXX pour un achat, OFF-XXXXXX pour une vente) que vous pouvez
              suivre dans l'historique.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Vérifiez toujours que le réseau sélectionné correspond à celui de votre
              portefeuille : les envois inter-réseaux ne sont pas récupérables.
            </p>
          </div>
        </section>

        <section className="pb-12 px-4">
          <div className="container max-w-3xl mx-auto">
            <h3 className="text-2xl font-bold mb-6 text-foreground">Questions fréquentes</h3>
            <dl className="space-y-6">
              {faqs.map((f) => (
                <div key={f.q}>
                  <dt className="font-semibold text-foreground mb-1">{f.q}</dt>
                  <dd className="text-muted-foreground leading-relaxed">{f.a}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className="py-14 px-4 bg-gradient-to-r from-primary/10 to-primary/5">
          <div className="container max-w-2xl mx-auto text-center">
            <h3 className="text-2xl font-bold mb-4 text-foreground">
              Prêt à convertir vos USDT en Orange Money ?
            </h3>
            <p className="text-muted-foreground mb-6">
              Lancez une conversion en moins de deux minutes, sans compte ni KYC.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/">
                <Button size="lg" className="bg-gradient-primary hover:opacity-90">
                  Démarrer une conversion USDT → Orange Money
                </Button>
              </Link>
              <Link to="/faq">
                <Button size="lg" variant="outline">
                  <ShieldCheck className="mr-2 h-4 w-4" aria-hidden="true" />
                  Consulter la FAQ complète
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default UsdtToOrangeMoney;
