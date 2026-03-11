import { useTranslation } from 'react-i18next';

const LANGUAGES = [
  { code: 'en', label: 'EN', flag: '🇬🇧' },
  { code: 'th', label: 'TH', flag: '🇹🇭' },
  { code: 'zh', label: 'ZH', flag: '🇨🇳' },
  { code: 'ja', label: 'JA', flag: '🇯🇵' },
  { code: 'ko', label: 'KO', flag: '🇰🇷' },
  { code: 'ar', label: 'AR', flag: '🇸🇦' },
];

export function LanguageSelector({ available }: { available?: string[] }) {
  const { i18n } = useTranslation();

  const langs = available?.length ? LANGUAGES.filter((l) => available.includes(l.code)) : LANGUAGES;

  return (
    <div className="flex gap-1 flex-wrap justify-center">
      {langs.map((lang) => (
        <button
          key={lang.code}
          onClick={() => {
            i18n.changeLanguage(lang.code);
            document.documentElement.dir = lang.code === 'ar' ? 'rtl' : 'ltr';
          }}
          className={`
            px-2 py-1 rounded text-sm font-medium transition-colors
            ${i18n.language === lang.code
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}
          `}
        >
          <span className="mr-1">{lang.flag}</span>
          {lang.label}
        </button>
      ))}
    </div>
  );
}
