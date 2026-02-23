import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import Header from '@/components/Header';
import { useLanguage } from '@/context/LanguageContext';

export default function Home() {
  const [url, setUrl] = useState('');
  const navigate = useNavigate();
  const { t } = useLanguage();

  const handleAnalyze = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    // Navigate to analysis page with the URL encoded
    navigate(`/analysis?target=${encodeURIComponent(url)}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
      <Header />

      <main className="flex-grow flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl w-full space-y-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Badge variant="secondary" className="mb-6 px-4 py-1 text-sm">
              {t('home.badge')}
            </Badge>
            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 mb-6">
              {t('home.title.start')} <span className="text-indigo-600">{t('home.title.end')}</span>
            </h1>
            <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto">
              {t('home.subtitle')}
            </p>
          </motion.div>

          <motion.form
            onSubmit={handleAnalyze}
            className="flex flex-col sm:flex-row gap-4 max-w-xl mx-auto"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Input
              type="url"
              placeholder={t('home.input.placeholder')}
              className="h-14 text-lg shadow-sm px-6 rounded-full border-slate-300 focus:border-indigo-500 focus:ring-indigo-500"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
            />
            <Button type="submit" size="lg" className="h-14 px-8 rounded-full bg-indigo-600 hover:bg-indigo-700 text-lg font-semibold shadow-lg shadow-indigo-200 transition-all hover:scale-105">
              {t('home.button.analyze')} <Search className="ml-2 h-5 w-5" />
            </Button>
          </motion.form>

          <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 text-left"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
             <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-100">
               <div className="text-indigo-600 font-bold text-lg mb-2">{t('home.card1.title')}</div>
               <p className="text-slate-500 text-sm">{t('home.card1.desc')}</p>
             </div>
             <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-100">
               <div className="text-violet-600 font-bold text-lg mb-2">{t('home.card2.title')}</div>
               <p className="text-slate-500 text-sm">{t('home.card2.desc')}</p>
             </div>
             <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-100">
               <div className="text-emerald-600 font-bold text-lg mb-2">{t('home.card3.title')}</div>
               <p className="text-slate-500 text-sm">{t('home.card3.desc')}</p>
             </div>
          </motion.div>
        </div>
      </main>

      <footer className="border-t border-slate-200 py-8 text-center text-slate-500 text-sm bg-white">
        <p>&copy; {new Date().getFullYear()} {t('footer.rights')}</p>
      </footer>
    </div>
  );
}
