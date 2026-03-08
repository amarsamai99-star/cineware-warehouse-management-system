import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  Filter, 
  MoreVertical, 
  ArrowUpRight,
  ArrowDownLeft,
  Edit2, 
  Trash2, 
  ExternalLink,
  Camera,
  Tag,
  X,
  Package,
  Upload,
  Layers,
  Check,
  ChevronRight,
  Wrench,
  DollarSign,
  Printer
} from 'lucide-react';
import { Equipment } from '../types';
import { clsx } from 'clsx';
import { useNavigate } from 'react-router-dom';
import JsBarcode from 'jsbarcode';

export default function Inventory() {
  const navigate = useNavigate();
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showKitModal, setShowKitModal] = useState(false);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Equipment | null>(null);
  const [maintenanceLogs, setMaintenanceLogs] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  
  const [selectedKit, setSelectedKit] = useState<Equipment | null>(null);
  const [kitComponents, setKitComponents] = useState<Equipment[]>([]);
  const [importData, setImportData] = useState<any[]>([]);
  const [importResults, setImportResults] = useState<any>(null);
  
  const [formData, setFormData] = useState<Partial<Equipment>>({
    condition: 'Good',
    status: 'Available'
  });

  useEffect(() => {
    fetchEquipment();
    fetch('/api/staff').then(res => res.json()).then(setStaff);
  }, []);

  const fetchEquipment = () => {
    setLoading(true);
    fetch('/api/equipment')
      .then(res => res.json())
      .then(data => {
        setEquipment(data);
        setLoading(false);
      });
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = formData.id || Math.random().toString(36).substr(2, 9).toUpperCase();
    const barcode = formData.barcode || id;
    
    const response = await fetch('/api/equipment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...formData, id, barcode })
    });

    if (response.ok) {
      setShowAddModal(false);
      setFormData({ condition: 'Good', status: 'Available' });
      fetchEquipment();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      
      const data = lines.slice(1).filter(line => line.trim()).map(line => {
        const values = line.split(',').map(v => v.trim());
        const obj: any = {};
        headers.forEach((header, index) => {
          obj[header] = values[index];
        });
        return obj;
      });
      
      setImportData(data);
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    const res = await fetch('/api/equipment/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(importData)
    });
    
    if (res.ok) {
      const results = await res.json();
      setImportResults(results);
      fetchEquipment();
    }
  };

  const openKitModal = async (item: Equipment) => {
    setSelectedKit(item);
    const res = await fetch(`/api/equipment/${item.id}/components`);
    if (res.ok) {
      const data = await res.json();
      setKitComponents(data);
    }
    setShowKitModal(true);
  };

  const openMaintenanceModal = async (item: Equipment) => {
    setSelectedItem(item);
    const res = await fetch(`/api/equipment/${item.id}/maintenance`);
    if (res.ok) {
      const data = await res.json();
      setMaintenanceLogs(data);
    }
    setShowMaintenanceModal(true);
  };

  const openBarcodeModal = (item: Equipment) => {
    setSelectedItem(item);
    setShowBarcodeModal(true);
    setTimeout(() => {
      const canvas = document.getElementById('barcode-preview') as HTMLCanvasElement;
      if (canvas) {
        JsBarcode(canvas, item.barcode || item.id, {
          format: 'CODE128',
          width: 2,
          height: 100,
          displayValue: true,
          fontSize: 20,
          margin: 10
        });
      }
    }, 100);
  };

  const printBarcode = () => {
    const canvas = document.getElementById('barcode-preview') as HTMLCanvasElement;
    if (!canvas) return;
    
    const dataUrl = canvas.toDataURL();
    const windowContent = `
      <!DOCTYPE html>
      <html>
        <head><title>Print Barcode</title></head>
        <body style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0;">
          <h2 style="font-family: sans-serif; margin-bottom: 20px;">${selectedItem?.name}</h2>
          <img src="${dataUrl}" />
          <p style="font-family: monospace; margin-top: 10px;">${selectedItem?.serial_number ? `SN: ${selectedItem.serial_number}` : ''}</p>
          <script>
            window.onload = () => {
              window.print();
              window.close();
            };
          </script>
        </body>
      </html>
    `;
    const printWin = window.open('', '', 'width=600,height=600');
    if (printWin) {
      printWin.document.open();
      printWin.document.write(windowContent);
      printWin.document.close();
    }
  };

  const handleMaintenanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    const formData = new FormData(e.target as HTMLFormElement);
    const data = Object.fromEntries(formData.entries());
    
    const res = await fetch(`/api/equipment/${selectedItem.id}/maintenance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    if (res.ok) {
      setShowMaintenanceModal(false);
      fetchEquipment();
    }
  };

  const saveKitComponents = async (componentIds: string[]) => {
    if (!selectedKit) return;
    const res = await fetch(`/api/equipment/${selectedKit.id}/components`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ componentIds })
    });
    if (res.ok) {
      setShowKitModal(false);
      alert('Kit components updated.');
    }
  };

  const filteredEquipment = equipment.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.serial_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.barcode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 mb-2 italic serif">Equipment Inventory</h1>
          <p className="text-zinc-500 font-medium">Manage and track all cinema gear in the warehouse.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowImportModal(true)}
            className="bg-white text-zinc-900 border border-zinc-200 px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-zinc-50 transition-all shadow-sm"
          >
            <Upload size={20} />
            Import CSV
          </button>
          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-zinc-900 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-zinc-800 transition-all shadow-lg shadow-zinc-900/10"
          >
            <Plus size={20} />
            Add Equipment
          </button>
        </div>
      </header>

      <div className="flex flex-col md:flex-row gap-4 items-center bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
          <input 
            type="text" 
            placeholder="Search by name, serial, or barcode..." 
            className="w-full pl-12 pr-4 py-3 bg-zinc-50 border-none rounded-xl focus:ring-2 focus:ring-zinc-900 transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <button className="flex items-center gap-2 px-6 py-3 bg-zinc-50 text-zinc-600 rounded-xl font-bold hover:bg-zinc-100 transition-all">
          <Filter size={20} />
          Filters
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-100">
                <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">Equipment</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">Category</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">Serial / Barcode</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">Condition</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {filteredEquipment.map((item) => (
                <tr key={item.id} className="hover:bg-zinc-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-zinc-100 rounded-lg flex items-center justify-center text-zinc-400 overflow-hidden">
                        {item.image_url ? (
                          <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <Camera size={20} />
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-zinc-900">{item.name}</p>
                        <p className="text-xs text-zinc-500 font-medium">{item.brand} {item.model}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-100 text-zinc-600 text-xs font-bold">
                      <Tag size={12} />
                      {item.category}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-mono text-zinc-600">{item.serial_number}</p>
                    <p className="text-xs text-zinc-400 font-mono">{item.barcode}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={clsx(
                      "inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                      item.status === 'Available' ? "bg-emerald-100 text-emerald-700" : 
                      item.status === 'Checked Out' ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"
                    )}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={clsx(
                      "text-xs font-bold",
                      item.condition === 'Broken' ? "text-red-500" : "text-zinc-600"
                    )}>
                      {item.condition}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {item.status === 'Available' ? (
                        <button 
                          onClick={() => navigate(`/checkout?id=${item.id}`)}
                          className="p-2 hover:bg-emerald-50 rounded-lg text-emerald-600 transition-colors"
                          title="Check Out"
                        >
                          <ArrowUpRight size={16} />
                        </button>
                      ) : item.status === 'Checked Out' ? (
                        <button 
                          onClick={() => navigate(`/checkin?id=${item.id}`)}
                          className="p-2 hover:bg-blue-50 rounded-lg text-blue-600 transition-colors"
                          title="Check In"
                        >
                          <ArrowDownLeft size={16} />
                        </button>
                      ) : null}
                      <button 
                        onClick={() => openKitModal(item)}
                        className="p-2 hover:bg-zinc-200 rounded-lg text-zinc-600 transition-colors"
                        title="Manage Kit"
                      >
                        <Layers size={16} />
                      </button>
                      <button 
                        onClick={() => openMaintenanceModal(item)}
                        className="p-2 hover:bg-amber-50 rounded-lg text-amber-600 transition-colors"
                        title="Maintenance"
                      >
                        <Wrench size={16} />
                      </button>
                      <button 
                        onClick={() => openBarcodeModal(item)}
                        className="p-2 hover:bg-zinc-200 rounded-lg text-zinc-600 transition-colors"
                        title="Print Barcode"
                      >
                        <Printer size={16} />
                      </button>
                      <button className="p-2 hover:bg-zinc-200 rounded-lg text-zinc-600 transition-colors">
                        <Edit2 size={16} />
                      </button>
                      <button className="p-2 hover:bg-red-50 rounded-lg text-red-500 transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredEquipment.length === 0 && !loading && (
          <div className="p-20 text-center">
            <div className="w-20 h-20 bg-zinc-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="text-zinc-300" size={40} />
            </div>
            <h3 className="text-lg font-bold text-zinc-900">No equipment found</h3>
            <p className="text-zinc-500">Try adjusting your search or add a new item.</p>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-zinc-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden">
            <div className="p-8 border-b border-zinc-100 flex items-center justify-between">
              <h2 className="text-2xl font-bold italic serif">New Equipment</h2>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-zinc-100 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleAdd} className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-zinc-400">Item Name</label>
                <input 
                  required
                  className="w-full px-4 py-3 bg-zinc-50 border-none rounded-xl focus:ring-2 focus:ring-zinc-900"
                  value={formData.name || ''}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-zinc-400">Category</label>
                <select 
                  className="w-full px-4 py-3 bg-zinc-50 border-none rounded-xl focus:ring-2 focus:ring-zinc-900"
                  value={formData.category || ''}
                  onChange={e => setFormData({...formData, category: e.target.value})}
                >
                  <option value="">Select Category</option>
                  <option value="Camera">Camera</option>
                  <option value="Lighting">Lighting</option>
                  <option value="Audio">Audio</option>
                  <option value="Grip">Grip</option>
                  <option value="Lens">Lens</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-zinc-400">Brand</label>
                <input 
                  className="w-full px-4 py-3 bg-zinc-50 border-none rounded-xl focus:ring-2 focus:ring-zinc-900"
                  value={formData.brand || ''}
                  onChange={e => setFormData({...formData, brand: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-zinc-400">Model</label>
                <input 
                  className="w-full px-4 py-3 bg-zinc-50 border-none rounded-xl focus:ring-2 focus:ring-zinc-900"
                  value={formData.model || ''}
                  onChange={e => setFormData({...formData, model: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-zinc-400">Serial Number</label>
                <input 
                  className="w-full px-4 py-3 bg-zinc-50 border-none rounded-xl focus:ring-2 focus:ring-zinc-900"
                  value={formData.serial_number || ''}
                  onChange={e => setFormData({...formData, serial_number: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-zinc-400">Barcode (Optional)</label>
                <input 
                  className="w-full px-4 py-3 bg-zinc-50 border-none rounded-xl focus:ring-2 focus:ring-zinc-900"
                  value={formData.barcode || ''}
                  onChange={e => setFormData({...formData, barcode: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-zinc-400">Price Per Day ($)</label>
                <input 
                  type="number"
                  className="w-full px-4 py-3 bg-zinc-50 border-none rounded-xl focus:ring-2 focus:ring-zinc-900"
                  value={formData.price_per_day || 0}
                  onChange={e => setFormData({...formData, price_per_day: parseFloat(e.target.value)})}
                />
              </div>
              <div className="md:col-span-2 flex justify-end gap-4 mt-4">
                <button 
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-6 py-3 font-bold text-zinc-500 hover:text-zinc-900 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="bg-zinc-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-zinc-800 transition-all"
                >
                  Save Equipment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-zinc-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden">
            <div className="p-8 border-b border-zinc-100 flex items-center justify-between">
              <h2 className="text-2xl font-bold italic serif">Import Inventory</h2>
              <button onClick={() => setShowImportModal(false)} className="p-2 hover:bg-zinc-100 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>
            <div className="p-8 space-y-6">
              {!importResults ? (
                <>
                  <div className="border-2 border-dashed border-zinc-200 rounded-2xl p-10 text-center space-y-4">
                    <Upload className="mx-auto text-zinc-300" size={48} />
                    <div>
                      <p className="font-bold text-zinc-900">Choose a CSV file</p>
                      <p className="text-sm text-zinc-500">Headers: name, category, brand, model, serial_number, barcode, location, notes</p>
                    </div>
                    <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" id="csv-upload" />
                    <label htmlFor="csv-upload" className="inline-block bg-zinc-900 text-white px-6 py-2 rounded-lg font-bold cursor-pointer hover:bg-zinc-800 transition-colors">
                      Select File
                    </label>
                  </div>
                  {importData.length > 0 && (
                    <div className="bg-zinc-50 p-4 rounded-xl flex items-center justify-between">
                      <span className="text-sm font-bold text-zinc-600">{importData.length} items ready to import</span>
                      <button onClick={handleImport} className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-emerald-700 transition-colors">
                        Start Import
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                      <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-1">Imported</p>
                      <p className="text-2xl font-black text-emerald-700">{importResults.imported}</p>
                    </div>
                    <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                      <p className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-1">Skipped (Duplicate Serial)</p>
                      <p className="text-2xl font-black text-amber-700">{importResults.skipped}</p>
                    </div>
                  </div>
                  {importResults.errors.length > 0 && (
                    <div className="bg-red-50 p-4 rounded-xl border border-red-100 max-h-40 overflow-y-auto">
                      <p className="text-xs font-bold text-red-600 uppercase tracking-widest mb-2">Errors</p>
                      <ul className="text-xs text-red-700 space-y-1">
                        {importResults.errors.map((err: string, i: number) => <li key={i}>{err}</li>)}
                      </ul>
                    </div>
                  )}
                  <button onClick={() => { setShowImportModal(false); setImportResults(null); setImportData([]); }} className="w-full py-3 bg-zinc-900 text-white rounded-xl font-bold">
                    Close
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Kit Modal */}
      {showKitModal && selectedKit && (
        <div className="fixed inset-0 bg-zinc-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden">
            <div className="p-8 border-b border-zinc-100 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold italic serif">Manage Kit: {selectedKit.name}</h2>
                <p className="text-xs text-zinc-500 font-medium">Add or remove components from this kit bundle.</p>
              </div>
              <button onClick={() => setShowKitModal(false)} className="p-2 hover:bg-zinc-100 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>
            <div className="p-8 space-y-6">
              <div className="space-y-4">
                <label className="text-xs font-black uppercase tracking-widest text-zinc-400">Current Components</label>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                  {kitComponents.map(comp => (
                    <div key={comp.id} className="flex items-center justify-between p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-zinc-400">
                          <Package size={14} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-zinc-900">{comp.name}</p>
                          <p className="text-[10px] text-zinc-500 font-mono">{comp.serial_number}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => setKitComponents(prev => prev.filter(c => c.id !== comp.id))}
                        className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                  {kitComponents.length === 0 && (
                    <p className="text-center py-8 text-zinc-400 text-sm font-medium italic">No components added yet.</p>
                  )}
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-zinc-100">
                <label className="text-xs font-black uppercase tracking-widest text-zinc-400">Add Component</label>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                  <input 
                    type="text" 
                    placeholder="Search equipment to add..." 
                    className="w-full pl-12 pr-4 py-3 bg-zinc-50 border-none rounded-xl focus:ring-2 focus:ring-zinc-900"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const val = (e.target as HTMLInputElement).value;
                        const found = equipment.find(eq => eq.id === val || eq.barcode === val || eq.serial_number === val);
                        if (found && !kitComponents.find(c => c.id === found.id) && found.id !== selectedKit.id) {
                          setKitComponents(prev => [...prev, found]);
                          (e.target as HTMLInputElement).value = '';
                        }
                      }
                    }}
                  />
                </div>
                <p className="text-[10px] text-zinc-400">Scan barcode or type Serial/ID and press Enter to add to kit.</p>
              </div>

              <div className="flex justify-end gap-4 pt-4">
                <button 
                  onClick={() => setShowKitModal(false)}
                  className="px-6 py-3 font-bold text-zinc-500 hover:text-zinc-900 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => saveKitComponents(kitComponents.map(c => c.id))}
                  className="bg-zinc-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-zinc-800 transition-all shadow-lg shadow-zinc-900/10"
                >
                  Save Kit Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Maintenance Modal */}
      {showMaintenanceModal && selectedItem && (
        <div className="fixed inset-0 bg-zinc-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden">
            <div className="p-8 border-b border-zinc-100 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold italic serif">Maintenance: {selectedItem.name}</h2>
                <p className="text-xs text-zinc-500 font-medium">Log issues, repairs, and update equipment status.</p>
              </div>
              <button onClick={() => setShowMaintenanceModal(false)} className="p-2 hover:bg-zinc-100 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2">
              <div className="p-8 border-r border-zinc-100 space-y-6">
                <form onSubmit={handleMaintenanceSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-zinc-400">Staff Member</label>
                    <select name="staff_id" required className="w-full px-4 py-3 bg-zinc-50 border-none rounded-xl focus:ring-2 focus:ring-zinc-900">
                      <option value="">Select Staff</option>
                      {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-zinc-400">Issue / Reason</label>
                    <textarea name="issue" required className="w-full px-4 py-3 bg-zinc-50 border-none rounded-xl focus:ring-2 focus:ring-zinc-900 h-24 resize-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-zinc-400">Action Taken</label>
                    <textarea name="action_taken" className="w-full px-4 py-3 bg-zinc-50 border-none rounded-xl focus:ring-2 focus:ring-zinc-900 h-24 resize-none" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-zinc-400">Cost ($)</label>
                      <input type="number" name="cost" defaultValue="0" className="w-full px-4 py-3 bg-zinc-50 border-none rounded-xl focus:ring-2 focus:ring-zinc-900" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-zinc-400">New Status</label>
                      <select name="status" className="w-full px-4 py-3 bg-zinc-50 border-none rounded-xl focus:ring-2 focus:ring-zinc-900">
                        <option value="">No Change</option>
                        <option value="Available">Available</option>
                        <option value="Maintenance">Maintenance</option>
                        <option value="Needs Repair">Needs Repair</option>
                      </select>
                    </div>
                  </div>
                  <button type="submit" className="w-full py-3 bg-zinc-900 text-white rounded-xl font-bold hover:bg-zinc-800 transition-all shadow-lg shadow-zinc-900/10">
                    Save Maintenance Log
                  </button>
                </form>
              </div>
              <div className="p-8 bg-zinc-50/50 space-y-6">
                <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">History</h3>
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                  {maintenanceLogs.map((log, i) => (
                    <div key={i} className="bg-white p-4 rounded-2xl border border-zinc-100 shadow-sm space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{new Date(log.timestamp).toLocaleDateString()}</span>
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">${log.cost}</span>
                      </div>
                      <p className="text-sm font-bold text-zinc-900">{log.issue}</p>
                      <p className="text-xs text-zinc-500 leading-relaxed">{log.action_taken}</p>
                      <div className="pt-2 flex items-center gap-2">
                        <div className="w-5 h-5 bg-zinc-100 rounded-full flex items-center justify-center text-[8px] font-bold text-zinc-500">
                          {log.staff_name?.charAt(0)}
                        </div>
                        <span className="text-[10px] font-medium text-zinc-400">{log.staff_name}</span>
                      </div>
                    </div>
                  ))}
                  {maintenanceLogs.length === 0 && (
                    <p className="text-center py-20 text-zinc-400 text-sm italic">No maintenance history.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Barcode Modal */}
      {showBarcodeModal && selectedItem && (
        <div className="fixed inset-0 bg-zinc-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden">
            <div className="p-8 border-b border-zinc-100 flex items-center justify-between">
              <h2 className="text-2xl font-bold italic serif">Print Label</h2>
              <button onClick={() => setShowBarcodeModal(false)} className="p-2 hover:bg-zinc-100 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>
            <div className="p-8 flex flex-col items-center space-y-8">
              <div className="text-center">
                <p className="font-bold text-zinc-900">{selectedItem.name}</p>
                <p className="text-xs text-zinc-500">{selectedItem.brand} {selectedItem.model}</p>
              </div>
              
              <div className="bg-white p-4 rounded-xl border border-zinc-100 shadow-inner">
                <canvas id="barcode-preview"></canvas>
              </div>

              <div className="w-full grid grid-cols-2 gap-4">
                <button 
                  onClick={() => setShowBarcodeModal(false)}
                  className="py-3 font-bold text-zinc-500 hover:text-zinc-900 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={printBarcode}
                  className="bg-zinc-900 text-white py-3 rounded-xl font-bold hover:bg-zinc-800 transition-all flex items-center justify-center gap-2"
                >
                  <Printer size={18} />
                  Print Label
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
