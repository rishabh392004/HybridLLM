export type SupportedLanguage = 'en' | 'hi' | 'mr' | 'gu' | 'bn';

export interface LanguageOption {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  flag: string;
}

export const LANGUAGES: LanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिंदी', flag: '🇮🇳' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', flag: '🇮🇳' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', flag: '🇮🇳' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', flag: '🇮🇳' },
];

export const translations: Record<SupportedLanguage, Record<string, string>> = {
  en: {
    // Navigation
    nav_blended_map: 'Blended Map',
    nav_model_weights: 'Model Weights',
    nav_comparison: 'Comparison',
    nav_scoreboard: 'Scoreboard',
    nav_alerts: 'Alerts & Actions',
    nav_export: 'Export & Override',
    
    // Roles
    role_analyst: 'Meteorologist',
    role_disaster: 'Disaster Cell',
    role_farmer: 'Agro Advisory',
    
    // Parameters
    param_rainfall: 'Rainfall',
    param_temperature: 'Temperature',
    param_wind: 'Wind Speed',
    
    // Controls
    lead_time: 'Lead Time',
    select_region: 'Select Region',
    view_2d: '2D Map',
    view_3d: '3D Globe',
    demo_event: 'Demo Extreme Event',
    
    // Drawer & Details
    blended_forecast: 'ForeCombine Blended Forecast',
    observed_verification: 'Observed Verification',
    leading_model: 'Leading Source Model',
    blending_confidence: 'Blending Confidence',
    active_severe_alert: 'Active Severe Weather Alert Active',
    inspect_weights: 'Inspect Source Weight Allocations',
    compare_chart: 'Compare Model vs Blended Chart',
    view_bulletins: 'View Multi-Audience Action Bulletins',
    
    // Auth & General
    sign_in: 'Sign In',
    sign_up: 'Sign Up',
    sign_out: 'Sign Out',
    create_account: 'Create Operational Account',
    official_email: 'Official Email Address',
    password: 'Password',
    confirm_password: 'Confirm Password',
    select_role: 'Select Organizational Role',
  },
  hi: {
    // Navigation
    nav_blended_map: 'मिश्रित मौसम मानचित्र',
    nav_model_weights: 'मॉडल वेटेज भार',
    nav_comparison: 'तुलनात्मक चार्ट',
    nav_scoreboard: 'स्कॉरबोर्ड रैंकिंग',
    nav_alerts: 'चेतावनी एवं निर्देश',
    nav_export: 'निर्यात एवं ओवरराइड',
    
    // Roles
    role_analyst: 'मौसम वैज्ञानिक (IMD)',
    role_disaster: 'आपदा प्रबंधन सेल (SDRF)',
    role_farmer: 'कृषि सलाहकार (KVK)',
    
    // Parameters
    param_rainfall: 'वर्षा (Rainfall)',
    param_temperature: 'तापमान (Temperature)',
    param_wind: 'पवन गति (Wind)',
    
    // Controls
    lead_time: 'पूर्वानुमान समय',
    select_region: 'क्षेत्र चुनें',
    view_2d: '2D मानचित्र',
    view_3d: '3D ग्लोब',
    demo_event: 'अतिवृष्टि प्रदर्शन',
    
    // Drawer & Details
    blended_forecast: 'फोरकंबाइन मिश्रित पूर्वानुमान',
    observed_verification: 'सत्यापित वास्तविक मान',
    leading_model: 'प्रमुख स्रोत मॉडल',
    blending_confidence: 'मिश्रण विश्वसनीयता',
    active_severe_alert: 'तीव्र मौसम चेतावनी सक्रिय',
    inspect_weights: 'मॉडल वेट का निरीक्षण करें',
    compare_chart: 'पूर्वानुमान तुलना चार्ट देखें',
    view_bulletins: 'आपदा एवं कृषि बुलेटिन देखें',
    
    // Auth & General
    sign_in: 'साइन इन करें',
    sign_up: 'पंजीकरण करें',
    sign_out: 'साइन आउट',
    create_account: 'नया खाता बनाएं',
    official_email: 'आधिकारिक ईमेल पता',
    password: 'पासवर्ड',
    confirm_password: 'पासवर्ड की पुष्टि करें',
    select_role: 'संस्थागत भूमिका चुनें',
  },
  mr: {
    // Navigation
    nav_blended_map: 'एकत्रित हवामान नकाशा',
    nav_model_weights: 'मॉडेल वेटेज भार',
    nav_comparison: 'तुलनात्मक आलेख',
    nav_scoreboard: 'गुणवत्ता क्रमवारी',
    nav_alerts: 'इशारे व मार्गदर्शक तत्त्वे',
    nav_export: 'निर्यात व दुरुस्ती',
    
    // Roles
    role_analyst: 'हवामान शास्त्रज्ञ',
    role_disaster: 'आपत्ती व्यवस्थापन विभाग',
    role_farmer: 'शेतकरी कृषी सल्लागार',
    
    // Parameters
    param_rainfall: 'पाऊस (Rainfall)',
    param_temperature: 'तापमान (Temperature)',
    param_wind: 'वाऱ्याचा वेग (Wind)',
    
    // Controls
    lead_time: 'कालावधी',
    select_region: 'प्रभाग निवडा',
    view_2d: '2D नकाशा',
    view_3d: '3D पृथ्वी गोल',
    demo_event: 'अतिवृष्टी प्रात्यक्षिक',
    
    // Drawer & Details
    blended_forecast: 'एकत्रित हवामान अंदाज',
    observed_verification: 'प्रत्यक्ष नोंदवलेला पाऊस',
    leading_model: 'मुख्य मॉडेल स्रोत',
    blending_confidence: 'अंदाज विश्वासार्हता',
    active_severe_alert: 'गंभीर हवामान इशारा लागू',
    inspect_weights: 'मॉडेल वजनाची पाहणी करा',
    compare_chart: 'मॉडेल तुलना आलेख पहा',
    view_bulletins: 'शेतकरी व आपत्ती सूचना पहा',
    
    // Auth & General
    sign_in: 'साइन इन करा',
    sign_up: 'नोंदणी करा',
    sign_out: 'साइन आउट',
    create_account: 'नवीन खाते तयार करा',
    official_email: 'शासकीय ईमेल पत्ता',
    password: 'पासवर्ड',
    confirm_password: 'पासवर्डची पुष्टी करा',
    select_role: 'प्रशासकीय भूमिका निवडा',
  },
  gu: {
    // Navigation
    nav_blended_map: 'મિશ્રિત હવામાન નકશો',
    nav_model_weights: 'મોડેલ વજન ભાર',
    nav_comparison: 'તુલનાત્મક ચાર્ટ',
    nav_scoreboard: 'રેન્કિંગ સ્કોરબોર્ડ',
    nav_alerts: 'ચેતવણી અને સૂચનાઓ',
    nav_export: 'નિકાસ અને ફેરફાર',
    
    // Roles
    role_analyst: 'હવામાન નિષ્ણાત',
    role_disaster: 'આપત્તિ વ્યવસ્થાપન સૈલ',
    role_farmer: 'ખેડૂત કૃષિ સલાહકાર',
    
    // Parameters
    param_rainfall: 'વરસાદ',
    param_temperature: 'તાપમાન',
    param_wind: 'પવનની ગતિ',
    
    // Controls
    lead_time: 'આગાહી સમય',
    select_region: 'વિસ્તાર પસંદ કરો',
    view_2d: '2D નકશો',
    view_3d: '3D ગ્લોબ',
    demo_event: 'અતિવૃષ્ટિ ડેમો',
    
    // Drawer & Details
    blended_forecast: 'ફોરકમ્બાઇન બ્લેન્ડેડ આગાહી',
    observed_verification: 'ચકાસાયેલ વાસ્તવિક મૂલ્ય',
    leading_model: 'મુખ્ય મોડેલ સ્ત્રોત',
    blending_confidence: 'વિશ્વાસનીયતા દર',
    active_severe_alert: 'ગંભીર હવામાન એલર્ટ સક્રિય',
    inspect_weights: 'મોડેલ વજન તપાસો',
    compare_chart: 'આગાહી સરખામણી જુઓ',
    view_bulletins: 'ખેડૂત અને આપત્તિ બુલેટિન જુઓ',
    
    // Auth & General
    sign_in: 'સાઇન ઇન કરો',
    sign_up: 'સાઇન અપ કરો',
    sign_out: 'સાઇન આઉટ',
    create_account: 'ખાતું બનાવો',
    official_email: 'સત્તાવાર ઇમેઇલ સરનામું',
    password: 'પાસવર્ડ',
    confirm_password: 'પાસવર્ડની પુષ્ટિ કરો',
    select_role: 'સંસ્થાકીય ભૂમિકા પસંદ કરો',
  },
  bn: {
    // Navigation
    nav_blended_map: 'সংযুক্ত আবহাওয়া মানচিত্র',
    nav_model_weights: 'মডেল ওয়েটেজ ভার',
    nav_comparison: 'তুলনামূলক চার্ট',
    nav_scoreboard: 'র্যাঙ্কিং স্কোরবোর্ড',
    nav_alerts: 'সতর্কতা ও নির্দেশাবলী',
    nav_export: 'রপ্তানি ও ওভাররাইড',
    
    // Roles
    role_analyst: 'আবহাওয়াবিদ (IMD)',
    role_disaster: 'দুর্যোগ ব্যবস্থাপনা সেল',
    role_farmer: 'কৃষি পরামর্শদাতা',
    
    // Parameters
    param_rainfall: 'বৃষ্টিপাত',
    param_temperature: 'তাপমাত্রা',
    param_wind: 'বায়ু গতিবেগ',
    
    // Controls
    lead_time: 'পূর্বাভাসের সময়',
    select_region: 'অঞ্চল নির্বাচন করুন',
    view_2d: '2D মানচিত্র',
    view_3d: '3D গ্লোব',
    demo_event: 'অতিবৃষ্টি ডেমো',
    
    // Drawer & Details
    blended_forecast: 'সংযুক্ত আবহাওয়া পূর্বাভাস',
    observed_verification: 'যাচাইকৃত প্রকৃত মান',
    leading_model: 'প্রধান মডেল উৎস',
    blending_confidence: 'পূর্বাভাস বিশ্বাসযোগ্যতা',
    active_severe_alert: 'জরুরি আবহাওয়া সতর্কতা সক্রিয়',
    inspect_weights: 'মডেলের ওজন পরীক্ষা করুন',
    compare_chart: 'পূর্বাভাস তুলনা চার্ট দেখুন',
    view_bulletins: 'কৃষি ও দুর্যোগ বুলেটিন দেখুন',
    
    // Auth & General
    sign_in: 'সাইন ইন করুন',
    sign_up: 'নিবন্ধন করুন',
    sign_out: 'সাইন আউট',
    create_account: 'নতুন অ্যাকাউন্ট তৈরি করুন',
    official_email: 'অফিসিয়াল ইমেল ঠিকানা',
    password: 'পাসওয়ার্ড',
    confirm_password: 'পাসওয়ার্ড নিশ্চিত করুন',
    select_role: 'প্রাতিষ্ঠানিক ভূমিকা নির্বাচন করুন',
  },
};
