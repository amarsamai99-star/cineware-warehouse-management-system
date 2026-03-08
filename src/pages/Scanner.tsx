import React, { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { 
  Scan, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Package, 
  Info,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Equipment } from '../types';
import { useNavigate } from 'react-router-dom';

export default function Scanner() {
  const [scannedItem, setScannedItem] = useState<Equipment | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const navigate = useNavigate();

  const [manualCode, setManualCode] = useState('');

  useEffect(() => {
    scannerRef.current = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      /* verbose= */ false
    );

    scannerRef.current.render(onScanSuccess, onScanFailure);

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(error => {
          console.error("Failed to clear html5QrcodeScanner. ", error);
        });
      }
    };
  }, []);

  async function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!manualCode.trim()) return;
    await onScanSuccess(manualCode.trim());
    setManualCode('');
  }

  async function onScanSuccess(decodedText: string) {
    if (loading) return;
    setLoading(true);
    setError(null);
    
    // Check if it's a Report ID
    if (decodedText.startsWith('REP-')) {
      navigate(`/checkin?reportId=${encodeURIComponent(decodedText)}`);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/equipment/lookup/${encodeURIComponent(decodedText)}`);
      if (response.ok) {
        const item = await response.json();
        setScannedItem(item);
      } else {
        setError("Equipment not found in database.");
      }
    } catch (err) {
      setError("Failed to fetch equipment data.");
    } finally {
      setLoading(false);
    }
  }

  function onScanFailure(error: any) {
    // console.warn(`Code scan error = ${error}`);
  }

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      <header className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-zinc-900 mb-2 italic serif">Equipment Scanner</h1>
        <p className="text-zinc-500 font-medium">Scan a barcode or QR code to view details and process actions.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-xl overflow-hidden">
            <div id="reader" className="overflow-hidden rounded-2xl border-4 border-zinc-100"></div>
            <div className="mt-6 flex items-center justify-center gap-4 text-zinc-400">
              <Scan size={20} />
              <span className="text-sm font-bold uppercase tracking-widest">Scanner Active</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm">
            <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-4">Manual Entry</h3>
            <form onSubmit={handleManualSubmit} className="flex gap-2">
              <input 
                type="text" 
                placeholder="Enter Barcode or ID..." 
                className="flex-1 px-4 py-3 bg-zinc-50 border-none rounded-xl focus:ring-2 focus:ring-zinc-900 transition-all font-mono"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
              />
              <button 
                type="submit"
                disabled={loading}
                className="bg-zinc-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-zinc-800 transition-all disabled:opacity-50"
              >
                Find
              </button>
            </form>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-2xl flex items-center gap-3 border border-red-100">
              <AlertCircle size={20} />
              <p className="font-bold text-sm">{error}</p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          {scannedItem ? (
            <div className="bg-white rounded-3xl border border-zinc-200 shadow-xl overflow-hidden animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="p-8 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center">
                    <Package className="text-white" size={20} />
                  </div>
                  <h2 className="text-xl font-bold">Item Details</h2>
                </div>
                <span className={cn(
                  "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                  scannedItem.status === 'Available' ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"
                )}>
                  {scannedItem.status}
                </span>
              </div>
              
              <div className="p-8 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">Name</p>
                    <p className="font-bold text-lg">{scannedItem.name}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">Category</p>
                    <p className="font-bold text-lg">{scannedItem.category}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">Serial</p>
                    <p className="font-mono text-sm">{scannedItem.serial_number}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">Condition</p>
                    <p className="font-bold">{scannedItem.condition}</p>
                  </div>
                </div>

                <div className="pt-6 border-t border-zinc-100 flex flex-col gap-3">
                  {scannedItem.status === 'Available' ? (
                    <button 
                      onClick={() => navigate(`/checkout?id=${scannedItem.id}`)}
                      className="w-full bg-zinc-900 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-zinc-800 transition-all shadow-lg shadow-zinc-900/10"
                    >
                      <ArrowUpRight size={20} />
                      Proceed to Check-Out
                    </button>
                  ) : (
                    <button 
                      onClick={() => navigate(`/checkin?id=${scannedItem.id}`)}
                      className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/10"
                    >
                      <ArrowDownLeft size={20} />
                      Process Return (Check-In)
                    </button>
                  )}
                  <button 
                    onClick={() => setScannedItem(null)}
                    className="w-full py-4 text-zinc-400 font-bold hover:text-zinc-900 transition-colors"
                  >
                    Clear and Scan Next
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full bg-zinc-50 border-2 border-dashed border-zinc-200 rounded-3xl flex flex-col items-center justify-center p-10 text-center">
              <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-6">
                <Info className="text-zinc-300" size={32} />
              </div>
              <h3 className="text-lg font-bold text-zinc-900 mb-2">No Item Scanned</h3>
              <p className="text-zinc-500 max-w-xs">
                Position the equipment's barcode or QR code within the scanner frame to load details.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}
