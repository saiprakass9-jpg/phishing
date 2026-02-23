import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, AlertTriangle, CheckCircle, BarChart3, Lock, Server, ArrowLeft, Activity, FileText, X, Download, AlertOctagon, MessageSquareWarning } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Header from '@/components/Header';
import { useAuth } from '@/context/AuthContext';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { toast } from 'sonner';
import { useLanguage } from '@/context/LanguageContext';

interface AnalysisResult {
  url: string;
  isBlacklisted?: boolean;
  svm: {
    isPhishing: boolean;
    isSuspicious?: boolean;
    confidence: number;
    label: string;
  };
  lightgbm: {
    isPhishing: boolean;
    isSuspicious?: boolean;
    confidence: number;
    label: string;
  };
  aggregate?: {
    score: number;
    label: string;
  };
  explanation?: string;
  features: {
    urlLength: number;
    hasIpAddress: number;
    hasAtSymbol: number;
    hasDoubleSlash: number;
    hasDash: number;
    hasHttps: number;
    subdomainCount: number;
    hasSuspiciousWords: number;
    isShortened: number;
  };
}

export default function Analysis() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();
  const targetUrl = searchParams.get('target');
  
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState('');
  const [isComplaintOpen, setIsComplaintOpen] = useState(false);
  const [complaintForm, setComplaintForm] = useState({ name: '', email: '', description: '' });
  const [complaintStatus, setComplaintStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  useEffect(() => {
    if (!targetUrl) {
      toast.error(t('analysis.error.noUrl'));
      navigate('/');
      return;
    }

    const fetchData = async () => {
      try {
        const response = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: targetUrl, userId: user?.id }),
        });

        if (!response.ok) throw new Error('Analysis failed');
        const data = await response.json();
        setResult(data);
      } catch (err) {
        const errorMessage = t('analysis.error.failed');
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [targetUrl, navigate, user?.id, t]);

  const handleComplaintSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setComplaintStatus('submitting');
    try {
      const response = await fetch('/api/complaint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...complaintForm,
          url: result?.url
        }),
      });
      if (response.ok) {
        setComplaintStatus('success');
        toast.success(t('complaint.success'));
        setTimeout(() => {
          setIsComplaintOpen(false);
          setComplaintStatus('idle');
          setComplaintForm({ name: '', email: '', description: '' });
        }, 2000);
      } else {
        setComplaintStatus('error');
        toast.error(t('complaint.error'));
      }
    } catch (err) {
      setComplaintStatus('error');
      toast.error(t('complaint.error.generic'));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center space-y-4">
        <div className="h-12 w-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        <p className="text-slate-600 font-medium animate-pulse">{t('analysis.loading')}</p>
      </div>
    );
  }

  // Error Dialog
  if (error || !result) {
    return (
      <div className="min-h-screen bg-slate-50 font-sans">
        <Header />
        <Dialog open={true} onOpenChange={() => navigate('/')}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" /> {t('analysis.failed')}
              </DialogTitle>
              <DialogDescription>
                {error || t('analysis.error.unknown')}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button onClick={() => navigate('/')}>{t('analysis.return')}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  const chartData = [
    {
      name: t('analysis.model.svm'),
      confidence: result.svm.confidence,
      isPhishing: result.svm.isPhishing
    },
    {
      name: t('analysis.model.lgbm'),
      confidence: result.lightgbm.confidence,
      isPhishing: result.lightgbm.isPhishing
    }
  ];

  // Calculate an aggregate "Accuracy" or "Risk Score" for this specific URL
  // This is a synthetic metric based on the model confidence
  const averageConfidence = result.aggregate?.score ?? (result.svm.confidence + result.lightgbm.confidence) / 2;
  const isBlacklisted = result.isBlacklisted;
  const isPhishing = result.svm.isPhishing || result.lightgbm.isPhishing || isBlacklisted;
  const isSuspicious = !isPhishing && (result.svm.isSuspicious || result.lightgbm.isSuspicious);
  
  let statusColor = 'text-emerald-600';
  let statusBg = 'border-l-emerald-500';
  let statusIcon = <CheckCircle className="h-12 w-12 text-emerald-500" />;
  let statusTitle = t('analysis.safe');

  if (isBlacklisted) {
    statusColor = 'text-red-700';
    statusBg = 'border-l-red-700';
    statusIcon = <AlertOctagon className="h-12 w-12 text-red-700" />;
    statusTitle = t('analysis.blocked');
  } else if (isPhishing) {
    statusColor = 'text-red-600';
    statusBg = 'border-l-red-500';
    statusIcon = <AlertTriangle className="h-12 w-12 text-red-500" />;
    statusTitle = t('analysis.phishing');
  } else if (isSuspicious) {
    statusColor = 'text-amber-600';
    statusBg = 'border-l-amber-500';
    statusIcon = <MessageSquareWarning className="h-12 w-12 text-amber-500" />;
    statusTitle = t('analysis.suspicious');
  }

  const accuracyLabel = isPhishing ? t('analysis.score.phishing') : (isSuspicious ? t('analysis.score.suspicion') : t('analysis.score.safety'));

  const handleViewReport = () => {
    navigate('/report', { state: { result } });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-8"
        >
          {/* Main Verdict */}
          <div className="lg:col-span-2 space-y-6">
            <Card className={`border-l-4 shadow-md overflow-hidden ${statusBg}`}>
              <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-2xl">
                      {statusTitle}
                    </CardTitle>
                    <CardDescription className="mt-1 font-mono text-xs break-all">{result.url}</CardDescription>
                  </div>
                  {statusIcon}
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                {(isPhishing || isSuspicious) && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-lg text-red-800 text-sm font-medium flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 shrink-0" />
                    <div>
                      <p className="font-bold mb-1">{t('analysis.warning.title')}</p>
                      <p>{t('analysis.warning.desc')}</p>
                      {isBlacklisted && <p className="mt-2 font-bold uppercase">{t('analysis.blocked.desc')}</p>}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2 p-4 bg-slate-50 rounded-lg border border-slate-100">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      <Activity className="h-3 w-3" /> {accuracyLabel}
                    </h4>
                    <div className="flex items-end gap-2">
                      <span className={`text-4xl font-extrabold ${statusColor}`}>
                        {averageConfidence.toFixed(1)}%
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      {t('analysis.score.desc')}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-slate-500 uppercase tracking-wider">{t('analysis.model.svm')}</h4>
                    <div className="flex items-end gap-2">
                      <span className={`text-2xl font-bold ${result.svm.isPhishing ? 'text-red-600' : (result.svm.isSuspicious ? 'text-amber-600' : 'text-emerald-600')}`}>
                        {result.svm.confidence.toFixed(1)}%
                      </span>
                    </div>
                    <Badge variant={result.svm.isPhishing ? "destructive" : (result.svm.isSuspicious ? "warning" : "success")}>
                      {result.svm.label}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-slate-500 uppercase tracking-wider">{t('analysis.model.lgbm')}</h4>
                    <div className="flex items-end gap-2">
                      <span className={`text-2xl font-bold ${result.lightgbm.isPhishing ? 'text-red-600' : (result.lightgbm.isSuspicious ? 'text-amber-600' : 'text-emerald-600')}`}>
                        {result.lightgbm.confidence.toFixed(1)}%
                      </span>
                    </div>
                    <Badge variant={result.lightgbm.isPhishing ? "destructive" : (result.lightgbm.isSuspicious ? "warning" : "success")}>
                      {result.lightgbm.label}
                    </Badge>
                  </div>
                </div>

                {result.explanation && (
                  <div className="mt-6 p-4 bg-indigo-50 border border-indigo-100 rounded-lg">
                    <h4 className="text-sm font-bold text-indigo-900 uppercase tracking-wider mb-2 flex items-center gap-2">
                      <Shield className="h-4 w-4" /> {t('analysis.report.title')}
                    </h4>
                    <p className="text-slate-700 text-sm leading-relaxed">
                      {result.explanation}
                    </p>
                  </div>
                )}

                <div className="mt-8 pt-6 border-t border-slate-100 flex flex-wrap justify-end gap-4">
                  <Dialog open={isComplaintOpen} onOpenChange={setIsComplaintOpen}>
                    <DialogTrigger asChild>
                      <Button variant="destructive" className="font-bold">
                        <MessageSquareWarning className="h-4 w-4 mr-2" /> {t('complaint.button')}
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{t('complaint.title')}</DialogTitle>
                        <DialogDescription>
                          {t('complaint.desc')}
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleComplaintSubmit} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="url">{t('complaint.label.url')}</Label>
                          <Input id="url" value={result.url} disabled className="bg-slate-100" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="name">{t('complaint.label.name')}</Label>
                          <Input 
                            id="name" 
                            value={complaintForm.name} 
                            onChange={(e) => setComplaintForm({...complaintForm, name: e.target.value})} 
                            placeholder={t('complaint.placeholder.name')}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">{t('complaint.label.email')}</Label>
                          <Input 
                            id="email" 
                            type="email"
                            value={complaintForm.email} 
                            onChange={(e) => setComplaintForm({...complaintForm, email: e.target.value})} 
                            placeholder={t('complaint.placeholder.email')}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="description">{t('complaint.label.desc')}</Label>
                          <Textarea 
                            id="description" 
                            value={complaintForm.description} 
                            onChange={(e) => setComplaintForm({...complaintForm, description: e.target.value})} 
                            placeholder={t('complaint.placeholder.desc')}
                            required
                          />
                        </div>
                        <DialogFooter>
                          <Button type="submit" disabled={complaintStatus === 'submitting'}>
                            {complaintStatus === 'submitting' ? t('complaint.submitting') : t('complaint.submit')}
                          </Button>
                        </DialogFooter>
                        {complaintStatus === 'success' && <p className="text-green-600 text-sm text-center">{t('complaint.status.success')}</p>}
                        {complaintStatus === 'error' && <p className="text-red-600 text-sm text-center">{t('complaint.status.error')}</p>}
                      </form>
                    </DialogContent>
                  </Dialog>

                  <Button 
                    className="font-bold bg-indigo-600 hover:bg-indigo-700 text-white"
                    onClick={handleViewReport}
                  >
                    <FileText className="h-4 w-4 mr-2" /> {t('analysis.view.report')}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Feature Accordion */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5 text-slate-500" /> {t('analysis.features.title')}
                </CardTitle>
                <CardDescription>
                  {t('analysis.features.desc')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="url-length">
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center justify-between w-full pr-4">
                        <span className="font-medium">{t('feature.urlLength')}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-slate-500">{result.features.urlLength} {t('common.chars')}</span>
                          {result.features.urlLength > 54 ? (
                            <Badge variant="destructive">{t('common.highRisk')}</Badge>
                          ) : (
                            <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50">{t('common.lowRisk')}</Badge>
                          )}
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="text-slate-600">
                      {t('feature.urlLength.desc')}
                      {result.features.urlLength > 75 && ` ${t('feature.urlLength.long')}`}
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="ip-address">
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center justify-between w-full pr-4">
                        <span className="font-medium">{t('feature.ipAddress')}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-slate-500">{result.features.hasIpAddress ? t('common.detected') : t('common.none')}</span>
                          {result.features.hasIpAddress ? <Badge variant="destructive">{t('common.critical')}</Badge> : <Badge variant="outline">{t('common.safe')}</Badge>}
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="text-slate-600">
                      {t('feature.ipAddress.desc')}
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="at-symbol">
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center justify-between w-full pr-4">
                        <span className="font-medium">{t('feature.atSymbol')}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-slate-500">{result.features.hasAtSymbol ? t('common.present') : t('common.absent')}</span>
                          {result.features.hasAtSymbol ? <Badge variant="warning">{t('common.mediumRisk')}</Badge> : <Badge variant="outline">{t('common.safe')}</Badge>}
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="text-slate-600">
                      {t('feature.atSymbol.desc')}
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="redirect">
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center justify-between w-full pr-4">
                        <span className="font-medium">{t('feature.redirect')}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-slate-500">{result.features.hasDoubleSlash ? t('common.present') : t('common.absent')}</span>
                          {result.features.hasDoubleSlash ? <Badge variant="warning">{t('common.mediumRisk')}</Badge> : <Badge variant="outline">{t('common.safe')}</Badge>}
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="text-slate-600">
                      {t('feature.redirect.desc')}
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="https">
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center justify-between w-full pr-4">
                        <span className="font-medium">{t('feature.https')}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-slate-500">{result.features.hasHttps ? t('common.active') : t('common.missing')}</span>
                          {!result.features.hasHttps ? <Badge variant="warning">{t('common.unsecured')}</Badge> : <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50">{t('common.secured')}</Badge>}
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="text-slate-600">
                      {t('feature.https.desc')}
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="subdomains">
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center justify-between w-full pr-4">
                        <span className="font-medium">{t('feature.subdomains')}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-slate-500">{result.features.subdomainCount}</span>
                          {result.features.subdomainCount > 2 ? <Badge variant="warning">{t('common.suspicious')}</Badge> : <Badge variant="outline">{t('common.normal')}</Badge>}
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="text-slate-600">
                      {t('feature.subdomains.desc')}
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="keywords">
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center justify-between w-full pr-4">
                        <span className="font-medium">{t('feature.keywords')}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-slate-500">{result.features.hasSuspiciousWords ? t('common.detected') : t('common.none')}</span>
                          {result.features.hasSuspiciousWords ? <Badge variant="destructive">{t('common.highRisk')}</Badge> : <Badge variant="outline">{t('common.safe')}</Badge>}
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="text-slate-600">
                      {t('feature.keywords.desc')}
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar / Charts */}
          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-slate-500" /> {t('analysis.charts.confidence')}
                </CardTitle>
                <CardDescription>{t('analysis.charts.desc')}</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      cursor={{ fill: 'transparent' }}
                    />
                    <Bar dataKey="confidence" radius={[4, 4, 0, 0]} barSize={50}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.isPhishing ? '#ef4444' : '#10b981'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="bg-slate-900 text-slate-50 border-none">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Lock className="h-5 w-5 text-indigo-400" /> {t('analysis.stats.title')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <p className="text-slate-300 text-sm">
                    {t('analysis.stats.desc')}
                  </p>
                  <div className="h-[180px] w-full">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                      <BarChart data={[
                        { fold: 'F1', svm: 94.2, lgbm: 96.5 },
                        { fold: 'F2', svm: 93.8, lgbm: 97.1 },
                        { fold: 'F3', svm: 95.1, lgbm: 96.2 },
                        { fold: 'F4', svm: 94.5, lgbm: 96.9 },
                        { fold: 'F5', svm: 94.9, lgbm: 97.3 },
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                        <XAxis dataKey="fold" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis domain={[90, 100]} hide />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#f8fafc' }}
                          itemStyle={{ fontSize: '12px' }}
                          cursor={{ fill: '#334155', opacity: 0.4 }}
                        />
                        <Bar dataKey="svm" name="SVM" fill="#818cf8" radius={[2, 2, 0, 0]} />
                        <Bar dataKey="lgbm" name="LightGBM" fill="#34d399" radius={[2, 2, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex justify-center gap-4 text-xs text-slate-400">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-indigo-400 rounded-full" /> SVM
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-emerald-400 rounded-full" /> LightGBM
                    </div>
                  </div>
                </div>

                <div className="space-y-3 border-t border-slate-800 pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-sm">{t('analysis.stats.mean')}</span>
                    <span className="font-bold text-emerald-400">96.8%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-sm">{t('analysis.stats.std')}</span>
                    <span className="font-mono text-xs text-slate-500">±0.42</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
