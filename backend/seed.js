'use strict';
require('dotenv').config();
const mongoose  = require('mongoose');
const Equipment = require('./models/Equipment');
const Request   = require('./models/Request');
const Team      = require('./models/Team');
const User      = require('./models/User');

const URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/maintenx';

async function seed() {
  await mongoose.connect(URI);
  console.log('✅ Connected to MongoDB');

  await Promise.all([Equipment.deleteMany(), Request.deleteMany(), Team.deleteMany(), User.deleteMany()]);
  console.log('🗑  Cleared existing collections');

  // ─── TEAMS ──────────────────────────────────────────────────
  const [itTeam, mechTeam, elecTeam] = await Team.insertMany([
    { name: 'IT Support',  department: 'IT',          color: '#00d4ff', description: 'All IT infrastructure and software issues' },
    { name: 'Mechanical',  department: 'Production',  color: '#8b5cf6', description: 'Production machinery and mechanical systems' },
    { name: 'Electrical',  department: 'Electrical',  color: '#10b981', description: 'Electrical systems, panels, and power management' }
  ]);

  // ─── USERS ──────────────────────────────────────────────────
  const [alex, james, maria, sarah, admin] = await User.insertMany([
    { name: 'Alex Chen',    email: 'alex@maintenx.ai',   role: 'technician', teamId: itTeam._id,   teamName: 'IT Support', skills: ['Networking', 'Hardware', 'Printers'], availability: 'available', currentLoad: 2, metrics: { firstTimeFixRate: 0.91, avgResolutionHours: 3.5, tasksCompleted: 142, rating: 4.7 } },
    { name: 'James Wilson', email: 'james@maintenx.ai',  role: 'technician', teamId: mechTeam._id, teamName: 'Mechanical', skills: ['CNC', 'Conveyors', 'Hydraulics'],     availability: 'busy',      currentLoad: 3, metrics: { firstTimeFixRate: 0.87, avgResolutionHours: 5.2, tasksCompleted: 98,  rating: 4.4 } },
    { name: 'Maria Garcia', email: 'maria@maintenx.ai',  role: 'technician', teamId: elecTeam._id, teamName: 'Electrical', skills: ['Panels', 'HVAC', 'PLC', 'Motors'],   availability: 'available', currentLoad: 1, metrics: { firstTimeFixRate: 0.98, avgResolutionHours: 2.8, tasksCompleted: 187, rating: 4.9 } },
    { name: 'Sarah Kim',    email: 'sarah@maintenx.ai',  role: 'manager',    teamId: elecTeam._id, teamName: 'Electrical', skills: ['Electrical', 'Safety', 'PM'],         availability: 'available', currentLoad: 2, metrics: { firstTimeFixRate: 0.94, avgResolutionHours: 3.1, tasksCompleted: 231, rating: 4.8 } },
    { name: 'Demo Admin',   email: 'demo@maintenx.ai',   role: 'admin',      teamName: 'Management', skills: ['Predictive Maintenance', 'CMMS', 'Leadership'],             availability: 'available', currentLoad: 0, metrics: { firstTimeFixRate: 0.96, avgResolutionHours: 2.0, tasksCompleted: 312, rating: 4.9 } }
  ]);

  await Team.findByIdAndUpdate(itTeam._id,   { members: [alex._id],             leadId: alex._id });
  await Team.findByIdAndUpdate(mechTeam._id,  { members: [james._id],            leadId: james._id });
  await Team.findByIdAndUpdate(elecTeam._id,  { members: [maria._id, sarah._id], leadId: sarah._id });

  // ─── EQUIPMENT ──────────────────────────────────────────────
  const [p1, cnc, ac, srv, conv, ep] = await Equipment.insertMany([
    { name: 'Printer 01',         serialNumber: 'SN-PR-001',  department: 'IT',          location: 'Floor 2, IT Room',       teamId: itTeam._id,   teamName: 'IT Support', technicianId: alex._id,  technicianName: 'Alex Chen',    purchaseDate: new Date('2021-03-15'), warrantyExpiry: new Date('2024-03-15'), status: 'active', usageHours: 2400, totalFailures: 5, installationAge: 45, aiRisk: { level: 'high',   score: 87, failureDays: 3,  confidence: 94 } },
    { name: 'CNC Machine A',      serialNumber: 'SN-CNC-001', department: 'Production',  location: 'Factory Floor A',        teamId: mechTeam._id, teamName: 'Mechanical', technicianId: james._id, technicianName: 'James Wilson', purchaseDate: new Date('2019-06-20'), warrantyExpiry: new Date('2023-06-20'), status: 'active', usageHours: 3800, totalFailures: 8, installationAge: 66, aiRisk: { level: 'high',   score: 76, failureDays: 12, confidence: 91 } },
    { name: 'Office AC Unit',     serialNumber: 'SN-AC-003',  department: 'Maintenance', location: 'Building B, Roof',       teamId: elecTeam._id, teamName: 'Electrical', technicianId: maria._id, technicianName: 'Maria Garcia', purchaseDate: new Date('2020-01-10'), warrantyExpiry: new Date('2025-01-10'), status: 'active', usageHours: 1200, totalFailures: 2, installationAge: 48, aiRisk: { level: 'medium', score: 52, failureDays: 18, confidence: 88 } },
    { name: 'Server Rack 01',     serialNumber: 'SN-SR-007',  department: 'IT',          location: 'Server Room B1',         teamId: itTeam._id,   teamName: 'IT Support', technicianId: alex._id,  technicianName: 'Alex Chen',    purchaseDate: new Date('2022-08-05'), warrantyExpiry: new Date('2025-08-05'), status: 'active', usageHours: 8760, totalFailures: 1, installationAge: 17, aiRisk: { level: 'low',    score: 18, failureDays: 45, confidence: 96 } },
    { name: 'Conveyor Belt B',    serialNumber: 'SN-CB-002',  department: 'Production',  location: 'Factory Floor B',        teamId: mechTeam._id, teamName: 'Mechanical', technicianId: james._id, technicianName: 'James Wilson', purchaseDate: new Date('2020-11-30'), warrantyExpiry: new Date('2024-11-30'), status: 'active', usageHours: 5200, totalFailures: 3, installationAge: 38, aiRisk: { level: 'medium', score: 61, failureDays: 9,  confidence: 89 } },
    { name: 'Electrical Panel 12',serialNumber: 'SN-EP-012',  department: 'Electrical',  location: 'Building A, Basement',   teamId: elecTeam._id, teamName: 'Electrical', technicianId: maria._id, technicianName: 'Maria Garcia', purchaseDate: new Date('2018-04-20'), warrantyExpiry: new Date('2023-04-20'), status: 'active', usageHours: 4100, totalFailures: 4, installationAge: 71, aiRisk: { level: 'medium', score: 44, failureDays: 22, confidence: 85 } }
  ]);

  // ─── REQUESTS ───────────────────────────────────────────────
  const d = days => new Date(Date.now() - days * 86400000);
  await Request.insertMany([
    { subject: 'Printer not working – paper jam and grinding noise',        type: 'Corrective', priority: 'High',   status: 'New',        equipmentId: p1._id,   equipmentName: 'Printer 01',          teamName: 'IT Support', technicianName: 'Alex Chen',    scheduledDate: d(2),  overdue: true,  statusHistory: [{ status: 'New',         changedAt: d(2),  note: 'Created via AI chatbot' }] },
    { subject: 'CNC Machine overheating during production runs',            type: 'Corrective', priority: 'High',   status: 'In Progress',equipmentId: cnc._id,  equipmentName: 'CNC Machine A',       teamName: 'Mechanical', technicianName: 'James Wilson', scheduledDate: d(0),  overdue: false, statusHistory: [{ status: 'New',         changedAt: d(3) }, { status: 'In Progress', changedAt: d(1), note: 'James on site' }] },
    { subject: 'Quarterly AC servicing and filter replacement',             type: 'Preventive', priority: 'Medium', status: 'In Progress',equipmentId: ac._id,   equipmentName: 'Office AC Unit',      teamName: 'Electrical', technicianName: 'Maria Garcia', scheduledDate: d(0),  overdue: false, statusHistory: [{ status: 'New',         changedAt: d(5) }, { status: 'In Progress', changedAt: d(1) }] },
    { subject: 'Server rack cooling fan – intermittent grinding noise',     type: 'Corrective', priority: 'High',   status: 'New',        equipmentId: srv._id,  equipmentName: 'Server Rack 01',      teamName: 'IT Support', technicianName: 'Alex Chen',    scheduledDate: d(5),  overdue: true,  statusHistory: [{ status: 'New',         changedAt: d(5),  note: 'Reported by IT manager' }] },
    { subject: 'Conveyor belt tension adjustment and realignment',          type: 'Preventive', priority: 'Medium', status: 'Repaired',   equipmentId: conv._id, equipmentName: 'Conveyor Belt B',     teamName: 'Mechanical', technicianName: 'James Wilson', scheduledDate: d(8),  overdue: false, completedDate: d(6), statusHistory: [{ status: 'New', changedAt: d(10) }, { status: 'In Progress', changedAt: d(8) }, { status: 'Repaired', changedAt: d(6), note: 'Belt realigned and tensioned. 2h work.' }] },
    { subject: 'Electrical panel 12 annual NEC compliance inspection',      type: 'Preventive', priority: 'Low',    status: 'New',        equipmentId: ep._id,   equipmentName: 'Electrical Panel 12', teamName: 'Electrical', technicianName: 'Maria Garcia', scheduledDate: new Date(Date.now() + 5 * 86400000), overdue: false, statusHistory: [{ status: 'New', changedAt: d(1), note: 'Annual schedule' }] },
    { subject: 'Printer 01 full PM before warranty expiry',                 type: 'Preventive', priority: 'Medium', status: 'Scrap',      equipmentId: p1._id,   equipmentName: 'Printer 01',          teamName: 'IT Support', technicianName: 'Alex Chen',    scheduledDate: d(45), overdue: false, completedDate: d(44), statusHistory: [{ status: 'New', changedAt: d(50) }, { status: 'Repaired', changedAt: d(44) }, { status: 'Scrap', changedAt: d(44), note: 'Too costly. Replacement ordered.' }] },
    { subject: 'CNC spindle bearing replacement after noise anomaly',       type: 'Corrective', priority: 'High',   status: 'Repaired',   equipmentId: cnc._id,  equipmentName: 'CNC Machine A',       teamName: 'Mechanical', technicianName: 'James Wilson', scheduledDate: d(14), overdue: false, completedDate: d(12), statusHistory: [{ status: 'New', changedAt: d(15) }, { status: 'In Progress', changedAt: d(14) }, { status: 'Repaired', changedAt: d(12), note: 'New spindle bearing installed. Test OK.' }] }
  ]);

  console.log(`
  ╔══════════════════════════════════════════╗
  ║   ✅  DATABASE SEEDED SUCCESSFULLY       ║
  ║   Teams:     3                           ║
  ║   Users:     5  (including demo admin)   ║
  ║   Equipment: 6  assets                   ║
  ║   Requests:  8  tickets                  ║
  ║                                          ║
  ║   Demo login: demo@maintenx.ai           ║
  ╚══════════════════════════════════════════╝`);
  process.exit(0);
}

seed().catch(err => { console.error('❌ Seed failed:', err); process.exit(1); });
