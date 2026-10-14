module.exports = {
  async up(db, client) {
    await db.collection('users').updateMany(
      { 'invite.queueNumber': { $exists: true } },
      { $unset: { 'invite.queueNumber': '' } },
    )

    try {
      await db.collection('users').dropIndex('invite.queueNumber_1')
    } catch (err) {
      if (err.codeName !== 'IndexNotFound' && err.codeName !== 'NamespaceNotFound') {
        throw err
      }
    }

    try {
      await db.collection('counters').drop()
    } catch (err) {
      if (err.codeName !== 'NamespaceNotFound') {
        throw err
      }
    }
  },

  // Not meaningfully reversible - the sequential queue numbers and the
  // counter document that generated them are gone, not just hidden.
  async down(db, client) {
  },
}
