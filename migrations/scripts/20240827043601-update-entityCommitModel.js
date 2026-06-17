module.exports = {
  async up(db, client) {
    await db.collection('entity-commits').updateMany({ commit: { $ne: null } }, { $set: { linkedToCommit: true } })
  },

  async down(db, client) {
    await db.collection('entity-commits').updateMany({}, { $set: { linkedToCommit: false } })
  },
}
