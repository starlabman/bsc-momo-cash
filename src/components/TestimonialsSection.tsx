import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Star, Quote } from 'lucide-react';

interface Testimonial {
  name: string;
  country: string;
  avatar: string;
  rating: number;
  text: string;
}

const testimonials: Testimonial[] = [
  {
    name: "Amadou Diallo",
    country: "🇸🇳 Sénégal",
    avatar: "AD",
    rating: 5,
    text: "Service rapide et fiable ! J'ai reçu mon argent sur Orange Money en moins de 10 minutes. Je recommande vivement."
  },
  {
    name: "Fatou Koné",
    country: "🇨🇮 Côte d'Ivoire",
    avatar: "FK",
    rating: 5,
    text: "Excellente plateforme pour convertir mes USDT en XOF. Les taux sont compétitifs et le support est très réactif."
  },
  {
    name: "Ousmane Traoré",
    country: "🇲🇱 Mali",
    avatar: "OT",
    rating: 5,
    text: "Enfin une solution simple pour envoyer de l'argent à ma famille ! Pas de KYC compliqué, juste efficace."
  },
  {
    name: "Aïcha Bamba",
    country: "🇧🇫 Burkina Faso",
    avatar: "AB",
    rating: 5,
    text: "J'utilise CryptoMoMo depuis 3 mois. Transactions toujours réussies, jamais eu de problème. Top !"
  }
];

const TestimonialsSection = () => {
  return (
    <section className="py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ce que nos clients disent
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Plus de 10 000 utilisateurs nous font confiance pour leurs conversions crypto
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {testimonials.map((testimonial, index) => (
            <Card 
              key={index} 
              className="glass-card border-primary/10 hover:border-primary/30 transition-all duration-300 hover:-translate-y-1"
            >
              <CardContent className="pt-6">
                <Quote className="h-8 w-8 text-primary/30 mb-4" />
                
                <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                  "{testimonial.text}"
                </p>

                <div className="flex items-center gap-3 pt-4 border-t border-border/50">
                  <div className="h-10 w-10 rounded-full bg-gradient-primary flex items-center justify-center text-white font-semibold text-sm">
                    {testimonial.avatar}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{testimonial.name}</p>
                    <p className="text-xs text-muted-foreground">{testimonial.country}</p>
                  </div>
                </div>

                <div className="flex gap-0.5 mt-3">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
