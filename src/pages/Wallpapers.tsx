import { useLanguage } from '@/contexts/LanguageContext';

const Wallpapers = () => {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-background pt-20 px-4">
      <div className="container mx-auto max-w-6xl">
        <h1 className="text-4xl font-bold text-foreground text-center mb-8">
          {t('wallpapers')}
        </h1>
        <p className="text-muted-foreground text-center text-lg">
          Coming soon...
        </p>
      </div>
    </div>
  );
};

export default Wallpapers;
