import mongoose from 'mongoose'

const connections: Record<string, mongoose.Connection> = {}

export async function connectDB(dbName: string): Promise<mongoose.Connection> {
  if (connections[dbName]) return connections[dbName]

  const uri = process.env.MONGODB_URI
  if (!uri) throw new Error('MONGODB_URI environment variable is not set')

  const conn = await mongoose.createConnection(uri, { dbName }).asPromise()
  connections[dbName] = conn
  return conn
}

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    isApproved: { type: Boolean, default: false },
  },
  { timestamps: true },
)

export async function getUserModel() {
  const conn = await connectDB('auth')
  return conn.models.User || conn.model('User', userSchema)
}
