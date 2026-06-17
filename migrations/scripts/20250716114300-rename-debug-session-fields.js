module.exports = {
  async up(db, client) {
    await db.collection('debug-sessions').updateMany(
      { },
      [
        {
          $set: {
            metadata: {
              $mergeObjects: ['$metadata', '$userMetadata'],
            },
          },
        },
      ],
    )

    await db.collection('debug-sessions').updateMany(
      {
        metadata: { $exists: true },
      },
      {
        $rename: {
          metadata: 'sessionAttributes',
        },
      },
    )
    await db.collection('debug-sessions').updateMany(
      {
        clientMetadata: { $exists: true },
      },
      {
        $rename: {
          clientMetadata: 'resourceAttributes',
        },
      },
    )
  },

  async down(db, client) {
    await db.collection('debug-sessions').updateMany(
      {
        sessionAttributes: { $exists: true },
      },
      {
        $rename: {
          sessionAttributes: 'metadata',
        },
      },
    )

    await db.collection('debug-sessions').updateMany(
      {
        resourceAttributes: { $exists: true },
      },
      {
        $rename: {
          resourceAttributes: 'clientMetadata',
        },
      },
    )
  },
}
