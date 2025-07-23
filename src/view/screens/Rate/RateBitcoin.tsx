import WhatsAppButton from '@/view/components/buttonWhatsApp';
import { PageBackground } from '@/view/components/PageBackground';
import { useTranslation } from 'react-i18next';

export function Fees() {
  const { t } = useTranslation();

  return (
    <>
      <PageBackground />
      <div className="container mx-auto p-6 pt-[10%] sm:pt-16 pb-16">
        <h1 className="text-2xl font-bold pb-6 text-white">
          {t('fees.title')}
        </h1>

        <section className="pb-8">
          <h2 className="text-xl font-semibold mb-4 text-white">
            {t('fees.dailyLimit1')}
          </h2>

          <p className="text-white">{t('fees.above1000')}</p>
        </section>

        <section className="pb-8">
          <h2 className="text-xl font-semibold mb-4 text-white">
            {t('fees.dailyLimit2')}
          </h2>
          <p className="text-white">{t('fees.fixedRate')}</p>
        </section>

        <section className="pb-8">
          <h2 className="text-xl font-semibold mb-4 text-white">
            {t('fees.paymentLimitsTitle')}
          </h2>
          <p className="text-white">{t('fees.paymentLimits1')}</p>
          <p className="text-white pt-4">{t('fees.paymentLimits2')}</p>
          <p className="text-white pt-4">{t('fees.paymentLimits3')}</p>
          <p className="text-white pt-4">{t('fees.paymentLimits4')}</p>
        </section>

        <section className="pb-8">
          <h2 className="text-xl font-semibold mb-4 text-white">
            {t('fees.couponsTitle')}
          </h2>
          <p className="text-white">{t('fees.coupons')}</p>
        </section>

        <section className="pb-8">
          <h2 className="text-xl font-semibold mb-4 text-white">
            {t('fees.convertibilityRatesTile')}
          </h2>
          <p className="text-white">{t('fees.convertibilityRates')}</p>
        </section>

        <section className="pb-8">
          <h2 className="text-xl font-semibold mb-4 text-white">
            {t('fees.userLevelsTitle')}
          </h2>

          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2 text-white">
              {t('fees.level0.title')}
            </h3>
            <p className="text-white">{t('fees.level0.howToEnter')}</p>
            <p className="text-white">{t('fees.level0.transactionLimit')}</p>
            <p className="text-white">{t('fees.level0.valuePerTransaction')}</p>
            <p className="text-white">{t('fees.level0.benefits')}</p>
            <p className="text-white">{t('fees.level0.levelUp')}</p>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2 text-white">
              {t('fees.level1.title')}
            </h3>
            <p className="text-white">{t('fees.level1.howToEnter')}</p>
            <p className="text-white">{t('fees.level1.transactionLimit')}</p>
            <p className="text-white">{t('fees.level1.levelUp')}</p>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2 text-white">
              {t('fees.level2.title')}
            </h3>
            <p className="text-white">{t('fees.level2.howToEnter')}</p>
            <p className="text-white">{t('fees.level2.transactionLimit')}</p>
            <p className="text-white">{t('fees.level2.benefits')}</p>
            <p className="text-white">{t('fees.level2.levelUp')}</p>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2 text-white">
              {t('fees.level3.title')}
            </h3>
            <p className="text-white">{t('fees.level3.howToEnter')}</p>
            <p className="text-white">{t('fees.level3.transactionLimit')}</p>
            <p className="text-white">{t('fees.level3.benefits')}</p>
            <p className="text-white">{t('fees.level3.levelUp')}</p>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2 text-white">
              {t('fees.level4.title')}
            </h3>
            <p className="text-white">{t('fees.level4.howToEnter')}</p>
            <p className="text-white">{t('fees.level4.transactionLimit')}</p>
            <p className="text-white">{t('fees.level4.levelUp')}</p>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2 text-white">
              {t('fees.level5.title')}
            </h3>
            <p className="text-white">{t('fees.level5.howToEnter')}</p>
            <p className="text-white">{t('fees.level5.transactionLimit')}</p>
            <p className="text-white">{t('fees.level5.levelUp')}</p>
          </div>
        </section>

        <section className="pb-8">
          <h2 className="text-xl font-semibold mb-4 text-white">
            {t('fees.reflectionTitle')}
          </h2>
          <p className="text-white">{t('fees.reflection1')}</p>
          <p className="text-white pt-4">{t('fees.reflection2')}</p>
          <p className="text-white pt-4">{t('fees.reflection3')}</p>
          <p className="text-white pt-4">{t('fees.reflection4')}</p>
        </section>

        <section className="pb-8">
          <h2 className="text-xl font-semibold mb-4 text-white">
            {t('fees.privacyTitle')}
          </h2>
          <p className="text-white">{t('fees.privacy1')}</p>
          <p className="text-white pt-4">{t('fees.privacy2')}</p>
        </section>
      </div>
      <WhatsAppButton />
    </>
  );
}
