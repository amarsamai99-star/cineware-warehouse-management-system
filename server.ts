import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("warehouse.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS equipment (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT,
    brand TEXT,
    model TEXT,
    serial_number TEXT,
    barcode TEXT UNIQUE,
    condition TEXT DEFAULT 'Good',
    status TEXT DEFAULT 'Available',
    location TEXT,
    notes TEXT,
    image_url TEXT,
    price_per_day REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS maintenance_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    equipment_id TEXT,
    staff_id TEXT,
    issue TEXT,
    action_taken TEXT,
    cost REAL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(equipment_id) REFERENCES equipment(id),
    FOREIGN KEY(staff_id) REFERENCES staff(id)
  );

  CREATE TABLE IF NOT EXISTS kit_components (
    kit_id TEXT,
    component_id TEXT,
    PRIMARY KEY (kit_id, component_id),
    FOREIGN KEY(kit_id) REFERENCES equipment(id),
    FOREIGN KEY(component_id) REFERENCES equipment(id)
  );

  CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    company TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS sub_rentals (
    id TEXT PRIMARY KEY,
    equipment_id TEXT,
    vendor_name TEXT,
    start_date DATE,
    end_date DATE,
    cost REAL,
    notes TEXT,
    status TEXT DEFAULT 'Active', -- 'Active', 'Returned'
    FOREIGN KEY(equipment_id) REFERENCES equipment(id)
  );

  CREATE TABLE IF NOT EXISTS insurance_certificates (
    id TEXT PRIMARY KEY,
    customer_id TEXT,
    policy_number TEXT,
    expiry_date DATE,
    coverage_amount REAL,
    file_url TEXT,
    FOREIGN KEY(customer_id) REFERENCES customers(id)
  );

  CREATE TABLE IF NOT EXISTS staff (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT DEFAULT 'Staff',
    phone TEXT,
    email TEXT UNIQUE,
    password TEXT,
    status TEXT DEFAULT 'Active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    equipment_id TEXT,
    action_type TEXT, -- 'Check-Out' or 'Check-In'
    user_id TEXT,
    customer_id TEXT,
    technician_id TEXT,
    condition_before TEXT,
    condition_after TEXT,
    signature_data TEXT,
    notes TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(equipment_id) REFERENCES equipment(id),
    FOREIGN KEY(user_id) REFERENCES staff(id),
    FOREIGN KEY(customer_id) REFERENCES customers(id)
  );

  CREATE TABLE IF NOT EXISTS checkout_reports (
    id TEXT PRIMARY KEY,
    customer_id TEXT,
    staff_id TEXT, -- Warehouse worker (e.g. Fouad)
    technician_id TEXT, -- Receiver (e.g. Moh)
    project_name TEXT,
    notes TEXT,
    status TEXT DEFAULT 'Active', -- 'Active', 'Returned', 'Partial'
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(customer_id) REFERENCES customers(id),
    FOREIGN KEY(staff_id) REFERENCES staff(id),
    FOREIGN KEY(technician_id) REFERENCES staff(id)
  );

  CREATE TABLE IF NOT EXISTS checkout_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    report_id TEXT,
    equipment_id TEXT,
    condition_at_checkout TEXT,
    condition_at_checkin TEXT,
    returned_at DATETIME,
    FOREIGN KEY(report_id) REFERENCES checkout_reports(id),
    FOREIGN KEY(equipment_id) REFERENCES equipment(id)
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );
`);

// Seed Initial Data if empty
const equipmentCount = db.prepare("SELECT COUNT(*) as count FROM equipment").get() as any;
if (equipmentCount.count === 0) {
  const seedEquipment = [
    ['1', 'ARRI Alexa Mini LF', 'Camera', 'ARRI', 'Mini LF', 'ALX-10293', 'CAM001', 'Good', 'Available', 'Shelf A1'],
    ['2', 'RED V-Raptor 8K', 'Camera', 'RED', 'V-Raptor', 'RED-99281', 'CAM002', 'New', 'Available', 'Shelf A1'],
    ['3', 'Cooke S7/i 50mm T2.0', 'Lens', 'Cooke', 'S7/i', 'CK-50-12', 'LNS001', 'Good', 'Available', 'Shelf B2'],
    ['4', 'Aputure 600d Pro', 'Lighting', 'Aputure', '600d Pro', 'AP-600-99', 'LGT001', 'Good', 'Available', 'Shelf C3'],
    ['5', 'SmallHD Cine 7', 'Monitor', 'SmallHD', 'Cine 7', 'SHD-7721', 'MON001', 'Good', 'Available', 'Shelf D1']
  ];

  const insertEquipment = db.prepare(`
    INSERT INTO equipment (id, name, category, brand, model, serial_number, barcode, condition, status, location)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const item of seedEquipment) {
    insertEquipment.run(...item);
  }

  db.prepare(`
    INSERT INTO staff (id, name, role, email, status)
    VALUES ('system', 'System Admin', 'Admin', 'admin@cineware.pro', 'Active')
  `).run();

  db.prepare(`
    INSERT INTO customers (id, name, company, email)
    VALUES ('cust1', 'John Doe', 'Production House X', 'john@productionx.com')
  `).run();
}

