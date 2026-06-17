// eslint-disable-next-line
// @ts-ignore
import newrelic from 'newrelic'

// eslint-disable-next-line
// @ts-ignore
newrelic.addCustomAttribute('app_name', 'TEST')
const instrumentMongoose = (shim, mongoose) => {
  shim.setDatastore(shim.MONGODB)

  const mongoProto = mongoose.mongo.MongoClient.prototype
  shim.recordOperation(mongoProto, ['connect', 'close'], { callback: shim.LAST })

  const queryProto = mongoose.Query.prototype
  shim.recordQuery(queryProto, [
    'aggregate',
    'find',
    'findOne',
    'update',
    'updateMany',
    'updateOne',
    'exec',
  ], { callback: shim.LAST })

  const documentProto = mongoose.Document.prototype
  shim.recordQuery(documentProto, [
    'save',
    'update',
    'populate',
    'execPopulate',
  ], { callback: shim.LAST })

  const modelProto = mongoose.Model.prototype
  shim.recordQuery(modelProto, [
    'save',
    'delete',
    'remove',
  ], { callback: shim.LAST })
}

// eslint-disable-next-line
// @ts-ignore
newrelic.instrumentDatastore({
  moduleName: 'mongoose',
  // onError,
  onRequire: instrumentMongoose,
})

export default newrelic
