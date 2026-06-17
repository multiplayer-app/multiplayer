module.exports = {
  async up(db, client) {
    await db.collection('roles').updateMany({ type: 'TEAM' }, { $set: { type: 'PROJECT' } })
  },

  async down(db, client) {
    await db.collection('roles').updateMany({ type: 'PROJECT' }, { $set: { type: 'TEAM' } })
  },
}
