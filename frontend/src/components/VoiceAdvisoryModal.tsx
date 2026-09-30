import React, { useState, useEffect } from 'react';
import { SupportedLanguage, LANGUAGES } from '../i18n/translations';
import { Volume2, VolumeX, MessageSquare, Phone, X, Play, Square, Radio, Sparkles } from 'lucide-react';

interface VoiceAdvisoryModalProps {
  region: string;
  onClose: () => void;
}

export const VoiceAdvisoryModal: React.FC<VoiceAdvisoryModalProps> = ({ region, onClose }) => {
  const [selectedLang, setSelectedLang] = useState<SupportedLanguage>('hi');
  const [isPlaying, setIsPlaying] = useState(false);

  const voiceScripts: Record<SupportedLanguage, string> = {
    en: `Emergency Weather Advisory for ${region || 'Konkan and Goa'}. Blended forecasts indicate heavy rainfall exceeding 115 millimeters in the next 24 hours. Farmers are advised to clear crop drainage channels immediately. NDRF teams stand by for dewatering.`,
    hi: `${region || 'कोंकण और गोवा'} के लिए आपातकालीन मौसम चेतावनी। अगले 24 घंटों में 115 मिलीमीटर से अधिक भारी बारिश का अनुमान है। किसानों से तुरंत जल निकासी नाले साफ करने का अनुरोध है। आपदा राहत दल सतर्क हैं।`,
    mr: `${region || 'कोंकण आणि गोवा'} भागासाठी तातडीचा हवामान इशारा। पुढील २४ तासांत ११५ मिलीमीटरपेक्षा जास्त मुसळधार पावसाची शक्यता आहे। शेतकऱ्यांनी शेतातील पाण्याचा निचरा तात्काळ खुला करावा। आपत्ती व्यवस्थापन पथके तैनात आहेत।`,
    gu: `${region || 'કોંકણ અને ગોવા'} માટે કટોકટીની હવામાન ચેતવણી. આગામી 24 કલાકમાં 115 મિલીમીટરથી વધુ ભારે વરસાદની આગાહી છે. ખેડૂતોને તાત્કાલિક ખેતરમાંથી પાણીના નિકાલની વ્યવસ્થા કરવા અપીલ છે.`,
    bn: `${region || 'কোঙ্কণ ও গোয়া'} অঞ্চলের জন্য জরুরি আবহাওয়া সতর্কতা। আগামী ২৪ ঘণ্টায় ১১৫ মিলিমিটারের বেশি ভারী বৃষ্টির পূর্বাভাস রয়েছে। কৃষকদের জমি থেকে জল নিষ্কাশনের ব্যবস্থা করার অনুরোধ করা হচ্ছে।`,
  };

  const handleSpeak = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      if (isPlaying) {
        setIsPlaying(false);
        return;
      }

      const script = voiceScripts[selectedLang];
      const utterance = new SpeechSynthesisUtterance(script);

      const langMap: Record<SupportedLanguage, string> = {
        en: 'en-IN',
        hi: 'hi-IN',
        mr: 'mr-IN',
        gu: 'gu-IN',
        bn: 'bn-IN',
      };

      utterance.lang = langMap[selectedLang] || 'hi-IN';
      utterance.rate = 0.95;

      utterance.onend = () => setIsPlaying(false);
      utterance.onerror = () => setIsPlaying(false);

      setIsPlaying(true);
      window.speechSynthesis.speak(utterance);
    } else {
      alert('Speech Synthesis API is not supported in this browser.');
    }
  };

  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-surface border border-border rounded-3xl p-6 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-text-primary">
                Regional Voice & WhatsApp Advisory
              </h3>
              <p className="text-[11px] text-text-muted">Simulated multi-lingual audio bulletin dispatch</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-text-muted hover:text-text-primary hover:bg-surface-hover"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Language Selection Pills */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-text-muted">Select Broadcast Language:</label>
          <div className="grid grid-cols-3 gap-2">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => {
                  if (isPlaying && 'speechSynthesis' in window) {
                    window.speechSynthesis.cancel();
                    setIsPlaying(false);
                  }
                  setSelectedLang(lang.code);
                }}
                className={`py-1.5 px-2 rounded-xl text-xs font-bold border transition-all ${
                  selectedLang === lang.code
                    ? 'bg-accent/20 text-accent border-accent shadow-sm'
                    : 'bg-surface-card hover:bg-surface-hover border-border text-text-secondary'
                }`}
              >
                <span>{lang.flag} {lang.nativeName}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Phone Mockup Window */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-border space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between text-[11px] text-emerald-400 border-b border-slate-800 pb-2">
            <div className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5" />
              <span className="font-bold">WhatsApp Alert Broadcast • MoES KVK</span>
            </div>
            <span className="font-mono">LIVE DISPATCH</span>
          </div>

          <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-100 text-xs leading-relaxed font-sans">
            {voiceScripts[selectedLang]}
          </div>

          {/* Audio Waveform Animation */}
          {isPlaying && (
            <div className="flex items-center justify-center gap-1 h-6 pt-1">
              {[40, 70, 30, 90, 60, 100, 50, 80, 40].map((h, i) => (
                <div
                  key={i}
                  className="w-1 bg-accent rounded-full animate-pulse"
                  style={{ height: `${h}%`, animationDelay: `${i * 0.1}s` }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <button
            onClick={handleSpeak}
            className={`w-full py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
              isPlaying
                ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg'
                : 'bg-accent hover:bg-accent-hover text-slate-950 shadow-glow-teal'
            }`}
          >
            {isPlaying ? (
              <>
                <Square className="w-4 h-4 fill-current" />
                <span>Stop Voice Broadcast</span>
              </>
            ) : (
              <>
                <Volume2 className="w-4 h-4" />
                <span>Play Localized Audio Bulletin ({selectedLang.toUpperCase()})</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
