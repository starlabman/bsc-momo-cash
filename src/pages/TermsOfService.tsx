import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useTranslation } from "react-i18next";

const TermsOfService = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container max-w-3xl mx-auto px-4 py-12 sm:py-16">
        <h1 className="text-3xl sm:text-4xl font-bold mb-8 text-foreground">{t("terms.title")}</h1>
        <div className="prose prose-sm dark:prose-invert max-w-none space-y-6 text-muted-foreground">
          <p className="text-sm">{t("terms.lastUpdated")}</p>

          <section>
            <h2 className="text-xl font-semibold text-foreground">{t("terms.acceptTitle")}</h2>
            <p>{t("terms.acceptDesc")}</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">{t("terms.serviceTitle")}</h2>
            <p>{t("terms.serviceDesc")}</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">{t("terms.eligibilityTitle")}</h2>
            <p>{t("terms.eligibilityDesc")}</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">{t("terms.transactionsTitle")}</h2>
            <p>{t("terms.transactionsDesc")}</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">{t("terms.feesTitle")}</h2>
            <p>{t("terms.feesDesc")}</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">{t("terms.liabilityTitle")}</h2>
            <p>{t("terms.liabilityDesc")}</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">{t("terms.terminationTitle")}</h2>
            <p>{t("terms.terminationDesc")}</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">{t("terms.contactTitle")}</h2>
            <p>{t("terms.contactDesc")}</p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default TermsOfService;
