import * as os from 'os'
import type { MongoClientOptions } from 'mongodb'

// The driver loads `os` (for its handshake metadata) through a dynamic `import()` by default. Jest's
// VM sandbox rejects that, and the server then refuses the connection with "Missing required
// sub-document 'driver'" (NODE-7832). Handing the driver the module directly works in every
// runtime. Pass it to every MongoClient; drop it once NODE-7832 ships in a driver release.
export const runtimeAdapters: MongoClientOptions['runtimeAdapters'] = { os }
