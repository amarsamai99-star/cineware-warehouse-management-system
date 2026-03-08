export interface Equipment {
  id: string;
  name: string;
  category: string;
  brand: string;
  model: string;
  serial_number: string;
  barcode: string;
  condition: 'New' | 'Good' | 'Needs Repair' | 'Broken';
  status: 'Available' | 'Checked Out' | 'Maintenance';
  location: string;
  notes: string;
  image_url?: string;
  price_per_day?: number;
  created_at?: string;
}

export interface Customer {
  id: string;
  name: string;
  company: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
}

export interface Staff {
  id: string;
  name: string;
  role: 'Admin' | 'Staff' | 'Technician';
  phone: string;
  email: string;
  status: 'Active' | 'Inactive';
}

export interface Transaction {
  id: string;
  equipment_id: string;
  equipment_name?: string;
  action_type: 'Check-Out' | 'Check-In';
  user_id: string;
  user_name?: string;
  customer_id?: string;
  customer_name?: string;
  technician_id?: string;
  condition_before: string;
  condition_after: string;
  signature_data?: string;
  notes: string;
  timestamp: string;
}

export interface CheckoutReport {
  id: string;
  customer_id: string;
  customer_name?: string;
  technician_id: string;
  technician_name?: string;
  project_name: string;
  notes: string;
  status: 'Active' | 'Returned' | 'Partial';
  timestamp: string;
  items?: CheckoutItem[];
}

export interface CheckoutItem {
  id: number;
  report_id: string;
  equipment_id: string;
  equipment_name?: string;
  barcode?: string;
  condition_at_checkout: string;
  condition_at_checkin?: string;
  returned_at?: string;
}

export interface DashboardStats {
  total: number;
  available: number;
  rented: number;
  maintenance: number;
  recentActivity: Transaction[];
}
