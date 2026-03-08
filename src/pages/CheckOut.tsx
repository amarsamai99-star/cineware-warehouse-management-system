import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Package, 
  User, 
  Users, 
  PenTool, 
  CheckCircle2,
  ChevronRight,
  ArrowUpRight,
  X,
  AlertCircle,
  Scan,
  FileText,
  Download,
  ShieldCheck
} from 'lucide-react';
import { Equipment, Customer, Staff } from '../types';
import SignatureCanvas from 'react-signature-canvas';
import { generateCheckoutPDF } from '../utils/pdfGenerator';

export default function CheckOut() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialId = searchParams.get('id');

  const [cart, setCart] = useState<Equipment[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [settings, setSettings] = useState<any>(null);
  
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [selectedStaff, setSelectedStaff] = useState('system'); // Default to system or first staff
  const [selectedTechnician, setSelectedTechnician] = useState('');
  const [projectName, setProjectName] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(1);
  const [reportId] = useState(() => `REP-${Math.random().toString(36).substr(2, 6).toUpperCase()}`);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sigPad = useRef<SignatureCanvas>(null);
  const barcodeCanvasRef = useRef<HTMLCanvasElement>(null);

  const [manualCode, setManualCode] = useState('');
  const [lookupError, setLookupError] = useState('');

  useEffect(() => {
    if (initialId) {
      fetchEquipment(initialId);
    }

    fetch('/api/customers').then(res => res.json()).then(setCustomers);
    fetch('/api/staff').then(res => res.json()).then(setStaff);
    fetch('/api/settings').then(res => res.json()).then(setSettings);
  }, [initialId]);

  const fetchEquipment = async (id: string) => {
    if (cart.find(item => item.id === id || item.barcode === id)) {
      setLookupError('Item already in list.');
      return;
    }

    setLoading(true);
    setLookupError('');
    try {
      const res = await fetch(`/api/equipment/lookup/${encodeURIComponent(id)}`);
      if (res.ok) {
        const item = await res.json();
        if (item.status === 'Available') {
          // Check if it's a kit
          const kitRes = await fetch(`/api/equipment/${item.id}/components`);
          if (kitRes.ok) {
            const components = await kitRes.json();
            if (components.length > 0) {
              // Add kit and its components
              const toAdd = [item, ...components.filter((c: any) => !cart.find(ex => ex.id === c.id))];
              setCart(prev => [...prev, ...toAdd]);
            } else {
              setCart(prev => [...prev, item]);
            }
          } else {
            setCart(prev => [...prev, item]);
          }
          setManualCode('');
        } else {
          setLookupError(`Equipment is currently ${item.status}. It must be Available to check out.`);
        }
      } else {
        setLookupError('Equipment not found. Please check the ID or barcode.');
      }
    } catch (err) {
      setLookupError('Failed to fetch equipment data.');
    } finally {
      setLoading(false);
    }
  };

  const handleManualLookup = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      fetchEquipment(manualCode.trim());
    }
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const generatePDF = () => {
    if (!settings) return;
    
    const customer = customers.find(c => c.id === selectedCustomer);
    const warehouseStaff = staff.find(s => s.id === selectedStaff);
    const technician = staff.find(s => s.id === selectedTechnician);

    generateCheckoutPDF({
      reportId,
      projectName,
      customerName: customer?.name || 'N/A',
      staffName: warehouseStaff?.name || 'N/A',
      technicianName: technician?.name || 'N/A',
      notes,
      items: cart.map(item => ({
        name: item.name,
        brand: item.brand,
        model: item.model,
        barcode: item.barcode,
        condition: item.condition
      })),
      signatureData: signatureData || undefined,
      settings
    });
  };

  const handleComplete = async () => {
    if (cart.length === 0 || !selectedCustomer || !selectedTechnician || !selectedStaff) {
      setError('Please ensure all fields are filled and items are added.');
      return;
    }
    
    setSubmitting(true);
    setError(null);
    
    try {
      const signature = sigPad.current?.toDataURL();
      setSignatureData(signature || null);

      const payload = {
        id: reportId,
        customer_id: selectedCustomer,
        staff_id: selectedStaff,
        technician_id: selectedTechnician,
        project_name: projectName,
        notes: notes,
        items: cart.map(item => ({
          id: item.id,
          condition: item.condition
        }))
      };

      const response = await fetch('/api/checkout-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setStep(3);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to complete check-out. Please try again.');
      }
    } catch (err) {
      setError('A network error occurred. Please check your connection.');
      console.error('Checkout error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (cart.length === 0 && step === 1) {
    return (
      <div className="max-w-2xl mx-auto space-y-8 py-10">
        <header className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 mb-2 italic serif">Check-Out Equipment</h1>
          <p className="text-zinc-500 font-medium">Add items to your list to start the check-out process.</p>
        </header>

        <div className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-xl space-y-6">
          <form onSubmit={handleManualLookup} className="space-y-4">
            <label className="text-xs font-black uppercase tracking-widest text-zinc-400">Equipment ID / Barcode</label>
            <div className="flex gap-2">
              <input 
                type="text" 
                autoFocus
                placeholder="e.g. CAM001" 
                className="flex-1 px-4 py-4 bg-zinc-50 border-none rounded-2xl focus:ring-2 focus:ring-zinc-900 text-lg font-mono"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
              />
              <button 
                type="submit"
                disabled={loading}
                className="bg-zinc-900 text-white px-8 py-4 rounded-2xl font-bold hover:bg-zinc-800 transition-all disabled:opacity-50"
              >
                {loading ? 'Searching...' : 'Add'}
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

  return (
    <div className="max-w-4xl mx-auto">
      <header className="mb-10">
        <div className="flex items-center gap-4 mb-4">
          <div className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all",
            step >= 1 ? "bg-zinc-900 text-white" : "bg-zinc-200 text-zinc-500"
          )}>1</div>
          <div className="h-px flex-1 bg-zinc-200"></div>
          <div className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all",
            step >= 2 ? "bg-zinc-900 text-white" : "bg-zinc-200 text-zinc-500"
          )}>2</div>
          <div className="h-px flex-1 bg-zinc-200"></div>
          <div className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all",
            step >= 3 ? "bg-emerald-600 text-white" : "bg-zinc-200 text-zinc-500"
          )}><CheckCircle2 size={20} /></div>
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-zinc-900 italic serif">
          {step === 1 ? 'Check-Out Details' : step === 2 ? 'Confirmation & Signature' : 'Check-Out Complete'}
        </h1>
      </header>

      {step === 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">Gear List ({cart.length})</h3>
              </div>
              
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                {cart.map(item => (
                  <div key={item.id} className="flex items-center gap-3 p-3 bg-zinc-50 rounded-2xl relative group">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-zinc-100">
                      <Package className="text-zinc-400" size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate">{item.name}</p>
                      <p className="text-[10px] text-zinc-500 font-mono">{item.barcode}</p>
                    </div>
                    <button 
                      onClick={() => removeFromCart(item.id)}
                      className="text-zinc-300 hover:text-red-500 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-6 border-t border-zinc-100 space-y-4">
                <form onSubmit={handleManualLookup} className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Add more..." 
                    className="flex-1 px-3 py-2 bg-zinc-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-zinc-900"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                  />
                  <button type="submit" className="bg-zinc-900 text-white p-2 rounded-xl">
                    <ChevronRight size={18} />
                  </button>
                </form>
                {lookupError && <p className="text-[10px] text-red-500 font-bold">{lookupError}</p>}
              </div>
            </div>

            <div className="bg-zinc-900 p-6 rounded-3xl text-white">
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Report ID</p>
              <p className="text-xl font-mono font-bold">{reportId}</p>
              <div className="mt-4 p-3 bg-zinc-800 rounded-xl flex items-center gap-3">
                <div className="w-8 h-8 bg-zinc-700 rounded-lg flex items-center justify-center">
                  <Scan size={16} />
                </div>
                <p className="text-xs text-zinc-400">This ID will be used for the return process.</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <label className="flex items-center gap-2 text-sm font-bold text-zinc-900">
                    <ShieldCheck size={18} className="text-zinc-400" />
                    Warehouse Staff (Logged-in)
                  </label>
                  <select 
                    className="w-full px-4 py-4 bg-zinc-50 border-none rounded-2xl focus:ring-2 focus:ring-zinc-900 text-lg font-medium"
                    value={selectedStaff}
                    onChange={e => setSelectedStaff(e.target.value)}
                  >
                    <option value="">Choose staff member...</option>
                    {staff.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.role})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-4">
                  <label className="flex items-center gap-2 text-sm font-bold text-zinc-900">
                    <User size={18} className="text-zinc-400" />
                    Technician (Receiver)
                  </label>
                  <select 
                    className="w-full px-4 py-4 bg-zinc-50 border-none rounded-2xl focus:ring-2 focus:ring-zinc-900 text-lg font-medium"
                    value={selectedTechnician}
                    onChange={e => setSelectedTechnician(e.target.value)}
                  >
                    <option value="">Choose a technician...</option>
                    {staff.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                <label className="flex items-center gap-2 text-sm font-bold text-zinc-900">
                  <Users size={18} className="text-zinc-400" />
                  Customer / Production
                </label>
                <select 
                  className="w-full px-4 py-4 bg-zinc-50 border-none rounded-2xl focus:ring-2 focus:ring-zinc-900 text-lg font-medium"
                  value={selectedCustomer}
                  onChange={e => setSelectedCustomer(e.target.value)}
                >
                  <option value="">Choose a customer...</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-4">
                <label className="text-sm font-bold text-zinc-900">Project Name</label>
                <input 
                  type="text"
                  className="w-full px-4 py-4 bg-zinc-50 border-none rounded-2xl focus:ring-2 focus:ring-zinc-900 text-lg font-medium"
                  placeholder="e.g. Summer Blockbuster 2026"
                  value={projectName}
                  onChange={e => setProjectName(e.target.value)}
                />
              </div>

              <div className="space-y-4">
                <label className="text-sm font-bold text-zinc-900">Notes</label>
                <textarea 
                  className="w-full px-4 py-4 bg-zinc-50 border-none rounded-2xl focus:ring-2 focus:ring-zinc-900 min-h-[100px]"
                  placeholder="Any specific setup notes..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                />
              </div>

              <button 
                disabled={!selectedCustomer || !selectedTechnician || !projectName || !selectedStaff || cart.length === 0}
                onClick={() => setStep(2)}
                className="w-full bg-zinc-900 text-white py-5 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-zinc-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue to Signature
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="bg-white p-10 rounded-3xl border border-zinc-200 shadow-xl space-y-10 animate-in fade-in zoom-in-95 duration-300">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold">Digital Acknowledgment</h2>
            <p className="text-zinc-500">Please sign below to confirm the equipment is in good condition.</p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-2xl flex items-center gap-3 border border-red-100">
              <AlertCircle size={20} />
              <p className="font-bold text-sm">{error}</p>
            </div>
          )}

          <div className="bg-zinc-50 rounded-3xl border-2 border-dashed border-zinc-200 p-4 relative">
            <SignatureCanvas 
              ref={sigPad}
              penColor='black'
              canvasProps={{className: 'w-full h-64 cursor-crosshair'}}
            />
            <button 
              onClick={() => sigPad.current?.clear()}
              className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-sm hover:bg-zinc-100 text-zinc-400 hover:text-zinc-900 transition-all"
            >
              <X size={20} />
            </button>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 text-zinc-300 pointer-events-none">
              <PenTool size={16} />
              <span className="text-xs font-bold uppercase tracking-widest">Sign Here</span>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            <button 
              onClick={() => setStep(1)}
              className="flex-1 py-5 text-zinc-500 font-bold hover:text-zinc-900 transition-colors"
            >
              Back to Details
            </button>
            <button 
              disabled={submitting}
              onClick={handleComplete}
              className="flex-[2] bg-zinc-900 text-white py-5 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-zinc-800 transition-all shadow-lg shadow-zinc-900/10"
            >
              {submitting ? 'Processing...' : 'Confirm Check-Out'}
              <ArrowUpRight size={20} />
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="bg-white p-16 rounded-3xl border border-zinc-200 shadow-2xl text-center space-y-8 animate-in fade-in zoom-in-95">
          <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 size={48} />
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-bold">Success!</h2>
            <p className="text-zinc-500 text-lg">Equipment has been successfully checked out.</p>
            <div className="mt-4 p-4 bg-zinc-50 rounded-2xl inline-block">
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">Checkout Report ID</p>
              <p className="text-2xl font-mono font-bold text-zinc-900">{reportId}</p>
            </div>
          </div>
          <div className="pt-8 flex flex-col md:flex-row gap-4 justify-center">
            <button 
              onClick={generatePDF}
              className="bg-emerald-600 text-white px-10 py-4 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/10"
            >
              <Download size={20} />
              Download PDF Report
            </button>
            <button 
              onClick={() => navigate('/scan')}
              className="bg-zinc-900 text-white px-10 py-4 rounded-2xl font-bold hover:bg-zinc-800 transition-all"
            >
              Scan Next Item
            </button>
            <button 
              onClick={() => navigate('/')}
              className="px-10 py-4 text-zinc-500 font-bold hover:text-zinc-900 transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}
