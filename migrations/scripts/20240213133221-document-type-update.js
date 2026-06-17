module.exports = {
  async up(db, client) {
    await db.collection('entities').updateMany({ type: 'document' }, { $set: { type: 'notebook' } })
    await db.collection('entity-commits').updateMany({ entityType: 'document' }, { $set: { entityType: 'notebook' } })
    await db.collection('project-links').updateMany({ sourceEntityType: 'document' }, { $set: { sourceEntityType: 'notebook' } })
    await db.collection('project-links').updateMany({ targetEntityType: 'document' }, { $set: { targetEntityType: 'notebook' } })
  },

  async down(db, client) {
    await db.collection('entities').updateMany({ type: 'notebook' }, { $set: { type: 'document' } })
    await db.collection('entity-commits').updateMany({ entityType: 'notebook' }, { $set: { entityType: 'document' } })
    await db.collection('project-links').updateMany({ sourceEntityType: 'notebook' }, { $set: { sourceEntityType: 'document' } })
    await db.collection('project-links').updateMany({ targetEntityType: 'notebook' }, { $set: { targetEntityType: 'document' } })
  },
}
