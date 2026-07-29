import { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ScanLine, Upload, X, ImageIcon, Zap, Award, Clock, Database,
  Sparkles, Eye, Flame, ChevronRight,
} from 'lucide-react';
import { predictBreed, generateHeatmapPlaceholder } from '@/lib/aiService';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useI18n } from '@/context/I18nContext';
import { PageHeader } from '@/components/AppLayout';
import { Card, CardHeader, Button, ConfidenceBar, Badge, Spinner } from '@/components/ui';
import type { BreedRecognitionResult } from '@/types';

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

export function PredictPage() {
  const { session } = useAuth();
  const { toast } = useToast();
  const { t } = useI18n();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');
  const [dragging, setDragging] = useState(false);
  const [predicting, setPredicting] = useState(false);
  const [result, setResult] = useState<BreedRecognitionResult | null>(null);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [heatmapUrl, setHeatmapUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleFile = useCallback((file: File) => {
    if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
      toast('Please upload a JPG, JPEG, or PNG image.', 'error');
      return;
    }
    if (file.size > MAX_SIZE) {
      toast('Image must be under 10 MB.', 'error');
      return;
    }
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      setImageDataUrl(e.target?.result as string);
      setResult(null);
      setShowHeatmap(false);
    };
    reader.readAsDataURL(file);
  }, [toast]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handlePredict = async () => {
    if (!imageDataUrl) return;
    setPredicting(true);
    setResult(null);
    try {
      const res = await predictBreed(imageDataUrl);
      setResult(res);
      setHeatmapUrl(generateHeatmapPlaceholder());
      toast(`${t('predict.identified')}: ${res.breed} (${res.confidence}%)`, 'success');
    } catch {
      toast(t('predict.failed'), 'error');
    }
    setPredicting(false);
  };

  const handleSave = async () => {
    if (!result || !session?.user) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('predictions').insert({
        user_id: session.user.id,
        image_url: imageDataUrl,
        species: result.species,
        predicted_breed: result.breed,
        confidence: result.confidence,
        top_predictions: result.top_predictions,
        inference_ms: result.inference_ms,
      });
      if (error) throw error;

      await supabase.from('activity_logs').insert({
        user_id: session.user.id,
        action: `Breed recognition: ${result.breed}`,
        entity: 'prediction',
        details: `Confidence ${result.confidence}% · ${result.species}`,
      });

      toast(t('predict.saved'), 'success');
      navigate('/app/history');
    } catch {
      toast(t('predict.saveFailed'), 'error');
    }
    setSaving(false);
  };

  const reset = () => {
    setImageDataUrl(null);
    setResult(null);
    setFileName('');
    setShowHeatmap(false);
    setHeatmapUrl(null);
  };

  return (
    <div>
      <PageHeader
        title={t('predict.title')}
        subtitle={t('predict.subtitle')}
      />

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Upload panel */}
        <div>
          <Card>
            <CardHeader title={t('predict.uploadTitle')} subtitle={t('predict.uploadSubtitle')} />
            <div className="p-5 pt-3">
              {!imageDataUrl ? (
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={onDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-300 ${
                    dragging
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 scale-[1.01]'
                      : 'border-gray-300 dark:border-gray-700 hover:border-primary-400 dark:hover:border-primary-600 hover:bg-gray-50 dark:hover:bg-gray-800/30'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                  />
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <Upload className="w-7 h-7 text-white" />
                  </div>
                  <p className="font-medium text-sm">{t('predict.dragDrop')}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('predict.orBrowse')}</p>
                  <div className="flex items-center justify-center gap-2 mt-4">
                    <Badge color="green">JPG</Badge>
                    <Badge color="green">JPEG</Badge>
                    <Badge color="green">PNG</Badge>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="relative rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800 group">
                    <img src={imageDataUrl} alt="Upload preview" className="w-full h-72 object-cover" />
                    <button
                      onClick={reset}
                      className="absolute top-2 right-2 w-8 h-8 rounded-lg bg-black/50 backdrop-blur text-white flex items-center justify-center hover:bg-black/70 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    {showHeatmap && heatmapUrl && (
                      <img src={heatmapUrl} alt="AI heatmap" className="absolute inset-0 w-full h-full mix-blend-multiply pointer-events-none animate-fade-in" />
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5" /> {fileName}
                  </p>
                  <div className="flex gap-2">
                    <Button onClick={handlePredict} disabled={predicting} className="flex-1">
                      {predicting ? <><Spinner className="w-4 h-4" /> {t('predict.analyzing')}</> : <><Zap className="w-4 h-4" /> {t('predict.runRecognition')}</>}
                    </Button>
                    <Button variant="outline" onClick={reset}>
                      <X className="w-4 h-4" /> {t('predict.clear')}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Explainable AI */}
          {result && (
            <Card className="mt-4">
              <CardHeader title={t('predict.xaiTitle')} subtitle={t('predict.xaiSubtitle')} action={
                <button
                  onClick={() => setShowHeatmap((v) => !v)}
                  className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg transition-colors ${showHeatmap ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                >
                  <Flame className="w-4 h-4" /> {showHeatmap ? t('predict.hideHeatmap') : t('predict.showHeatmap')}
                </button>
              } />
              <div className="p-5 pt-3">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-accent-50 dark:bg-accent-900/20 border border-accent-100 dark:border-accent-900/30">
                  <Eye className="w-5 h-5 text-accent-600 dark:text-accent-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-accent-800 dark:text-accent-300">
                    {t('predict.xaiNote')}
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Results panel */}
        <div>
          <Card>
            <CardHeader title={t('predict.resultsTitle')} subtitle={t('predict.resultsSubtitle')} />
            <div className="p-5 pt-3">
              {!result && !predicting && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                    <ScanLine className="w-7 h-7 text-gray-400" />
                  </div>
                  <p className="font-medium text-sm">{t('predict.noPrediction')}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-xs">{t('predict.noPredictionDesc')}</p>
                </div>
              )}

              {predicting && (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="relative w-20 h-20 mb-4">
                    <div className="absolute inset-0 rounded-full border-4 border-primary-100 dark:border-primary-900" />
                    <div className="absolute inset-0 rounded-full border-4 border-primary-600 border-t-transparent animate-spin" />
                    <Sparkles className="absolute inset-0 m-auto w-7 h-7 text-primary-500 animate-pulse-soft" />
                  </div>
                  <p className="font-medium text-sm">{t('predict.analyzing')}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('predict.analyzingDesc')}</p>
                </div>
              )}

              {result && (
                <div className="space-y-4 animate-slide-up">
                  {/* Primary result */}
                  <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-primary-600 to-primary-800 p-5 text-white">
                    <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, rgba(255,255,255,0.3) 0%, transparent 50%)' }} />
                    <div className="relative">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge color="green"><span className="capitalize">{result.species}</span></Badge>
                        <span className="text-xs text-primary-100 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {result.inference_ms}ms
                        </span>
                      </div>
                      <h2 className="font-display font-bold text-3xl">{result.breed}</h2>
                      <div className="flex items-center gap-2 mt-3">
                        <Award className="w-5 h-5" />
                        <span className="font-display font-bold text-2xl">{result.confidence}%</span>
                        <span className="text-sm text-primary-100">{t('predict.confidence')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Top-3 predictions */}
                  <div>
                    <p className="text-sm font-medium mb-2 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-primary-500" /> {t('predict.top3')}
                    </p>
                    <div className="space-y-2.5">
                      {result.top_predictions.map((p, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${i === 0 ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'}`}>
                            {i + 1}
                          </span>
                          <span className="text-sm font-medium w-24 truncate">{p.breed}</span>
                          <div className="flex-1"><ConfidenceBar value={p.confidence} /></div>
                          <span className="text-sm font-medium w-12 text-right">{p.confidence}%</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Save */}
                  <div className="flex gap-2 pt-2">
                    <Button onClick={handleSave} disabled={saving} className="flex-1">
                      {saving ? <><Spinner className="w-4 h-4" /> {t('form.saving')}</> : <><Database className="w-4 h-4" /> {t('predict.saveToHistory')}</>}
                    </Button>
                    <Button variant="outline" onClick={() => navigate('/app/animals')}>
                      {t('predict.createRecord')} <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
