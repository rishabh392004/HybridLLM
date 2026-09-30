import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { SupportedLanguage } from '../i18n/translations';
import { Globe, ChevronDown } from 'lucide-react';

export const LanguageSelector: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { language, setLanguage, languages } = useLanguage();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentLang = languages.find((l) => l.code === language) || languages[0];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-surface border border-border/80 hover:bg-surface-hover text-xs font-semibold text-text-primary transition-all duration-200"
        title="Select Language / भाषा चुनें"
        aria-label="Select Application Language"
      >
        <Globe className="w-3.5 h-3.5 text-accent shrink-0" />
        <span className="font-medium text-xs">{currentLang.nativeName}</span>
        <ChevronDown className="w-3.5 h-3.5 text-text-muted shrink-0" />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-40 rounded-2xl bg-surface/95 backdrop-blur-xl border border-border shadow-2xl z-50 py-1.5 animate-fadeIn">
          <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-text-muted border-b border-border/60">
            Languages / भाषाएँ
          </div>
          <div className="py-1">
            {languages.map((l) => (
              <button
                key={l.code}
                onClick={() => {
                  setLanguage(l.code as SupportedLanguage);
                  setOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium transition-colors ${
                  language === l.code
                    ? 'bg-accent/15 text-accent font-bold'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover/70'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span>{l.flag}</span>
                  <span>{l.nativeName}</span>
                </div>
                {language === l.code && <span className="w-1.5 h-1.5 rounded-full bg-accent" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
