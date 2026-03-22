// MongoDB initialization script
// Runs once when the container is first created

db = db.getSiblingDB('maintenx');

// Create collections with validation
db.createCollection('equipment');
db.createCollection('requests');
db.createCollection('teams');
db.createCollection('users');

// Indexes for performance
db.equipment.createIndex({ serialNumber: 1 }, { unique: true });
db.equipment.createIndex({ department: 1, status: 1 });
db.equipment.createIndex({ 'aiRisk.level': 1 });

db.requests.createIndex({ status: 1, priority: 1 });
db.requests.createIndex({ equipmentId: 1 });
db.requests.createIndex({ scheduledDate: 1 });
db.requests.createIndex({ createdAt: -1 });

db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ teamId: 1 });

print('✅ MaintenX database initialized');
