import React, { useState, useEffect } from 'react';
import { 
  Package, 
  ArrowUpRight, 
  ArrowDownLeft, 
  AlertCircle,
  Clock,
  ChevronRight,
  Scan
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { DashboardStats } from '../types';
import { format } from 'date-fns';

const StatCard = ({ label, value, icon: Icon, color }: { label: string, value: number, icon: any, color: string }) => (
  <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
    <div className="flex items-center justify-between mb-4">
      <div className={cn("p-2 rounded-xl", color)}>
        <Icon size={24} className="text-white" />
      </div>
      <span className="text-zinc-400 text-xs font-bold uppercase tracking-wider">Live</span>
    </div>
    <div className="flex flex-col">
      <span className="text-3xl font-bold tracking-tight mb-1">{value}</span>
      <span className="text-zinc-500 text-sm font-medium">{label}</span>
    </div>
  </div>
);

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/stats')
      .then(res => res.json())
      .then(data => {
        setStats(data);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="animate-pulse space-y-8">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[1,2,3,4].map(i => <div key={i} className="h-32 bg-white rounded-2xl border border-zinc-200" />)}
    </div>
    <div className="h-96 bg-white rounded-2xl border border-zinc-200" />
  </div>;

  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-4xl font-bold tracking-tight text-zinc-900 mb-2 italic serif">Warehouse Overview</h1>
        <p className="text-zinc-500 font-medium">Real-time status of your cinema equipment inventory.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          label="Total Equipment" 
          value={stats?.total || 0} 
          icon={Package} 
          color="bg-zinc-900" 
        />
        <StatCard 
          label="Available" 
          value={stats?.available || 0} 
          icon={ArrowDownLeft} 
          color="bg-emerald-600" 
        />
        <StatCard 
          label="Checked Out" 
          value={stats?.rented || 0} 
          icon={ArrowUpRight} 
          color="bg-blue-600" 
        />
        <StatCard 
          label="Maintenance" 
          value={stats?.maintenance || 0} 
          icon={AlertCircle} 
          color="bg-amber-500" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
            <h2 className="font-bold text-lg flex items-center gap-2">
              <Clock size={20} className="text-zinc-400" />
              Recent Activity
            </h2>
            <button className="text-sm font-semibold text-zinc-500 hover:text-zinc-900 flex items-center gap-1">
              View All <ChevronRight size={16} />
            </button>
          </div>
          <div className="divide-y divide-zinc-50">
            {stats?.recentActivity.map((activity) => (
              <div key={activity.id} className="p-4 flex items-center justify-between hover:bg-zinc-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center",
                    activity.action_type === 'Check-Out' ? "bg-blue-50 text-blue-600" : "bg-emerald-50 text-emerald-600"
                  )}>
                    {activity.action_type === 'Check-Out' ? <ArrowUpRight size={20} /> : <ArrowDownLeft size={20} />}
                  </div>
                  <div>
                    <p className="font-bold text-sm">{activity.equipment_name}</p>
                    <p className="text-xs text-zinc-500">
                      {activity.action_type} • {format(new Date(activity.timestamp), 'MMM d, h:mm a')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Technician</p>
                  <p className="text-sm font-medium">{activity.user_name || 'System'}</p>
                </div>
              </div>
            ))}
            {stats?.recentActivity.length === 0 && (
              <div className="p-10 text-center text-zinc-400">
                No recent activity recorded.
              </div>
            )}
          </div>
        </div>

        <div className="bg-zinc-900 rounded-2xl p-8 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="text-2xl font-bold mb-4">Quick Scan</h3>
            <p className="text-zinc-400 text-sm mb-8 leading-relaxed">
              Ready to process a return or rental? Use the scanner for lightning-fast operations.
            </p>
            <div className="flex flex-col gap-3">
              <Link to="/scan" className="inline-flex items-center justify-center gap-2 bg-white text-zinc-900 px-6 py-4 rounded-xl font-bold hover:bg-zinc-100 transition-colors">
                <Scan size={20} />
                Open Scanner
              </Link>
              <Link to="/checkout" className="inline-flex items-center justify-center gap-2 bg-zinc-800 text-white px-6 py-4 rounded-xl font-bold hover:bg-zinc-700 transition-colors border border-zinc-700">
                <ArrowUpRight size={20} />
                Manual Check-Out
              </Link>
              <Link to="/checkin" className="inline-flex items-center justify-center gap-2 bg-zinc-800 text-white px-6 py-4 rounded-xl font-bold hover:bg-zinc-700 transition-colors border border-zinc-700">
                <ArrowDownLeft size={20} />
                Manual Check-In
              </Link>
            </div>
          </div>
          <div className="absolute -right-10 -bottom-10 opacity-10">
            <Scan size={240} />
          </div>
        </div>
      </div>
    </div>
  );
}
