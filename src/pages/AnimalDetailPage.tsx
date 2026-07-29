import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, PawPrint, MapPin, User2, Calendar, Weight, Tag,
  Syringe, Stethoscope, Plus, Trash2, X, Clock,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useI18n } from '@/context/I18nContext';
import { PageHeader } from '@/components/AppLayout';
import { Card, CardHeader, Button, Badge, Skeleton, EmptyState, Spinner } from '@/components/ui';
import type { Animal, Vaccination, MedicalRecord } from '@/types';

type Tab = 'vaccinations' | 'medical';

export function AnimalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { session } = useAuth();
  const { toast } = useToast();
  const { t } = useI18n();
  const navigate = useNavigate();

  const [animal, setAnimal] = useState<Animal | null>(null);
  const [vaccinations, setVaccinations] = useState<Vaccination[]>([]);
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('vaccinations');
  const [showVaccForm, setShowVaccForm] = useState(false);
  const [showMedForm, setShowMedForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{ type: 'vacc' | 'med'; id: string } | null>(null);

  const [vaccForm, setVaccForm] = useState({ vaccine_name: '', date_given: '', next_due: '', notes: '' });
  const [medForm, setMedForm] = useState({ condition: '', treatment: '', veterinarian: '', record_date: '', notes: '' });

  const fetchAll = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const [aRes, vRes, mRes] = await Promise.all([
      supabase.from('animals').select('*').eq('id', id).maybeSingle(),
      supabase.from('vaccinations').select('*').eq('animal_id', id).order('created_at', { ascending: false }),
      supabase.from('medical_records').select('*').eq('animal_id', id).order('created_at', { ascending: false }),
    ]);
    setAnimal(aRes.data as Animal | null);
    setVaccinations(vRes.data as Vaccination[] ?? []);
    setMedicalRecords(mRes.data as MedicalRecord[] ?? []);
    setLoading(false);
  }, [id]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleSaveVacc = async () => {
    if (!id || !session?.user) return;
    setSaving(true);
    const { error } = await supabase.from('vaccinations').insert({
      animal_id: id, user_id: session.user.id,
      vaccine_name: vaccForm.vaccine_name,
      date_given: vaccForm.date_given || null,
      next_due: vaccForm.next_due || null,
      notes: vaccForm.notes || null,
    });
    if (error) toast('Failed to add vaccination.', 'error');
    else { toast('Vaccination record added.', 'success'); setShowVaccForm(false); setVaccForm({ vaccine_name: '', date_given: '', next_due: '', notes: '' }); fetchAll(); }
    setSaving(false);
  };

  const handleSaveMed = async () => {
    if (!id || !session?.user) return;
    setSaving(true);
    const { error } = await supabase.from('medical_records').insert({
      animal_id: id, user_id: session.user.id,
      condition: medForm.condition || null,
      treatment: medForm.treatment || null,
      veterinarian: medForm.veterinarian || null,
      record_date: medForm.record_date || null,
      notes: medForm.notes || null,
    });
    if (error) toast('Failed to add medical record.', 'error');
    else { toast('Medical record added.', 'success'); setShowMedForm(false); setMedForm({ condition: '', treatment: '', veterinarian: '', record_date: '', notes: '' }); fetchAll(); }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    const table = confirmDelete.type === 'vacc' ? 'vaccinations' : 'medical_records';
    const { error } = await supabase.from(table).delete().eq('id', confirmDelete.id);
    if (error) toast('Failed to delete record.', 'error');
    else { toast('Record deleted.', 'success'); fetchAll(); }
    setConfirmDelete(null);
  };

  if (loading) {
    return (
      <div>
        <Skeleton className="h-8 w-64 mb-6" />
        <div className="grid lg:grid-cols-3 gap-4">
          <Skeleton className="h-48 rounded-2xl" />
          <Skeleton className="h-48 rounded-2xl lg:col-span-2" />
        </div>
      </div>
    );
  }

  if (!animal) {
    return (
      <div>
        <PageHeader title="Animal Not Found" />
        <Card><EmptyState icon={<PawPrint className="w-7 h-7" />} title="Animal not found" description="This record may have been deleted." action={<Link to="/app/animals"><Button>Back to Records</Button></Link>} /></Card>
      </div>
    );
  }

  return (
    <div>
      <button onClick={() => navigate('/app/animals')} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary-600 mb-4 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Records
      </button>

      <PageHeader
        title={animal.breed || 'Unknown breed'}
        subtitle={`Animal profile · ${animal.owner_name}`}
        action={
          <div className="flex gap-2">
            <Badge color={animal.species === 'buffalo' ? 'blue' : 'green'}>{animal.species}</Badge>
            {animal.gender && <Badge color="gray">{animal.gender}</Badge>}
            {animal.animal_id_tag && <Badge color="amber"><Tag className="w-3 h-3" /> {animal.animal_id_tag}</Badge>}
          </div>
        }
      />

      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        {/* Profile card */}
        <Card className="lg:col-span-1">
          <CardHeader title="Profile" />
          <div className="p-5 pt-3 space-y-3">
            {animal.photo_url && <img src={animal.photo_url} alt="" className="w-full h-40 rounded-xl object-cover mb-2" />}
            <div className="space-y-2.5 text-sm">
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300"><User2 className="w-4 h-4 text-gray-400" /> {animal.owner_name}</div>
              {animal.age_years != null && <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300"><Calendar className="w-4 h-4 text-gray-400" /> {animal.age_years} {animal.age_years !== 1 ? 'yrs' : 'yr'}</div>}
              {animal.weight_kg != null && <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300"><Weight className="w-4 h-4 text-gray-400" /> {animal.weight_kg} kg</div>}
              {(animal.village || animal.district || animal.state) && (
                <div className="flex items-start gap-2 text-gray-600 dark:text-gray-300"><MapPin className="w-4 h-4 text-gray-400 mt-0.5" /> {[animal.village, animal.district, animal.state].filter(Boolean).join(', ')}</div>
              )}
              {(animal.gps_lat != null && animal.gps_lng != null) && (
                <div className="text-xs text-gray-400 font-mono">GPS: {animal.gps_lat.toFixed(4)}, {animal.gps_lng.toFixed(4)}</div>
              )}
            </div>
            {animal.vaccination_notes && (
              <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                <p className="text-xs font-medium text-gray-500 mb-1">Vaccination Notes</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">{animal.vaccination_notes}</p>
              </div>
            )}
            {animal.medical_notes && (
              <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                <p className="text-xs font-medium text-gray-500 mb-1">Medical Notes</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">{animal.medical_notes}</p>
              </div>
            )}
          </div>
        </Card>

        {/* Records tabs */}
        <div className="lg:col-span-2">
          <Card>
            <div className="flex items-center gap-2 p-4 border-b border-gray-100 dark:border-gray-800">
              <button
                onClick={() => setTab('vaccinations')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${tab === 'vaccinations' ? 'bg-primary-600 text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
              >
                <Syringe className="w-4 h-4" /> Vaccinations
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${tab === 'vaccinations' ? 'bg-white/20' : 'bg-gray-100 dark:bg-gray-800'}`}>{vaccinations.length}</span>
              </button>
              <button
                onClick={() => setTab('medical')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${tab === 'medical' ? 'bg-primary-600 text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
              >
                <Stethoscope className="w-4 h-4" /> Medical Records
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${tab === 'medical' ? 'bg-white/20' : 'bg-gray-100 dark:bg-gray-800'}`}>{medicalRecords.length}</span>
              </button>
              <Button size="sm" className="ml-auto" onClick={() => tab === 'vaccinations' ? setShowVaccForm(true) : setShowMedForm(true)}>
                <Plus className="w-4 h-4" /> Add
              </Button>
            </div>

            <div className="p-4">
              {tab === 'vaccinations' ? (
                vaccinations.length === 0 ? (
                  <EmptyState icon={<Syringe className="w-7 h-7" />} title="No vaccinations recorded" description="Add the first vaccination record for this animal." action={<Button size="sm" onClick={() => setShowVaccForm(true)}><Plus className="w-4 h-4" /> Add Vaccination</Button>} />
                ) : (
                  <div className="space-y-2">
                    {vaccinations.map((v) => (
                      <div key={v.id} className="flex items-start gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-800 group">
                        <div className="w-9 h-9 rounded-lg bg-success-50 dark:bg-success-900/20 flex items-center justify-center shrink-0">
                          <Syringe className="w-4 h-4 text-success-600 dark:text-success-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{v.vaccine_name}</p>
                          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 dark:text-gray-400">
                            {v.date_given && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {v.date_given}</span>}
                            {v.next_due && <span className="flex items-center gap-1 text-warning-600 dark:text-warning-400"><Clock className="w-3 h-3" /> Due: {v.next_due}</span>}
                          </div>
                          {v.notes && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{v.notes}</p>}
                        </div>
                        {confirmDelete?.id === v.id ? (
                          <div className="flex gap-1">
                            <Button size="sm" variant="danger" onClick={handleDelete}>Delete</Button>
                            <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(null)}>Cancel</Button>
                          </div>
                        ) : (
                          <button onClick={() => setConfirmDelete({ type: 'vacc', id: v.id })} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-error-600 hover:bg-error-50 dark:hover:bg-error-900/20 transition-colors opacity-0 group-hover:opacity-100">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )
              ) : (
                medicalRecords.length === 0 ? (
                  <EmptyState icon={<Stethoscope className="w-7 h-7" />} title="No medical records" description="Add the first medical record for this animal." action={<Button size="sm" onClick={() => setShowMedForm(true)}><Plus className="w-4 h-4" /> Add Record</Button>} />
                ) : (
                  <div className="space-y-2">
                    {medicalRecords.map((m) => (
                      <div key={m.id} className="flex items-start gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-800 group">
                        <div className="w-9 h-9 rounded-lg bg-accent-50 dark:bg-accent-900/20 flex items-center justify-center shrink-0">
                          <Stethoscope className="w-4 h-4 text-accent-600 dark:text-accent-400" />
                        </div>
                        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm">{m.condition || 'Condition'}</p>
                          {m.treatment && <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5">Treatment: {m.treatment}</p>}
                          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 dark:text-gray-400">
                            {m.record_date && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {m.record_date}</span>}
                            {m.veterinarian && <span className="flex items-center gap-1"><User2 className="w-3 h-3" /> {m.veterinarian}</span>}
                          </div>
                          {m.notes && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{m.notes}</p>}
                        </div>
                        {confirmDelete?.id === m.id ? (
                          <div className="flex gap-1">
                            <Button size="sm" variant="danger" onClick={handleDelete}>Delete</Button>
                            <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(null)}>Cancel</Button>
                          </div>
                        ) : (
                          <button onClick={() => setConfirmDelete({ type: 'med', id: m.id })} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-error-600 hover:bg-error-50 dark:hover:bg-error-900/20 transition-colors opacity-0 group-hover:opacity-100">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Vaccination form modal */}
      {showVaccForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md card shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
              <h2 className="font-display font-bold text-lg flex items-center gap-2"><Syringe className="w-5 h-5 text-primary-500" /> Add Vaccination</h2>
              <button onClick={() => setShowVaccForm(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Vaccine Name <span className="text-error-500">*</span></label>
                <input required value={vaccForm.vaccine_name} onChange={(e) => setVaccForm((f) => ({ ...f, vaccine_name: e.target.value }))} placeholder="Foot & Mouth Disease" className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#0f1714] border border-gray-200 dark:border-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/40" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Date Given</label>
                  <input type="date" value={vaccForm.date_given} onChange={(e) => setVaccForm((f) => ({ ...f, date_given: e.target.value }))} className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#0f1714] border border-gray-200 dark:border-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/40" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Next Due</label>
                  <input type="date" value={vaccForm.next_due} onChange={(e) => setVaccForm((f) => ({ ...f, next_due: e.target.value }))} className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#0f1714] border border-gray-200 dark:border-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/40" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Notes</label>
                <textarea rows={2} value={vaccForm.notes} onChange={(e) => setVaccForm((f) => ({ ...f, notes: e.target.value }))} className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#0f1714] border border-gray-200 dark:border-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/40 resize-none" />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSaveVacc} disabled={saving || !vaccForm.vaccine_name} className="flex-1">{saving ? <><Spinner className="w-4 h-4" /> Saving…</> : 'Save'}</Button>
                <Button variant="outline" onClick={() => setShowVaccForm(false)}>Cancel</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Medical record form modal */}
      {showMedForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md card shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
              <h2 className="font-display font-bold text-lg flex items-center gap-2"><Stethoscope className="w-5 h-5 text-primary-500" /> Add Medical Record</h2>
              <button onClick={() => setShowMedForm(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Condition <span className="text-error-500">*</span></label>
                <input required value={medForm.condition} onChange={(e) => setMedForm((f) => ({ ...f, condition: e.target.value }))} placeholder="Mastitis" className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#0f1714] border border-gray-200 dark:border-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/40" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Treatment</label>
                <input value={medForm.treatment} onChange={(e) => setMedForm((f) => ({ ...f, treatment: e.target.value }))} placeholder="Antibiotics course" className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#0f1714] border border-gray-200 dark:border-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/40" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Veterinarian</label>
                  <input value={medForm.veterinarian} onChange={(e) => setMedForm((f) => ({ ...f, veterinarian: e.target.value }))} placeholder="Dr. Sharma" className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#0f1714] border border-gray-200 dark:border-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/40" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Date</label>
                  <input type="date" value={medForm.record_date} onChange={(e) => setMedForm((f) => ({ ...f, record_date: e.target.value }))} className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#0f1714] border border-gray-200 dark:border-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/40" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Notes</label>
                <textarea rows={2} value={medForm.notes} onChange={(e) => setMedForm((f) => ({ ...f, notes: e.target.value }))} className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#0f1714] border border-gray-200 dark:border-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/40 resize-none" />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSaveMed} disabled={saving || !medForm.condition} className="flex-1">{saving ? <><Spinner className="w-4 h-4" /> Saving…</> : 'Save'}</Button>
                <Button variant="outline" onClick={() => setShowMedForm(false)}>Cancel</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
