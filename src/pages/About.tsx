import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Shield, Server, Users, Code, Database, Lock, ArrowLeft, Cpu, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/context/LanguageContext';
import Header from '@/components/Header';

export default function About() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <Header />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
        {/* Hero Section */}
        <section className="text-center space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Badge variant="secondary" className="mb-4 px-4 py-1">{t('about.project.badge')}</Badge>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 mb-6">
              {t('about.hero.title.start')} <span className="text-indigo-600">{t('about.hero.title.end')}</span>
            </h1>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
              {t('about.hero.desc')}
            </p>
          </motion.div>
        </section>

        {/* Technology Stack */}
        <section>
          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="space-y-8"
          >
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-slate-900 flex items-center justify-center gap-3">
                <Cpu className="h-8 w-8 text-indigo-600" />
                {t('about.tech.title')}
              </h2>
              <p className="text-slate-500 mt-2">
                {t('about.tech.desc')}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <motion.div variants={item}>
                <Card className="h-full border-t-4 border-t-indigo-500 shadow-lg hover:shadow-xl transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-2xl">
                      <Database className="h-6 w-6 text-indigo-600" />
                      {t('about.svm.title')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-slate-600 leading-relaxed">
                      {t('about.svm.desc')}
                    </p>
                    <ul className="space-y-2 text-sm text-slate-500">
                      <li className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-indigo-600" />
                        {t('about.svm.point1')}
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-indigo-600" />
                        {t('about.svm.point2')}
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-indigo-600" />
                        {t('about.svm.point3')}
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={item}>
                <Card className="h-full border-t-4 border-t-violet-500 shadow-lg hover:shadow-xl transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-2xl">
                      <Zap className="h-6 w-6 text-violet-600" />
                      {t('about.lgbm.title')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-slate-600 leading-relaxed">
                      {t('about.lgbm.desc')}
                    </p>
                    <ul className="space-y-2 text-sm text-slate-500">
                      <li className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-violet-600" />
                        {t('about.lgbm.point1')}
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-violet-600" />
                        {t('about.lgbm.point2')}
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-violet-600" />
                        {t('about.lgbm.point3')}
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </motion.div>
        </section>

        {/* Team Section */}
        <section>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-2xl p-8 md:p-12 shadow-sm border border-slate-200"
          >
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-slate-900 flex items-center justify-center gap-3">
                <Users className="h-8 w-8 text-indigo-600" />
                {t('about.team.title')}
              </h2>
              <p className="text-slate-500 mt-2">
                {t('about.team.dept')}<br/>
                {t('about.team.college')}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="text-center p-4">
                <div className="w-20 h-20 bg-indigo-100 rounded-full mx-auto mb-4 flex items-center justify-center text-indigo-600 font-bold text-2xl">
                  TL
                </div>
                <h3 className="font-bold text-slate-900">Mrs. T. Lavanya</h3>
                <p className="text-sm text-indigo-600 font-medium">{t('about.team.role.asst')}</p>
                <p className="text-xs text-slate-500 mt-1">{t('about.team.guide')}</p>
              </div>

              <div className="text-center p-4">
                <div className="w-20 h-20 bg-slate-100 rounded-full mx-auto mb-4 flex items-center justify-center text-slate-600 font-bold text-xl">
                  RP
                </div>
                <h3 className="font-bold text-slate-900">Rangu Padmini</h3>
                <p className="text-sm text-slate-500">{t('about.team.researcher')}</p>
              </div>

              <div className="text-center p-4">
                <div className="w-20 h-20 bg-slate-100 rounded-full mx-auto mb-4 flex items-center justify-center text-slate-600 font-bold text-xl">
                  MS
                </div>
                <h3 className="font-bold text-slate-900">M. Satya Narayana</h3>
                <p className="text-sm text-slate-500">{t('about.team.researcher')}</p>
              </div>

              <div className="text-center p-4 lg:col-start-1 lg:col-end-2 lg:ml-auto">
                {/* Spacer for centering 5 items grid if needed, or just list them */}
              </div>
              
              <div className="text-center p-4">
                <div className="w-20 h-20 bg-slate-100 rounded-full mx-auto mb-4 flex items-center justify-center text-slate-600 font-bold text-xl">
                  SP
                </div>
                <h3 className="font-bold text-slate-900">Singamsetty Pavan</h3>
                <p className="text-sm text-slate-500">{t('about.team.researcher')}</p>
              </div>

              <div className="text-center p-4">
                <div className="w-20 h-20 bg-slate-100 rounded-full mx-auto mb-4 flex items-center justify-center text-slate-600 font-bold text-xl">
                  SN
                </div>
                <h3 className="font-bold text-slate-900">Shaik Nazma</h3>
                <p className="text-sm text-slate-500">{t('about.team.researcher')}</p>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Footer */}
        <footer className="border-t border-slate-200 pt-8 pb-12 text-center text-slate-500 text-sm">
          <p className="mb-2">
            &copy; {new Date().getFullYear()} {t('footer.rights')}
          </p>
          <div className="flex justify-center gap-4 mt-4">
            <a href="#" className="hover:text-indigo-600 transition-colors">{t('about.footer.privacy')}</a>
            <a href="#" className="hover:text-indigo-600 transition-colors">{t('about.footer.terms')}</a>
            <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-indigo-600 transition-colors flex items-center gap-1">
              <Code className="h-3 w-3" /> GitHub
            </a>
          </div>
        </footer>
      </main>
    </div>
  );
}
