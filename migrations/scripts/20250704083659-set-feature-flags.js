module.exports = {
  async up(db, client) {
    await db.collection('workspaces').updateMany({}, { $set: {
      'featureFlags.PLATFORM': true,
      'featureFlags.PROJECT_BRANCH': true,
    } })
  },

  async down(db, client) {
    await db.collection('workspaces').updateMany({}, {
      $unset: {
        'featureFlags.PLATFORM': false,
        'featureFlags.PROJECT_BRANCH': false,
      },
    })
  },
}
