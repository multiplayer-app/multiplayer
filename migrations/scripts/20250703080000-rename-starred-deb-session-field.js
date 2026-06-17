module.exports = {
  async up(db, client) {
    await db.collection('debug-sessions').updateMany(
      {
        starred: { $exists: true },
      },
      {
        $rename: {
          starred: 'starredItems',
        },
      },
    )
  },

  async down(db, client) {
    await db.collection('debug-sessions').updateMany(
      {
        starred: { $exists: true },
      },
      {
        $unset: {
          starred: '',
        },
      },
    )

    await db.collection('debug-sessions').updateMany(
      {
        starredItems: { $exists: true },
      },
      {
        $rename: {
          starredItems: 'starred',
        },
      },
    )
  },
}
