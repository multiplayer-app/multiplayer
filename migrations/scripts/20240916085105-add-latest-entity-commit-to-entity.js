module.exports = {
  async up(db, client) {
    await db.collection('entities').aggregate([
      {
        $match: {
          createdAtCommit: { $ne: null },
        },
      },
      {
        $lookup: {
          from: 'entity-commits',
          localField: 'entityId',
          foreignField: 'entity',
          as: 'entityCommit',
          let: { entityBranch: '$projectBranch' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$linkedToCommit', true] },
                    { $eq: ['$projectBranch', '$$entityBranch'] },
                  ],
                },
              },
            },
            { $sort: { _id: -1 } },
            { $limit: 1 },
          ],
        },
      },
      {
        $unwind: {
          path: '$entityCommit',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $set: {
          latestEntityCommit: {
            $ifNull: ['$entityCommit._id', null],
          },
        },
      },
      {
        $unset: 'entityCommit',
      },
      {
        $merge: {
          into: 'entities',
          on: '_id',
          whenMatched: 'merge',
          whenNotMatched: 'discard',
        },
      },
    ])
  },

  async down(db, client) {
    await db.collection('entities').updateMany({}, { $unset: 'latestEntityCommit' })
  },
}
