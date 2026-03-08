import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  Image as ImageIcon,
  Save,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export default function Settings() {
  const [settings, setSettings] = useState({
    company_name: '',
    company_address: '',
    company_phone: '',
    company_email: '',
    company_website: '',
    company_logo: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        setSettings(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch settings:', err);
        setLoading(false);
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    setError(null);

    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError('Failed to save settings.');
      }
    } catch (err) {
      setError('An error occurred while saving.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSettings(prev => ({ ...prev, company_logo: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <header>
        <h1 className="text-4xl font-bold tracking-tight text-zinc-900 mb-2 italic serif">System Settings</h1>
        <p className="text-zinc-500 font-medium">Configure company information and report branding.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-zinc-100 bg-zinc-50/50 flex items-center gap-3">
              <Building2 className="text-zinc-400" size={20} />
              <h2 className="font-bold">Company Information</h2>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-zinc-400">Company Name</label>
                  <div className="relative">
                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300" size={18} />
                    <input 
                      type="text" 
                      className="w-full pl-12 pr-4 py-3 bg-zinc-50 border-none rounded-xl focus:ring-2 focus:ring-zinc-900 font-medium"
                      value={settings.company_name}
                      onChange={e => setSettings(prev => ({ ...prev, company_name: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-zinc-400">Website</label>
                  <div className="relative">
                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300" size={18} />
                    <input 
                      type="text" 
                      className="w-full pl-12 pr-4 py-3 bg-zinc-50 border-none rounded-xl focus:ring-2 focus:ring-zinc-900 font-medium"
                      value={settings.company_website}
                      onChange={e => setSettings(prev => ({ ...prev, company_website: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-zinc-400">Address</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300" size={18} />
                  <input 
                    type="text" 
                    className="w-full pl-12 pr-4 py-3 bg-zinc-50 border-none rounded-xl focus:ring-2 focus:ring-zinc-900 font-medium"
                    value={settings.company_address}
                    onChange={e => setSettings(prev => ({ ...prev, company_address: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-zinc-400">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300" size={18} />
                    <input 
                      type="text" 
                      className="w-full pl-12 pr-4 py-3 bg-zinc-50 border-none rounded-xl focus:ring-2 focus:ring-zinc-900 font-medium"
                      value={settings.company_phone}
                      onChange={e => setSettings(prev => ({ ...prev, company_phone: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-zinc-400">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300" size={18} />
                    <input 
                      type="email" 
                      className="w-full pl-12 pr-4 py-3 bg-zinc-50 border-none rounded-xl focus:ring-2 focus:ring-zinc-900 font-medium"
                      value={settings.company_email}
                      onChange={e => setSettings(prev => ({ ...prev, company_email: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-zinc-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {success && (
                    <div className="flex items-center gap-2 text-emerald-600 animate-in fade-in slide-in-from-left-2">
                      <CheckCircle2 size={18} />
                      <span className="text-sm font-bold">Settings saved successfully</span>
                    </div>
                  )}
                  {error && (
                    <div className="flex items-center gap-2 text-red-600 animate-in fade-in slide-in-from-left-2">
                      <AlertCircle size={18} />
                      <span className="text-sm font-bold">{error}</span>
                    </div>
                  )}
                </div>
                <button 
                  type="submit"
                  disabled={saving}
                  className="bg-zinc-900 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-zinc-800 transition-all shadow-lg shadow-zinc-900/10 disabled:opacity-50"
                >
                  <Save size={18} />
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </form>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <ImageIcon className="text-zinc-400" size={20} />
              <h2 className="font-bold">Company Logo</h2>
            </div>
            
            <div className="aspect-square bg-zinc-50 rounded-2xl border-2 border-dashed border-zinc-200 flex items-center justify-center overflow-hidden relative group">
              {settings.company_logo ? (
                <img src={settings.company_logo} alt="Company Logo" className="max-w-full max-h-full object-contain p-4" />
              ) : (
                <div className="text-center p-6">
                  <ImageIcon className="mx-auto text-zinc-300 mb-2" size={32} />
                  <p className="text-xs text-zinc-400 font-medium">No logo uploaded</p>
                </div>
              )}
              <div className="absolute inset-0 bg-zinc-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <label className="cursor-pointer bg-white text-zinc-900 px-4 py-2 rounded-lg font-bold text-sm">
                  Change Logo
                  <input type="file" className="hidden" accept="image/*" onChange={handleLogoChange} />
                </label>
              </div>
            </div>
            <p className="text-[10px] text-zinc-400 leading-relaxed">
              Upload a high-resolution PNG or JPG. This logo will appear at the top of all checkout reports and generated PDFs.
            </p>
          </div>

          <div className="bg-zinc-900 p-8 rounded-3xl text-white space-y-4">
            <div className="flex items-center gap-3">
              <SettingsIcon size={20} className="text-zinc-500" />
              <h3 className="font-bold">Report Branding</h3>
            </div>
            <p className="text-sm text-zinc-400 leading-relaxed">
              The information provided here is used to brand your equipment checkout reports. Ensure your contact details are accurate for technicians and customers.
            </p>
          </div>

          <div className="bg-red-50 p-8 rounded-3xl border border-red-100 space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <AlertCircle size={20} />
              <h3 className="font-bold">Danger Zone</h3>
            </div>
            <p className="text-xs text-red-600/70 leading-relaxed">
              Resetting the database will permanently delete all transactions, checkout reports, and return history. Equipment, customers, and staff will be preserved, but all items will be set back to "Available".
            </p>
            <button 
              onClick={async () => {
                if (confirm('Are you absolutely sure? This will delete all transaction history.')) {
                  const res = await fetch('/api/admin/reset-transactions', { method: 'POST' });
                  if (res.ok) alert('Database reset successfully.');
                }
              }}
              className="w-full py-3 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 transition-colors"
            >
              Reset All Transactions
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
