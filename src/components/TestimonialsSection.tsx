import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Star, Quote } from 'lucide-react';
import ScrollReveal from '@/components/ScrollReveal';
import { useTranslation } from 'react-i18next';

const avatars = ["AD", "FK", "OT", "AB"];

const TestimonialsSection = () => {
  const { t } = useTranslation();
  const items = t('testimonials.items', { returnObjects: true }) as Array<{ name: string; country: string; text: string }>;

  return (
    <section className="py-10 sm:py-16 px-3 sm:px-4">
      <div className="max-w-6xl mx-auto">
        <ScrollReveal>
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">
              {t('testimonials.title')}
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              {t('testimonials.subtitle')}
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {Array.isArray(items) && items.map((testimonial, index) => (
            <ScrollReveal key={index} delay={index * 100}>
              <Card 
                className="glass-card border-primary/10 hover:border-primary/30 transition-all duration-300 hover:-translate-y-1 h-full"
              >
                <CardContent className="pt-6">
                  <Quote className="h-8 w-8 text-primary/30 mb-4" />
                  
                  <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                    "{testimonial.text}"
                  </p>

                  <div className="flex items-center gap-3 pt-4 border-t border-border/50">
                    <div className="h-10 w-10 rounded-full bg-gradient-primary flex items-center justify-center text-white font-semibold text-sm">
                      {avatars[index] || testimonial.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{testimonial.name}</p>
                      <p className="text-xs text-muted-foreground">{testimonial.country}</p>
                    </div>
                  </div>

                  <div className="flex gap-0.5 mt-3">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                    ))}
                  </div>
                </CardContent>
              </Card>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
