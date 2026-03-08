import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Mail, 
  Phone, 
  Building2,
  MoreVertical,
  X
} from 'lucide-react';
import { Customer } from '../types';

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState<Partial<Customer>>({});

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = () => {
    setLoading(true);
    fetch('/api/customers')
      .then(res => res.json())
      .then(data => {
        setCustomers(data);
        setLoading(false);
      });
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = Math.random().toString(36).substr(2, 9);
    
    const response = await fetch('/api/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...formData, id })
    });

    if (response.ok) {
      setShowAddModal(false);
      setFormData({});
      fetchCustomers();
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 mb-2 italic serif">Client Directory</h1>
          <p className="text-zinc-500 font-medium">Manage production companies and rental customers.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-zinc-900 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-zinc-800 transition-all shadow-lg shadow-zinc-900/10"
        >
          <Plus size={20} />
          Add Customer
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {customers.map((customer) => (
          <div key={customer.id} className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm hover:shadow-md transition-all group">
            <div className="flex items-start justify-between mb-6">
              <div className="w-14 h-14 bg-zinc-50 rounded-2xl flex items-center justify-center text-zinc-400 group-hover:bg-zinc-900 group-hover:text-white transition-all duration-300">
                <Users size={28} />
              </div>
              <button className="p-2 hover:bg-zinc-100 rounded-lg text-zinc-400 transition-colors">
                <MoreVertical size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-bold text-zinc-900">{customer.name}</h3>
                <div className="flex items-center gap-2 text-zinc-500 text-sm mt-1">
                  <Building2 size={14} />
                  <span>{customer.company}</span>
                </div>
              </div>

              <div className="space-y-2 pt-4 border-t border-zinc-50">
                <div className="flex items-center gap-3 text-sm text-zinc-600">
                  <Mail size={16} className="text-zinc-400" />
                  <span>{customer.email}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-zinc-600">
                  <Phone size={16} className="text-zinc-400" />
                  <span>{customer.phone}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
        {customers.length === 0 && !loading && (
          <div className="col-span-full p-20 text-center text-zinc-400 bg-white rounded-3xl border border-dashed border-zinc-200">
            No customers registered yet.
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-zinc-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden">
            <div className="p-8 border-b border-zinc-100 flex items-center justify-between">
              <h2 className="text-2xl font-bold italic serif">Add Customer</h2>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-zinc-100 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleAdd} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-zinc-400">Full Name</label>
                <input 
                  required
                  className="w-full px-4 py-3 bg-zinc-50 border-none rounded-xl focus:ring-2 focus:ring-zinc-900"
                  value={formData.name || ''}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-zinc-400">Company</label>
                <input 
                  className="w-full px-4 py-3 bg-zinc-50 border-none rounded-xl focus:ring-2 focus:ring-zinc-900"
                  value={formData.company || ''}
                  onChange={e => setFormData({...formData, company: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-zinc-400">Email</label>
                  <input 
                    type="email"
                    className="w-full px-4 py-3 bg-zinc-50 border-none rounded-xl focus:ring-2 focus:ring-zinc-900"
                    value={formData.email || ''}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-zinc-400">Phone</label>
                  <input 
                    className="w-full px-4 py-3 bg-zinc-50 border-none rounded-xl focus:ring-2 focus:ring-zinc-900"
                    value={formData.phone || ''}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-4 pt-4">
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
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
