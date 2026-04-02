import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useTranslation } from "react-i18next";

const PrivacyPolicy = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container max-w-3xl mx-auto px-4 py-12 sm:py-16">
        <h1 className="text-3xl sm:text-4xl font-bold mb-8 text-foreground">{t("privacy.title")}</h1>
        <div className="prose prose-sm dark:prose-invert max-w-none space-y-6 text-muted-foreground">
          <p className="text-sm">{t("privacy.lastUpdated")}</p>

          <section>
            <h2 className="text-xl font-semibold text-foreground">{t("privacy.collectTitle")}</h2>
            <p>{t("privacy.collectDesc")}</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>{t("privacy.collectItem1")}</li>
              <li>{t("privacy.collectItem2")}</li>
              <li>{t("privacy.collectItem3")}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">{t("privacy.useTitle")}</h2>
            <p>{t("privacy.useDesc")}</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">{t("privacy.shareTitle")}</h2>
            <p>{t("privacy.shareDesc")}</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">{t("privacy.securityTitle")}</h2>
            <p>{t("privacy.securityDesc")}</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">{t("privacy.contactTitle")}</h2>
            <p>{t("privacy.contactDesc")}</p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PrivacyPolicy;
