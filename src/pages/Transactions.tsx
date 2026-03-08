import React, { useState, useEffect } from 'react';
import { 
  History, 
  Search, 
  Filter, 
  ArrowUpRight, 
  ArrowDownLeft,
  Calendar,
  User,
  Download,
  ChevronRight,
  Package,
  Layers
} from 'lucide-react';
import { Transaction, CheckoutReport } from '../types';
import { format } from 'date-fns';
import { clsx } from 'clsx';
import { useNavigate } from 'react-router-dom';
import { generateCheckoutPDF } from '../utils/pdfGenerator';
import { generateInvoicePDF } from '../utils/invoiceGenerator';

type CombinedTransaction = {
  id: string;
  type: 'Report' | 'Item';
  action_type: 'Check-Out' | 'Check-In';
  timestamp: string;
  customer_name?: string;
  user_name?: string;
  technician_name?: string;
  equipment_name?: string;
  equipment_id?: string;
  item_count?: number;
  project_name?: string;
  condition_before?: string;
  condition_after?: string;
  notes?: string;
};

export default function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [reports, setReports] = useState<CheckoutReport[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tRes, rRes, sRes] = await Promise.all([
          fetch('/api/transactions'),
          fetch('/api/reports/active-rentals'),
          fetch('/api/settings')
        ]);
        
        const tData = await tRes.json();
        const rData = await rRes.json();
        const sData = await sRes.json();
        
        setTransactions(tData);
        setReports(rData);
        setSettings(sData);
      } catch (error) {
        console.error('Failed to fetch transactions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleDownload = async (reportId: string) => {
    try {
      const res = await fetch(`/api/checkout-reports/${reportId}`);
      if (res.ok) {
        const report = await res.json();
        generateCheckoutPDF({
          reportId: report.id,
          projectName: report.project_name,
          customerName: report.customer_name,
          staffName: report.staff_name,
          technicianName: report.technician_name,
          notes: report.notes,
          items: report.items.map((i: any) => ({
            name: i.equipment_name,
            brand: '', // Brand/Model might not be in the report items join, but we can add them if needed
            model: '',
            barcode: i.barcode,
            condition: i.condition_at_checkout
          })),
          settings
        });
      }
    } catch (err) {
      console.error('Failed to download report:', err);
    }
  };

  const handleInvoice = async (reportId: string) => {
    try {
      const res = await fetch(`/api/checkout-reports/${reportId}`);
      if (res.ok) {
        const report = await res.json();
        generateInvoicePDF({
          reportId: report.id,
          projectName: report.project_name,
          customerName: report.customer_name,
          date: format(new Date(report.timestamp), 'MMM d, yyyy'),
          items: report.items.map((i: any) => ({
            name: i.equipment_name,
            price: i.price_per_day || 0,
            quantity: 1
          })),
          settings
        });
      }
    } catch (err) {
      console.error('Failed to generate invoice:', err);
    }
  };

  // Combine and format data
  const combined: CombinedTransaction[] = [
    // Reports for Check-Outs
    ...reports.map(r => ({
      id: r.id,
      type: 'Report' as const,
      action_type: 'Check-Out' as const,
      timestamp: r.timestamp,
      customer_name: r.customer_name,
      technician_name: r.technician_name,
      item_count: r.total_items,
      project_name: r.project_name,
      notes: r.notes
    })),
    // Individual Check-Ins (since they might be partial)
    ...transactions.filter(t => t.action_type === 'Check-In').map(t => ({
      id: t.id,
      type: 'Item' as const,
      action_type: 'Check-In' as const,
      timestamp: t.timestamp,
      customer_name: t.customer_name,
      user_name: t.user_name,
      equipment_name: t.equipment_name,
      equipment_id: t.equipment_id,
      condition_before: t.condition_before,
      condition_after: t.condition_after,
      notes: t.notes
    }))
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const filtered = combined.filter(t => 
    t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.equipment_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.equipment_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.user_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.technician_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.project_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 mb-2 italic serif">Transaction Log</h1>
          <p className="text-zinc-500 font-medium">Complete history of equipment movements and rentals.</p>
        </div>
        <button className="bg-white text-zinc-900 border border-zinc-200 px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-zinc-50 transition-all">
          <Download size={20} />
          Export CSV
        </button>
      </header>

      <div className="flex flex-col md:flex-row gap-4 items-center bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
          <input 
            type="text" 
            placeholder="Search by report ID, equipment, customer, or project..." 
            className="w-full pl-12 pr-4 py-3 bg-zinc-50 border-none rounded-xl focus:ring-2 focus:ring-zinc-900 transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <button className="flex items-center gap-2 px-6 py-3 bg-zinc-50 text-zinc-600 rounded-xl font-bold hover:bg-zinc-100 transition-all">
          <Filter size={20} />
          Date Range
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-100">
                <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">Date & Time</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">Action</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">Reference / Item</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">Customer / Project</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">Staff / Tech</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {filtered.map((t) => (
                <tr key={t.id} className="hover:bg-zinc-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-zinc-600">
                      <Calendar size={14} className="text-zinc-400" />
                      <span className="text-sm font-medium">{format(new Date(t.timestamp), 'MMM d, yyyy')}</span>
                    </div>
                    <p className="text-xs text-zinc-400 ml-5">{format(new Date(t.timestamp), 'h:mm a')}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={clsx(
                      "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                      t.action_type === 'Check-Out' ? "bg-blue-50 text-blue-700" : "bg-emerald-50 text-emerald-700"
                    )}>
                      {t.action_type === 'Check-Out' ? <ArrowUpRight size={12} /> : <ArrowDownLeft size={12} />}
                      {t.action_type}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {t.type === 'Report' ? (
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                          <Layers size={16} />
                        </div>
                        <div>
                          <p className="font-bold text-zinc-900">{t.id}</p>
                          <p className="text-[10px] text-zinc-400 font-mono uppercase tracking-tighter">Report ID</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-zinc-50 text-zinc-400 rounded-lg flex items-center justify-center">
                          <Package size={16} />
                        </div>
                        <div>
                          <p className="font-bold text-zinc-900">{t.equipment_name}</p>
                          <p className="text-[10px] text-zinc-400 font-mono">{t.equipment_id}</p>
                        </div>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-medium text-zinc-700">{t.customer_name || 'N/A'}</p>
                    {t.project_name && <p className="text-xs text-zinc-400 italic">{t.project_name}</p>}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-zinc-100 rounded-full flex items-center justify-center">
                        <User size={12} className="text-zinc-400" />
                      </div>
                      <span className="text-sm font-medium text-zinc-600">
                        {t.type === 'Report' ? t.technician_name : t.user_name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {t.type === 'Report' ? (
                      <div className="flex items-center gap-2">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-zinc-900">{t.item_count} Items</span>
                            <span className="text-[10px] text-zinc-400 uppercase tracking-widest">Checked Out</span>
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <button 
                              onClick={() => navigate(`/checkin?reportId=${t.id}`)}
                              className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 underline uppercase tracking-tighter"
                            >
                              Check-In
                            </button>
                            <span className="text-zinc-200">|</span>
                            <button 
                              onClick={() => handleDownload(t.id)}
                              className="text-[10px] font-bold text-zinc-500 hover:text-zinc-900 underline uppercase tracking-tighter"
                            >
                              PDF
                            </button>
                            <span className="text-zinc-200">|</span>
                            <button 
                              onClick={() => handleInvoice(t.id)}
                              className="text-[10px] font-bold text-blue-600 hover:text-blue-900 underline uppercase tracking-tighter"
                            >
                              Invoice
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-zinc-400">{t.condition_before}</span>
                        <ChevronRight size={12} className="text-zinc-300" />
                        <span className="font-bold text-zinc-900">{t.condition_after}</span>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && !loading && (
          <div className="p-20 text-center text-zinc-400">
            No transactions found for the current filters.
          </div>
        )}
      </div>
    </div>
  );
}
