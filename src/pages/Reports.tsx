import React, { useState, useEffect } from 'react';
import { 
  FileBarChart, 
  Download, 
  TrendingUp, 
  Package, 
  Users, 
  ArrowUpRight,
  ArrowDownLeft,
  Search,
  X,
  Layers
} from 'lucide-react';
import { format } from 'date-fns';

const ReportCard = ({ title, description, icon: Icon, onClick }: { title: string, description: string, icon: any, onClick: () => void }) => (
  <div 
    onClick={onClick}
    className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm hover:shadow-md transition-all group cursor-pointer"
  >
    <div className="w-14 h-14 bg-zinc-50 rounded-2xl flex items-center justify-center text-zinc-400 group-hover:bg-zinc-900 group-hover:text-white transition-all duration-300 mb-6">
      <Icon size={28} />
    </div>
    <h3 className="text-xl font-bold text-zinc-900 mb-2">{title}</h3>
    <p className="text-zinc-500 text-sm leading-relaxed mb-6">{description}</p>
    <button className="flex items-center gap-2 text-sm font-bold text-zinc-900 hover:gap-3 transition-all">
      View Report
      <ArrowUpRight size={16} />
    </button>
  </div>
);

export default function Reports() {
  const [activeReport, setActiveReport] = useState<string | null>(null);
  const [reportData, setReportData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchReport = async (type: string) => {
    setLoading(true);
    setActiveReport(type);
    try {
      let url = '';
      if (type === 'Inventory Status') url = '/api/reports/inventory';
      if (type === 'Active Rentals') url = '/api/reports/active-rentals';
      if (type === 'Equipment Usage') url = '/api/reports/usage';
      if (type === 'Maintenance Log') url = '/api/reports/maintenance-all';
      
      if (url) {
        const res = await fetch(url);
        const data = await res.json();
        setReportData(data);
      }
    } catch (error) {
      console.error('Failed to fetch report:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredData = reportData.filter(item => 
    Object.values(item).some(val => 
      String(val).toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-4xl font-bold tracking-tight text-zinc-900 mb-2 italic serif">Analytics & Reports</h1>
        <p className="text-zinc-500 font-medium">Generate detailed insights for management and operations.</p>
      </header>

      {!activeReport ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4">
          <ReportCard 
            title="Inventory Status" 
            description="Full list of all equipment with current status, condition, and location."
            icon={Package}
            onClick={() => fetchReport('Inventory Status')}
          />
          <ReportCard 
            title="Equipment Usage" 
            description="Track which items are most rented and identify underutilized gear."
            icon={TrendingUp}
            onClick={() => fetchReport('Equipment Usage')}
          />
          <ReportCard 
            title="Active Rentals" 
            description="Detailed report of all equipment currently outside the warehouse."
            icon={ArrowUpRight}
            onClick={() => fetchReport('Active Rentals')}
          />
          <ReportCard 
            title="Customer History" 
            description="Rental history and transaction volume per production company."
            icon={Users}
            onClick={() => {}}
          />
          <ReportCard 
            title="Maintenance Log" 
            description="History of repairs and equipment currently marked as damaged."
            icon={FileBarChart}
            onClick={() => fetchReport('Maintenance Log')}
          />
          <ReportCard 
            title="Staff Activity" 
            description="Performance report of check-in and check-out actions per staff member."
            icon={ArrowDownLeft}
            onClick={() => {}}
          />
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setActiveReport(null)}
                className="p-2 hover:bg-zinc-100 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
              <h2 className="text-2xl font-bold">{activeReport}</h2>
            </div>
            <div className="flex gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Filter results..." 
                  className="pl-10 pr-4 py-2 bg-white border border-zinc-200 rounded-xl text-sm focus:ring-2 focus:ring-zinc-900"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
              <button className="bg-zinc-900 text-white px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2">
                <Download size={16} />
                Export
              </button>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-50 border-b border-zinc-100">
                    {activeReport === 'Inventory Status' && (
                      <>
                        <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">Item</th>
                        <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">Barcode</th>
                        <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">Status</th>
                        <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">Condition</th>
                        <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">Location</th>
                      </>
                    )}
                    {activeReport === 'Active Rentals' && (
                      <>
                        <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">Report ID</th>
                        <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">Project</th>
                        <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">Customer</th>
                        <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">Technician</th>
                        <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">Items</th>
                        <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">Date</th>
                      </>
                    )}
                    {activeReport === 'Equipment Usage' && (
                      <>
                        <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">Equipment Name</th>
                        <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">Category</th>
                        <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">Total Rentals</th>
                      </>
                    )}
                    {activeReport === 'Maintenance Log' && (
                      <>
                        <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">Equipment</th>
                        <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">Staff</th>
                        <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">Issue</th>
                        <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">Action</th>
                        <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">Cost</th>
                        <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">Date</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50">
                  {filteredData.map((item, idx) => (
                    <tr key={idx} className="hover:bg-zinc-50/50 transition-colors">
                      {activeReport === 'Inventory Status' && (
                        <>
                          <td className="px-6 py-4 font-bold">{item.name}</td>
                          <td className="px-6 py-4 font-mono text-xs">{item.barcode}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                              item.status === 'Available' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
                            }`}>{item.status}</span>
                          </td>
                          <td className="px-6 py-4 text-sm">{item.condition}</td>
                          <td className="px-6 py-4 text-sm text-zinc-500">{item.location}</td>
                        </>
                      )}
                      {activeReport === 'Active Rentals' && (
                        <>
                          <td className="px-6 py-4 font-bold font-mono">{item.id}</td>
                          <td className="px-6 py-4 text-sm">{item.project_name}</td>
                          <td className="px-6 py-4 text-sm">{item.customer_name}</td>
                          <td className="px-6 py-4 text-sm">{item.technician_name}</td>
                          <td className="px-6 py-4 text-sm">
                            {item.returned_items} / {item.total_items}
                          </td>
                          <td className="px-6 py-4 text-sm text-zinc-500">
                            {format(new Date(item.timestamp), 'MMM d, yyyy')}
                          </td>
                        </>
                      )}
                      {activeReport === 'Equipment Usage' && (
                        <>
                          <td className="px-6 py-4 font-bold">{item.name}</td>
                          <td className="px-6 py-4 text-sm text-zinc-500">{item.category}</td>
                          <td className="px-6 py-4 font-bold text-blue-600">{item.rental_count}</td>
                        </>
                      )}
                      {activeReport === 'Maintenance Log' && (
                        <>
                          <td className="px-6 py-4 font-bold">{item.equipment_name}</td>
                          <td className="px-6 py-4 text-sm">{item.staff_name}</td>
                          <td className="px-6 py-4 text-sm">{item.issue}</td>
                          <td className="px-6 py-4 text-sm">{item.action_taken}</td>
                          <td className="px-6 py-4 font-bold text-red-600">${item.cost}</td>
                          <td className="px-6 py-4 text-sm text-zinc-500">
                            {format(new Date(item.timestamp), 'MMM d, yyyy')}
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <div className="bg-zinc-900 rounded-3xl p-10 text-white flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="space-y-4">
          <h2 className="text-3xl font-bold italic serif">Custom Data Export</h2>
          <p className="text-zinc-400 max-w-lg">
            Need a specific data set? Export your entire database to CSV or Excel for advanced analysis in external tools.
          </p>
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <button className="flex-1 md:flex-none bg-white text-zinc-900 px-8 py-4 rounded-2xl font-bold hover:bg-zinc-100 transition-all">
            Export to CSV
          </button>
          <button className="flex-1 md:flex-none bg-zinc-800 text-white px-8 py-4 rounded-2xl font-bold hover:bg-zinc-700 transition-all">
            Export to Excel
          </button>
        </div>
      </div>
    </div>
  );
}
