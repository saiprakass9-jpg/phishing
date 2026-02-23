import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Trash2, ExternalLink, Clock, AlertTriangle, CheckCircle, AlertOctagon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import Header from '@/components/Header';
import { useLanguage } from '@/context/LanguageContext';

interface Log {
  id: number;
  url: string;
  prediction: string;
  risk_score: number;
  timestamp: string;
}

export default function History() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }

    const fetchHistory = async () => {
      try {
        const response = await fetch(`/api/history?userId=${user?.id}`);
        if (response.ok) {
          const data = await response.json();
          setLogs(data);
        }
      } catch (error) {
        console.error('Failed to fetch history:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [isAuthenticated, user, navigate]);

  const handleDelete = async (id: number) => {
    try {
      await fetch(`/api/history/${id}`, { method: 'DELETE' });
      setLogs(logs.filter(log => log.id !== id));
    } catch (error) {
      console.error('Failed to delete log:', error);
    }
  };

  const getStatusIcon = (prediction: string) => {
    if (prediction.includes('Phishing') || prediction.includes('Blocked')) return <AlertTriangle className="h-5 w-5 text-red-500" />;
    if (prediction.includes('Suspicious')) return <AlertOctagon className="h-5 w-5 text-amber-500" />;
    return <CheckCircle className="h-5 w-5 text-emerald-500" />;
  };

  const getStatusColor = (prediction: string) => {
    if (prediction.includes('Phishing') || prediction.includes('Blocked')) return 'text-red-600 bg-red-50 border-red-200';
    if (prediction.includes('Suspicious')) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-emerald-600 bg-emerald-50 border-emerald-200';
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <Header />
      
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">{t('history.title')}</h1>
            <p className="text-slate-500 mt-1">{t('history.subtitle')}</p>
          </div>
          <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-200 text-sm font-medium text-slate-600">
            {t('history.total')}: {logs.length}
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-white rounded-xl animate-pulse" />
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
            <Shield className="h-16 w-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900">{t('history.empty.title')}</h3>
            <p className="text-slate-500 mb-6">{t('history.empty.desc')}</p>
            <Button onClick={() => navigate('/')}>{t('history.button.start')}</Button>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {logs.map((log) => (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between group"
                >
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className={`p-3 rounded-lg ${getStatusColor(log.prediction)}`}>
                      {getStatusIcon(log.prediction)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-slate-900 truncate" title={log.url}>
                          {log.url}
                        </h3>
                        <a href={log.url} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-indigo-600">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-slate-500">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(log.timestamp).toLocaleDateString()}
                        </span>
                        <span>•</span>
                        <Badge variant="outline" className={getStatusColor(log.prediction)}>
                          {log.prediction}
                        </Badge>
                        <span>•</span>
                        <span className="font-medium">{t('history.risk')}: {log.risk_score.toFixed(0)}%</span>
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(log.id)}
                    className="text-slate-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>
    </div>
  );
}