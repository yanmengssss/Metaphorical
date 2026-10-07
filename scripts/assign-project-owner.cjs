// Run against the target service's environment; never guesses an owner or database.
const fs = require('node:fs');
const path = require('node:path');
const { MongoClient, BSON: { EJSON } } = require('mongoose').mongo;

async function main() {
  const [mode, manifestPath] = process.argv.slice(2);
  if (!['--plan', '--apply'].includes(mode) || !manifestPath) {
    throw new Error('Usage: node scripts/assign-project-owner.cjs --plan|--apply <manifest.json>');
  }
  const uri = process.env.MONGODB_DATABASE_URL || process.env.MONGODB_URI;
  const ownerUserId = process.env.MIGRATION_OWNER_USER_ID?.trim();
  if (!uri || !ownerUserId) throw new Error('Explicit MongoDB URI and verified MIGRATION_OWNER_USER_ID are required');
  // Resolve this ID from the target environment's user service/database before running.
  const user = { userId: ownerUserId, email: '1657294032@qq.com' };
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 10000 });
  try {
    await client.connect();
    const db = client.db();
    const projects = db.collection('projects');
    if (mode === '--plan') {
      const rows = await projects.find({}, { projection: { _id: 1, key: 1, ownerUserId: 1 } }).toArray();
      const manifest = { service: 'metaphorical', database: db.databaseName, ownerUserId: user.userId, email: user.email,
        createdAt: new Date().toISOString(), projects: rows };
      fs.mkdirSync(path.dirname(path.resolve(manifestPath)), { recursive: true });
      fs.writeFileSync(manifestPath, EJSON.stringify(manifest, null, 2), { flag: 'wx', mode: 0o600 });
      console.log(JSON.stringify({ database: db.databaseName, userId: user.userId, projects: rows.length, manifest: manifestPath }));
      return;
    }
    const manifest = EJSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    if (manifest.service !== 'metaphorical' || manifest.database !== db.databaseName || manifest.ownerUserId !== user.userId) {
      throw new Error('Manifest does not match service, database and verified user');
    }
    let changed = 0;
    for (const project of manifest.projects) {
      const previousOwner = Object.hasOwn(project, 'ownerUserId') ? { $eq: project.ownerUserId, $exists: true } : { $exists: false };
      const result = await projects.updateOne({ _id: project._id, key: project.key,
        $or: [{ ownerUserId: previousOwner }, { ownerUserId: user.userId }] }, { $set: { ownerUserId: user.userId } });
      if (result.matchedCount !== 1) throw new Error('Project changed since snapshot; inspect manifest before retrying: ' + project._id);
      changed += result.modifiedCount;
    }
    await projects.createIndex({ ownerUserId: 1 });
    const verified = await projects.countDocuments({ _id: { $in: manifest.projects.map(p => p._id) }, ownerUserId: user.userId });
    if (verified !== manifest.projects.length) throw new Error('Ownership verification failed');
    console.log(JSON.stringify({ userId: user.userId, changed, verified }));
  } finally { await client.close(); }
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
