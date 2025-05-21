import WhatsAppButton from '@/view/components/buttonWhatsApp';
import { PageBackground } from '@/view/components/PageBackground';
import { useTranslation } from 'react-i18next';

export function TermsOfUse() {
  const { t } = useTranslation();

  return (
    <>
      <PageBackground />
      <div className="container mx-auto p-6 pt-[10%] sm:pt-16 pb-20">
        <h1 className="text-2xl font-bold pb-6 text-white">
          {t('termsOfUse.title')}
        </h1>

        <section className="pb-8">
          <h2 className="text-xl font-semibold pb-4 text-white">
            1. {t('termsOfUse.platformTitle')}
          </h2>
          {t('termsOfUse.platformDescription')
            .split('\n\n')
            .map((paragraph, index, array) => (
              <p key={index} className="text-white">
                {paragraph}
                {index < array.length - 1 && (
                  <>
                    <br />
                    <br />
                  </>
                )}
              </p>
            ))}
        </section>

        <section className="pb-8">
          <h2 className="text-xl font-semibold pb-4 text-white">
            2. {t('termsOfUse.transactionsTitle')}
          </h2>
          <ol className="list-decimal pl-5 text-white">
            {(
              t('termsOfUse.transactionsSteps', {
                returnObjects: true,
              }) as string[]
            ).map((step, index) => (
              <li key={index}>{step}</li>
            ))}
          </ol>
        </section>

        <section className="pb-8">
          <h2 className="text-xl font-semibold pb-4 text-white">
            3. {t('termsOfUse.transactionLimitsTitle')}
          </h2>
          <p className="text-white">
            {t('termsOfUse.transactionLimitsDescription')}
          </p>
        </section>

        <section className="pb-8">
          <h2 className="text-xl font-semibold pb-4 text-white">
            4. {t('termsOfUse.transactionDurationTitle')}
          </h2>
          <p className="text-white">
            {t('termsOfUse.transactionDurationDescription')}
          </p>
        </section>

        <section className="pb-8">
          <h2 className="text-xl font-semibold pb-4 text-white">
            5. {t('termsOfUse.kycPoliciesTitle')}
          </h2>
          <p className="text-white">
            {t('termsOfUse.kycPoliciesDescription')
              .split('\n\n')
              .map((paragraph, index, array) => (
                <p key={index} className="text-white">
                  {paragraph}
                  {index < array.length - 1 && (
                    <>
                      <br />
                      <br />
                    </>
                  )}
                </p>
              ))}
          </p>
        </section>

        <section className="pb-8">
          <h2 className="text-xl font-semibold pb-4 text-white">
            5. {t('termsOfUse.globalReachTitle')}
          </h2>
          <p className="text-white">
            {t('termsOfUse.globalReachDescription1')}
          </p>
          <p className="text-white pt-4">
            {t('termsOfUse.globalReachDescription2')}
          </p>
          <p className="text-white pt-4">
            {t('termsOfUse.globalReachDescription3')}
          </p>
        </section>

        <section className="pb-8">
          <h2 className="text-xl font-semibold pb-4 text-white">
            6. {t('termsOfUse.disputesTitle')}
          </h2>
          <ul className="list-disc pl-5 text-white">
            <li>{t('termsOfUse.disputesStep1')}</li>
            <li>{t('termsOfUse.disputesStep2')}</li>
            <li>{t('termsOfUse.disputesStep3')}</li>
            <li>{t('termsOfUse.disputesStep4')}</li>
          </ul>
        </section>

        <section className="pb-8">
          <h2 className="text-xl font-semibold pb-4 text-white">
            7. {t('termsOfUse.conductTitle')}
          </h2>
          <p className="text-white">{t('termsOfUse.conductDescription1')}</p>
          <ul className="list-disc pl-5 pt-4 text-white">
            <li>{t('termsOfUse.conductPenalty1')}</li>
            <li>{t('termsOfUse.conductPenalty2')}</li>
            <li>{t('termsOfUse.conductPenalty3')}</li>
            <li>{t('termsOfUse.conductPenalty4')}</li>
          </ul>
          <p className="text-white pt-4">
            {t('termsOfUse.conductDescription2')}
          </p>
        </section>

        <footer className="pt-8">
          <p className="text-white">{t('termsOfUse.footer')}</p>
        </footer>
      </div>
      <WhatsAppButton />
    </>
  );
}
