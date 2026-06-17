module.exports = {
  async up(db, client) {
    await db.collection('entity-updates').aggregate([
      {
        $project: {
          bsonSize: { $bsonSize: '$$ROOT' },
        },
      },
      { $match: { bsonSize: { $gt: 5e5 } } },
      { $set: { status: 'IN_PROGRESS' } },
      { $unset: 'bsonSize' },
      {
        $merge: {
          into: 'entity-updates',
          on: '_id',
          whenMatched: 'merge',
          whenNotMatched: 'discard',
        },
      },
    ])
  },

  async down(db, client) {
    await db.collection('entity-updates').aggregate([
      {
        $match: {
          status: 'IN_PROGRESS',
          update: { $ne: null },
        },
      },
      {
        $project: {
          bsonSize: { $bsonSize: '$$ROOT' },
        },
      },
      { $match: { bsonSize: { $gt: 5e5 } } },
      { $set: { status: undefined } },
      { $unset: 'bsonSize' },
      {
        $merge: {
          into: 'entity-updates',
          on: '_id',
          whenMatched: 'merge',
          whenNotMatched: 'discard',
        },
      },
    ])
  },
}
