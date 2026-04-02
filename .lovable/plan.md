
## Plan d'action priorisé

### ✅ Déjà fait
- **i18n** : Déjà implémenté (FR/EN complet)

### 🔧 À implémenter

**1. Favicon + SEO + OG Tags** (page title, meta description, Open Graph)
- Mettre à jour `index.html` avec title, meta description, OG tags
- Le favicon existe déjà (sikapay-favicon.png) — vérifier qu'il est bien référencé

**2. Accessibilité**
- Vérifier le contraste des couleurs
- Ajouter les attributs `alt`, `aria-label`, `role` manquants
- Vérifier la navigation clavier (focus states, tab order)

**3. Pages légales + Cookie Banner**
- Créer page Politique de Confidentialité
- Créer page CGU (Conditions Générales)
- Ajouter un bandeau de consentement cookies

**4. Sécurité**
- Lancer un scan de sécurité Supabase
- Vérifier XSS, secrets exposés, RLS

**5. Performance**
- Lazy loading des routes (React.lazy)
- Lazy loading des images
- Optimiser les imports

**6. PWA**
- ⚠️ Attention : PWA avec service workers cause des problèmes dans l'éditeur Lovable
- Option simple : manifest.json pour installabilité sans offline support
- Option complète : vite-plugin-pwa (fonctionnera uniquement en production)

**7. Cache / Core Web Vitals**
- Cache headers : limité dans une SPA Lovable (géré par l'hébergeur)
- Core Web Vitals : profiling navigateur

### ❌ Non applicable
- Cache serveur pour API routes (pas de serveur backend custom)
- Compression d'images côté serveur (géré par l'hébergeur)
