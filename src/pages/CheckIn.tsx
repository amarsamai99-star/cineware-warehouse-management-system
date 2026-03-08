import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Package, 
  ArrowDownLeft, 
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Scan,
  X,
  Check,
  ShieldCheck,
  User
} from 'lucide-react';
import { Equipment, CheckoutReport, CheckoutItem, Staff } from '../types';

export default function CheckIn() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const reportIdParam = searchParams.get('reportId');
  const equipmentIdParam = searchParams.get('id');

  const [report, setReport] = useState<CheckoutReport | null>(null);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [selectedStaff, setSelectedStaff] = useState('system');
  const [itemsToReturn, setItemsToReturn] = useState<Record<string, { condition: string, selected: boolean }>>({});
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);

  const [manualCode, setManualCode] = useState('');
  const [lookupError, setLookupError] = useState('');

  useEffect(() => {
    fetch('/api/staff').then(res => res.json()).then(setStaff);
    
    if (reportIdParam) {
      fetchReport(reportIdParam);
    } else if (equipmentIdParam) {
      fetchReportByEquipment(equipmentIdParam);
    }
  }, [reportIdParam, equipmentIdParam]);

  const fetchReport = async (id: string) => {
    setLoading(true);
    setLookupError('');
    try {
      const res = await fetch(`/api/checkout-reports/${encodeURIComponent(id)}`);
      if (res.ok) {
        const data: CheckoutReport = await res.json();
        processReportData(data);
      } else {
        setLookupError('Checkout Report not found. Please check the ID or barcode.');
      }
    } catch (err) {
      setLookupError('Failed to fetch report data.');
    } finally {
      setLoading(false);
    }
  };

  const fetchReportByEquipment = async (equipmentId: string) => {
    setLoading(true);
    setLookupError('');
    try {
      const res = await fetch(`/api/checkout-reports/equipment/${encodeURIComponent(equipmentId)}`);
      if (res.ok) {
        const data: CheckoutReport = await res.json();
        processReportData(data);
      } else {
        setLookupError('No active rental found for this equipment.');
      }
    } catch (err) {
      setLookupError('Failed to fetch report data.');
    } finally {
      setLoading(false);
    }
  };

  const processReportData = (data: CheckoutReport) => {
    if (data) {
      setReport(data);
      // Initialize items to return
      const initialItems: Record<string, { condition: string, selected: boolean }> = {};
      data.items?.forEach(item => {
        if (!item.returned_at) {
          initialItems[item.equipment_id] = { 
            condition: item.condition_at_checkout, 
            selected: true 
          };
        }
      });
      setItemsToReturn(initialItems);
      if (!reportIdParam && !equipmentIdParam) {
        navigate(`/checkin?reportId=${data.id}`, { replace: true });
      }
    }
  };

  const handleManualLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    const inputCode = manualCode.trim();
    if (!inputCode) return;

    setLoading(true);
    setLookupError('');
    try {
      // Normalize input: uppercase for consistency with generated IDs
      const code = inputCode.toUpperCase();
      
      // 1. Try as direct Report ID
      let res = await fetch(`/api/checkout-reports/${encodeURIComponent(code)}`);
      if (res.ok) {
        const data = await res.json();
        processReportData(data);
        return;
      }

      // 2. If not found, try as Equipment ID (to find its active report)
      res = await fetch(`/api/checkout-reports/equipment/${encodeURIComponent(code)}`);
      if (res.ok) {
        const data = await res.json();
        processReportData(data);
        return;
      }

      // 3. Try adding REP- prefix if missing
      if (!code.startsWith('REP-')) {
        const prefixed = `REP-${code}`;
        res = await fetch(`/api/checkout-reports/${encodeURIComponent(prefixed)}`);
        if (res.ok) {
          const data = await res.json();
          processReportData(data);
          return;
        }
      }

      // 4. Try the original input just in case it was lowercase in DB (unlikely but safe)
      if (code !== inputCode) {
        res = await fetch(`/api/checkout-reports/${encodeURIComponent(inputCode)}`);
        if (res.ok) {
          const data = await res.json();
          processReportData(data);
          return;
        }
      }

      setLookupError('Checkout Report not found. Please check the ID or barcode.');
    } catch (err) {
      setLookupError('Failed to fetch report data.');
    } finally {
      setLoading(false);
    }
  };

  const toggleItemSelection = (id: string) => {
    setItemsToReturn(prev => ({
      ...prev,
      [id]: { ...prev[id], selected: !prev[id].selected }
    }));
  };

  const updateItemCondition = (id: string, condition: string) => {
    setItemsToReturn(prev => ({
      ...prev,
      [id]: { ...prev[id], condition }
    }));
  };

  const handleComplete = async () => {
    if (!report || !selectedStaff) return;
    
    const selectedItems = (Object.entries(itemsToReturn) as [string, { condition: string, selected: boolean }][])
      .filter(([_, val]) => val.selected)
      .map(([id, val]) => ({
        equipment_id: id,
        condition_at_checkin: val.condition
      }));

    if (selectedItems.length === 0) {
      alert("Please select at least one item to check in.");
      return;
    }

    setSubmitting(true);

    const response = await fetch(`/api/checkin-reports/${report.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: selectedItems,
        technician_id: selectedStaff, // The staff member receiving the gear
        notes: notes
      })
    });

    if (response.ok) {
      setCompleted(true);
    }
    setSubmitting(false);
  };

  const missingItemsCount = report?.items?.filter(item => !item.returned_at && !itemsToReturn[item.equipment_id]?.selected).length || 0;

  if (!report) {
    return (
      <div className="max-w-2xl mx-auto space-y-8 py-10">
        <header className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 mb-2 italic serif">Process Return</h1>
          <p className="text-zinc-500 font-medium">Scan the Report ID barcode or enter it manually.</p>
        </header>

        <div className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-xl space-y-6">
          <form onSubmit={handleManualLookup} className="space-y-4">
            <label className="text-xs font-black uppercase tracking-widest text-zinc-400">Report ID (e.g. REP-XXXXXX)</label>
            <div className="flex gap-2">
              <input 
                type="text" 
                autoFocus
                placeholder="REP-" 
                className="flex-1 px-4 py-4 bg-zinc-50 border-none rounded-2xl focus:ring-2 focus:ring-zinc-900 text-lg font-mono"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
              />
              <button 
                type="submit"
                disabled={loading}
                className="bg-zinc-900 text-white px-8 py-4 rounded-2xl font-bold hover:bg-zinc-800 transition-all disabled:opacity-50"
              >
                {loading ? 'Searching...' : 'Find Report'}
              </button>
            </div>
          </form>

          {lookupError && (
            <div className="bg-red-50 text-red-600 p-4 rounded-2xl flex items-center gap-3 border border-red-100 animate-in fade-in slide-in-from-top-2">
              <AlertCircle size={20} />
              <p className="font-bold text-sm">{lookupError}</p>
            </div>
          )}

          <div className="pt-4 border-t border-zinc-100 flex items-center justify-between">
            <p className="text-sm text-zinc-400">Prefer scanning?</p>
            <button 
              onClick={() => navigate('/scan')}
              className="text-zinc-900 font-bold flex items-center gap-2 hover:underline"
            >
              <Scan size={18} />
              Open Camera Scanner
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (completed) {
    return (
      <div className="max-w-4xl mx-auto bg-white p-16 rounded-3xl border border-zinc-200 shadow-2xl text-center space-y-8 animate-in fade-in zoom-in-95">
        <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 size={48} />
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-bold">Return Processed</h2>
          <p className="text-zinc-500 text-lg">Selected items have been returned to inventory.</p>
          {missingItemsCount > 0 && (
            <p className="text-amber-600 font-bold mt-4 flex items-center justify-center gap-2">
              <AlertCircle size={20} />
              Warning: {missingItemsCount} items are still missing from this report.
            </p>
          )}
        </div>
        <div className="pt-8 flex flex-col md:flex-row gap-4 justify-center">
          <button 
            onClick={() => navigate('/scan')}
            className="bg-zinc-900 text-white px-10 py-4 rounded-2xl font-bold hover:bg-zinc-800 transition-all"
          >
            Scan Next Report
          </button>
          <button 
            onClick={() => navigate('/')}
            className="px-10 py-4 text-zinc-500 font-bold hover:text-zinc-900 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-10">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 italic serif">Process Return</h1>
          <p className="text-zinc-500 font-medium">Report: <span className="text-zinc-900 font-mono">{report.id}</span> • Project: <span className="text-zinc-900">{report.project_name}</span></p>
        </div>
        <div className="bg-zinc-100 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest text-zinc-500">
          Status: {report.status}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
              <h3 className="font-bold flex items-center gap-2">
                <Package size={20} className="text-zinc-400" />
                Equipment in Report
              </h3>
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                {report.items?.filter(i => !i.returned_at).length} Items Pending
              </span>
            </div>
            
            <div className="divide-y divide-zinc-50">
              {report.items?.map((item) => {
                const isReturned = !!item.returned_at;
                const isSelected = itemsToReturn[item.equipment_id]?.selected;
                
                return (
                  <div key={item.id} className={cn(
                    "p-6 flex flex-col md:flex-row md:items-center gap-6 transition-colors",
                    isReturned ? "bg-zinc-50 opacity-60" : isSelected ? "bg-emerald-50/30" : "hover:bg-zinc-50"
                  )}>
                    <div className="flex items-center gap-4 flex-1">
                      <button 
                        disabled={isReturned}
                        onClick={() => toggleItemSelection(item.equipment_id)}
                        className={cn(
                          "w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all",
                          isReturned ? "bg-zinc-200 border-zinc-200 text-zinc-400" :
                          isSelected ? "bg-emerald-600 border-emerald-600 text-white" : "border-zinc-200 bg-white"
                        )}
                      >
                        {isReturned || isSelected ? <Check size={14} strokeWidth={3} /> : null}
                      </button>
                      
                      <div className="min-w-0">
                        <p className="font-bold text-zinc-900 truncate">{item.equipment_name}</p>
                        <p className="text-xs text-zinc-500 font-mono">{item.barcode}</p>
                      </div>
                    </div>

                    {!isReturned && (
                      <div className="flex flex-col gap-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Return Condition</p>
                        <div className="flex gap-1">
                          {['New', 'Good', 'Needs Repair', 'Broken'].map((c) => (
                            <button
                              key={c}
                              disabled={!isSelected}
                              onClick={() => updateItemCondition(item.equipment_id, c)}
                              className={cn(
                                "px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border",
                                itemsToReturn[item.equipment_id]?.condition === c 
                                  ? "bg-zinc-900 border-zinc-900 text-white" 
                                  : "bg-white border-zinc-100 text-zinc-500 hover:border-zinc-300 disabled:opacity-30"
                              )}
                            >
                              {c}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {isReturned && (
                      <div className="text-right">
                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">Returned</span>
                        <p className="text-[10px] text-zinc-400 mt-1">{new Date(item.returned_at!).toLocaleDateString()}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm space-y-6">
            <h3 className="font-bold text-lg">Return Summary</h3>
            
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Items Selected</span>
                <span className="font-bold">{(Object.values(itemsToReturn) as { selected: boolean }[]).filter(v => v.selected).length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Remaining in Report</span>
                <span className="font-bold text-amber-600">{missingItemsCount}</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-bold text-zinc-400 uppercase tracking-widest">
                <ShieldCheck size={14} />
                Warehouse Staff (Receiving)
              </label>
              <select 
                className="w-full px-3 py-3 bg-zinc-50 border-none rounded-xl focus:ring-2 focus:ring-zinc-900 text-sm font-medium"
                value={selectedStaff}
                onChange={e => setSelectedStaff(e.target.value)}
              >
                <option value="">Choose staff member...</option>
                {staff.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            {missingItemsCount > 0 && (
              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3">
                <AlertCircle className="text-amber-600 shrink-0" size={20} />
                <p className="text-xs text-amber-700 leading-relaxed font-medium">
                  You are not returning all items. This report will remain <span className="font-bold">Partial</span> until all gear is back.
                </p>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Technician Notes</label>
              <textarea 
                className="w-full px-4 py-4 bg-zinc-50 border-none rounded-2xl focus:ring-2 focus:ring-zinc-900 min-h-[100px] text-sm"
                placeholder="Note any issues with this batch..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
            </div>

            <button 
              disabled={submitting || (Object.values(itemsToReturn) as { selected: boolean }[]).filter(v => v.selected).length === 0}
              onClick={handleComplete}
              className="w-full bg-emerald-600 text-white py-5 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/10 disabled:opacity-50"
            >
              {submitting ? 'Processing...' : 'Complete Check-In'}
              <ArrowDownLeft size={20} />
            </button>
            
            <button 
              onClick={() => navigate('/scan')}
              className="w-full py-2 text-zinc-400 font-bold hover:text-zinc-900 text-sm transition-colors"
            >
              Cancel and Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}