// Seed default settings
const settingsCount = db.prepare("SELECT COUNT(*) as count FROM settings").get() as any;
if (settingsCount.count === 0) {
  const defaultSettings = [
    ['company_name', 'CineWare Pro'],
    ['company_address', '123 Production Lane, Hollywood, CA'],
    ['company_phone', '+1 (555) 000-1234'],
    ['company_email', 'rentals@cineware.pro'],
    ['company_website', 'www.cineware.pro'],
    ['company_logo', '']
  ];
  const insertSetting = db.prepare("INSERT INTO settings (key, value) VALUES (?, ?)");
  for (const [key, value] of defaultSettings) {
    insertSetting.run(key, value);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // API Routes
  
  // Equipment
  app.get("/api/equipment", (req, res) => {
    const items = db.prepare("SELECT * FROM equipment ORDER BY created_at DESC").all();
    res.json(items);
  });

  app.get("/api/equipment/lookup/:code", (req, res) => {
    const code = req.params.code;
    const item = db.prepare("SELECT * FROM equipment WHERE id = ? OR barcode = ?").get(code, code);
    if (item) {
      res.json(item);
    } else {
      res.status(404).json({ error: "Equipment not found" });
    }
  });

  app.post("/api/equipment", (req, res) => {
    const { id, name, category, brand, model, serial_number, barcode, condition, location, notes, price_per_day } = req.body;
    try {
      const info = db.prepare(`
        INSERT INTO equipment (id, name, category, brand, model, serial_number, barcode, condition, location, notes, price_per_day)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(id, name, category, brand, model, serial_number, barcode, condition, location, notes, price_per_day || 0);
      res.json({ success: true, id });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.put("/api/equipment/:id", (req, res) => {
    const { name, category, brand, model, serial_number, barcode, condition, status, location, notes, price_per_day } = req.body;
    try {
      db.prepare(`
        UPDATE equipment SET 
          name = ?, category = ?, brand = ?, model = ?, serial_number = ?, 
          barcode = ?, condition = ?, status = ?, location = ?, notes = ?, price_per_day = ?
        WHERE id = ?
      `).run(name, category, brand, model, serial_number, barcode, condition, status, location, notes, price_per_day || 0, req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Maintenance
  app.get("/api/equipment/:id/maintenance", (req, res) => {
    const logs = db.prepare(`
      SELECT m.*, s.name as staff_name
      FROM maintenance_logs m
      LEFT JOIN staff s ON m.staff_id = s.id
      WHERE m.equipment_id = ?
      ORDER BY m.timestamp DESC
    `).all(req.params.id);
    res.json(logs);
  });

  app.post("/api/equipment/:id/maintenance", (req, res) => {
    const { staff_id, issue, action_taken, cost, status } = req.body;
    const equipment_id = req.params.id;
    
    const transaction = db.transaction(() => {
      db.prepare(`
        INSERT INTO maintenance_logs (equipment_id, staff_id, issue, action_taken, cost)
        VALUES (?, ?, ?, ?, ?)
      `).run(equipment_id, staff_id, issue, action_taken, cost);
      
      if (status) {
        db.prepare("UPDATE equipment SET status = ? WHERE id = ?").run(status, equipment_id);
      }
    });

    try {
      transaction();
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Customers
  app.get("/api/customers", (req, res) => {
    const items = db.prepare("SELECT * FROM customers").all();
    res.json(items);
  });

  app.post("/api/customers", (req, res) => {
    const { id, name, company, phone, email, address, notes } = req.body;
    db.prepare(`
      INSERT INTO customers (id, name, company, phone, email, address, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, name, company, phone, email, address, notes);
    res.json({ success: true, id });
  });

  // Sub-rentals
  app.get("/api/sub-rentals", (req, res) => {
    const items = db.prepare(`
      SELECT s.*, e.name as equipment_name
      FROM sub_rentals s
      JOIN equipment e ON s.equipment_id = e.id
    `).all();
    res.json(items);
  });

  app.post("/api/sub-rentals", (req, res) => {
    const { id, equipment_id, vendor_name, start_date, end_date, cost, notes } = req.body;
    db.prepare(`
      INSERT INTO sub_rentals (id, equipment_id, vendor_name, start_date, end_date, cost, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, equipment_id, vendor_name, start_date, end_date, cost, notes);
    res.json({ success: true, id });
  });

  // Insurance
  app.get("/api/customers/:id/insurance", (req, res) => {
    const certs = db.prepare("SELECT * FROM insurance_certificates WHERE customer_id = ?").all(req.params.id);
    res.json(certs);
  });

  app.post("/api/customers/:id/insurance", (req, res) => {
    const { id, policy_number, expiry_date, coverage_amount, file_url } = req.body;
    db.prepare(`
      INSERT INTO insurance_certificates (id, customer_id, policy_number, expiry_date, coverage_amount, file_url)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, req.params.id, policy_number, expiry_date, coverage_amount, file_url);
    res.json({ success: true, id });
  });

  // Staff
  app.get("/api/staff", (req, res) => {
    const items = db.prepare("SELECT * FROM staff").all();
    res.json(items);
  });

  app.post("/api/staff", (req, res) => {
    const { id, name, role, phone, email, password } = req.body;
    db.prepare(`
      INSERT INTO staff (id, name, role, phone, email, password)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, name, role, phone, email, password);
    res.json({ success: true, id });
  });

  // Transactions
  app.get("/api/transactions", (req, res) => {
    const items = db.prepare(`
      SELECT t.*, e.name as equipment_name, s.name as user_name, c.name as customer_name
      FROM transactions t
      LEFT JOIN equipment e ON t.equipment_id = e.id
      LEFT JOIN staff s ON t.user_id = s.id
      LEFT JOIN customers c ON t.customer_id = c.id
      ORDER BY t.timestamp DESC
    `).all();
    res.json(items);
  });

  app.post("/api/transactions", (req, res) => {
    const { id, equipment_id, action_type, user_id, customer_id, technician_id, condition_before, condition_after, signature_data, notes } = req.body;
    
    const transaction = db.transaction(() => {
      // Insert transaction
      db.prepare(`
        INSERT INTO transactions (id, equipment_id, action_type, user_id, customer_id, technician_id, condition_before, condition_after, signature_data, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(id, equipment_id, action_type, user_id, customer_id, technician_id, condition_before, condition_after, signature_data, notes);

      // Update equipment status
      const newStatus = action_type === 'Check-Out' ? 'Checked Out' : 'Available';
      const newCondition = condition_after || condition_before;
      db.prepare(`UPDATE equipment SET status = ?, condition = ? WHERE id = ?`)
        .run(newStatus, newCondition, equipment_id);
    });

    try {
      transaction();
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Multi-item Checkout/Checkin
  app.post("/api/checkout-reports", (req, res) => {
    const { id, customer_id, staff_id, technician_id, project_name, notes, items } = req.body;
    console.log('Checkout Request:', { id, customer_id, staff_id, technician_id, project_name, itemsCount: items?.length });
    
    const transaction = db.transaction(() => {
      try {
        // Create report
        db.prepare(`
          INSERT INTO checkout_reports (id, customer_id, staff_id, technician_id, project_name, notes)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(id, customer_id, staff_id, technician_id, project_name, notes);

        // Add items and update equipment status
        const insertItem = db.prepare(`
          INSERT INTO checkout_items (report_id, equipment_id, condition_at_checkout)
          VALUES (?, ?, ?)
        `);
        const updateEquipment = db.prepare(`UPDATE equipment SET status = 'Checked Out' WHERE id = ?`);
        const insertHistory = db.prepare(`
          INSERT INTO transactions (id, equipment_id, action_type, user_id, customer_id, technician_id, condition_before, notes)
          VALUES (?, ?, 'Check-Out', ?, ?, ?, ?, ?)
        `);

        for (const item of items) {
          insertItem.run(id, item.id, item.condition);
          updateEquipment.run(item.id);
          // user_id is the staff_id (warehouse worker)
          insertHistory.run(`${id}-${item.id}`, item.id, staff_id, customer_id, technician_id, item.condition, notes);
        }
      } catch (err: any) {
        console.error('Transaction Error:', err.message);
        throw err;
      }
    });

    try {
      transaction();
      console.log('Checkout Successful:', id);
      res.json({ success: true, id });
    } catch (error: any) {
      console.error('Checkout Failed:', error.message);
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/checkout-reports/:id", (req, res) => {
    const report = db.prepare(`
      SELECT r.*, c.name as customer_name, s1.name as staff_name, s2.name as technician_name
      FROM checkout_reports r
      LEFT JOIN customers c ON r.customer_id = c.id
      LEFT JOIN staff s1 ON r.staff_id = s1.id
      LEFT JOIN staff s2 ON r.technician_id = s2.id
      WHERE r.id = ?
    `).get(req.params.id) as any;

    if (!report) return res.status(404).json({ error: "Report not found" });

    const items = db.prepare(`
      SELECT i.*, e.name as equipment_name, e.barcode, e.price_per_day
      FROM checkout_items i
      JOIN equipment e ON i.equipment_id = e.id
      WHERE i.report_id = ?
    `).all(req.params.id);

    res.json({ ...report, items });
  });

  app.post("/api/checkin-reports/:id", (req, res) => {
    const { items, technician_id, notes } = req.body; // items is array of { equipment_id, condition_at_checkin }
    const reportId = req.params.id;

    const transaction = db.transaction(() => {
      const updateItem = db.prepare(`
        UPDATE checkout_items 
        SET condition_at_checkin = ?, returned_at = CURRENT_TIMESTAMP 
        WHERE report_id = ? AND equipment_id = ?
      `);
      const updateEquipment = db.prepare(`UPDATE equipment SET status = 'Available', condition = ? WHERE id = ?`);
      const insertHistory = db.prepare(`
        INSERT INTO transactions (id, equipment_id, action_type, user_id, technician_id, condition_before, condition_after, notes)
        VALUES (?, ?, 'Check-In', ?, ?, ?, ?, ?)
      `);

      for (const item of items) {
        // Get current condition for history
        const currentItem = db.prepare("SELECT condition FROM equipment WHERE id = ?").get(item.equipment_id) as any;
        
        updateItem.run(item.condition_at_checkin, reportId, item.equipment_id);
        updateEquipment.run(item.condition_at_checkin, item.equipment_id);
        // user_id is the staff member receiving, technician_id is the same for check-in record
        insertHistory.run(`${reportId}-in-${item.equipment_id}`, item.equipment_id, technician_id, technician_id, currentItem.condition, item.condition_at_checkin, notes);
      }

      // Check if all items are returned
      const remaining = db.prepare(`
        SELECT COUNT(*) as count FROM checkout_items 
        WHERE report_id = ? AND returned_at IS NULL
      `).get(reportId) as any;

      const newStatus = remaining.count === 0 ? 'Returned' : 'Partial';
      db.prepare("UPDATE checkout_reports SET status = ? WHERE id = ?").run(newStatus, reportId);
    });

    try {
      transaction();
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Reports
  app.get("/api/reports/inventory", (req, res) => {
    const items = db.prepare("SELECT * FROM equipment").all();
    res.json(items);
  });

  app.get("/api/reports/active-rentals", (req, res) => {
    const reports = db.prepare(`
      SELECT r.*, c.name as customer_name, s.name as technician_name,
             (SELECT COUNT(*) FROM checkout_items WHERE report_id = r.id) as total_items,
             (SELECT COUNT(*) FROM checkout_items WHERE report_id = r.id AND returned_at IS NOT NULL) as returned_items
      FROM checkout_reports r
      LEFT JOIN customers c ON r.customer_id = c.id
      LEFT JOIN staff s ON r.technician_id = s.id
      WHERE r.status != 'Returned'
      ORDER BY r.timestamp DESC
    `).all();
    res.json(reports);
  });

  app.get("/api/checkout-reports/equipment/:equipmentId", (req, res) => {
    const report = db.prepare(`
      SELECT r.*, c.name as customer_name, s1.name as staff_name, s2.name as technician_name
      FROM checkout_reports r
      JOIN checkout_items i ON r.id = i.report_id
      LEFT JOIN customers c ON r.customer_id = c.id
      LEFT JOIN staff s1 ON r.staff_id = s1.id
      LEFT JOIN staff s2 ON r.technician_id = s2.id
      WHERE i.equipment_id = ? AND i.returned_at IS NULL
      ORDER BY r.timestamp DESC
      LIMIT 1
    `).get(req.params.equipmentId) as any;

    if (!report) return res.status(404).json({ error: "No active rental found for this equipment" });

    const items = db.prepare(`
      SELECT i.*, e.name as equipment_name, e.barcode
      FROM checkout_items i
      JOIN equipment e ON i.equipment_id = e.id
      WHERE i.report_id = ?
    `).all(report.id);

    res.json({ ...report, items });
  });

  app.get("/api/reports/usage", (req, res) => {
    const usage = db.prepare(`
      SELECT e.name, e.category, COUNT(t.id) as rental_count
      FROM equipment e
      LEFT JOIN transactions t ON e.id = t.equipment_id AND t.action_type = 'Check-Out'
      GROUP BY e.id
      ORDER BY rental_count DESC
    `).all();
    res.json(usage);
  });

  app.get("/api/reports/maintenance-all", (req, res) => {
    const logs = db.prepare(`
      SELECT m.*, e.name as equipment_name, s.name as staff_name
      FROM maintenance_logs m
      JOIN equipment e ON m.equipment_id = e.id
      LEFT JOIN staff s ON m.staff_id = s.id
      ORDER BY m.timestamp DESC
    `).all();
    res.json(logs);
  });

  // Dashboard Stats
  app.get("/api/stats", (req, res) => {
    const total = db.prepare("SELECT COUNT(*) as count FROM equipment").get() as any;
    const available = db.prepare("SELECT COUNT(*) as count FROM equipment WHERE status = 'Available'").get() as any;
    const rented = db.prepare("SELECT COUNT(*) as count FROM equipment WHERE status = 'Checked Out'").get() as any;
    const maintenance = db.prepare("SELECT COUNT(*) as count FROM equipment WHERE status = 'Maintenance'").get() as any;
    
    const recentActivity = db.prepare(`
      SELECT t.*, e.name as equipment_name
      FROM transactions t
      JOIN equipment e ON t.equipment_id = e.id
      ORDER BY t.timestamp DESC
      LIMIT 5
    `).all();

    res.json({
      total: total.count,
      available: available.count,
      rented: rented.count,
      maintenance: maintenance.count,
      recentActivity
    });
  });

  // Admin / Reset
  app.post("/api/admin/reset-transactions", (req, res) => {
    try {
      const transaction = db.transaction(() => {
        db.prepare("DELETE FROM transactions").run();
        db.prepare("DELETE FROM checkout_items").run();
        db.prepare("DELETE FROM checkout_reports").run();
        db.prepare("DELETE FROM maintenance_logs").run();
        db.prepare("UPDATE equipment SET status = 'Available'").run();
      });
      transaction();
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Equipment Import
  app.post("/api/equipment/import", (req, res) => {
    const items = req.body; // Array of equipment objects
    const transaction = db.transaction(() => {
      const insert = db.prepare(`
        INSERT INTO equipment (id, name, category, brand, model, serial_number, barcode, condition, status, location, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      const results = {
        imported: 0,
        skipped: 0,
        errors: [] as string[]
      };

      for (const item of items) {
        try {
          // Check for duplicate serial number if provided
          if (item.serial_number) {
            const existing = db.prepare("SELECT id FROM equipment WHERE serial_number = ?").get(item.serial_number);
            if (existing) {
              results.skipped++;
              continue;
            }
          }

          // Generate ID if not provided
          const id = item.id || `EQ-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
          const barcode = item.barcode || id;

          insert.run(
            id,
            item.name,
            item.category || 'General',
            item.brand || '',
            item.model || '',
            item.serial_number || '',
            barcode,
            item.condition || 'Good',
            'Available',
            item.location || '',
            item.notes || ''
          );
          results.imported++;
        } catch (err: any) {
          results.errors.push(`Error importing ${item.name}: ${err.message}`);
        }
      }
      return results;
    });

    try {
      const results = transaction();
      res.json(results);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Kits
  app.get("/api/equipment/:id/components", (req, res) => {
    const components = db.prepare(`
      SELECT e.* 
      FROM equipment e
      JOIN kit_components kc ON e.id = kc.component_id
      WHERE kc.kit_id = ?
    `).all(req.params.id);
    res.json(components);
  });

  app.post("/api/equipment/:id/components", (req, res) => {
    const { componentIds } = req.body;
    const kitId = req.params.id;
    
    const transaction = db.transaction(() => {
      db.prepare("DELETE FROM kit_components WHERE kit_id = ?").run(kitId);
      const insert = db.prepare("INSERT INTO kit_components (kit_id, component_id) VALUES (?, ?)");
      for (const compId of componentIds) {
        insert.run(kitId, compId);
      }
    });

    try {
      transaction();
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Settings
  app.get("/api/settings", (req, res) => {
    const settings = db.prepare("SELECT * FROM settings").all() as any[];
    const settingsObj = settings.reduce((acc, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {});
    res.json(settingsObj);
  });

  app.post("/api/settings", (req, res) => {
    const settings = req.body;
    const updateSetting = db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)");
    const transaction = db.transaction(() => {
      for (const [key, value] of Object.entries(settings)) {
        updateSetting.run(key, value);
      }
    });
    try {
      transaction();
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
