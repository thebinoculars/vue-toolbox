import mongoose from 'mongoose'
import { getMongoDBUri } from './utils'

const connections: Record<string, mongoose.Connection> = {}

export async function connectDB(dbName = 'toolbox'): Promise<mongoose.Connection> {
  if (connections[dbName]) {
    return connections[dbName]
  }

  const uri = getMongoDBUri()
  if (!uri) {
    throw new Error('MONGODB_URI environment variable is not set')
  }

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
  const conn = await connectDB()
  return conn.models.User || conn.model('User', userSchema, 'users')
}

const trackSchema = new mongoose.Schema({
  episode: Number,
  titles: {
    en: String,
    ja: String,
  },
  release: String,
  stamps: [
    {
      time: String,
      song: {
        id: Number,
        titles: {
          en: String,
          ja: String,
        },
        time: String,
        time_seconds: Number,
        track: Number,
      },
      album: {
        titles: {
          en: String,
          ja: String,
        },
        release: String,
      },
    },
  ],
})

export async function getTrackModel() {
  const conn = await connectDB()
  return conn.models.OnePieceTrack || conn.model('OnePieceTrack', trackSchema, 'one-piece-tracks')
}

const gameSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
  },
  { timestamps: true },
)

export async function getNesModel() {
  const conn = await connectDB()
  return conn.models.NesGame || conn.model('NesGame', gameSchema, 'nes-games')
}

const albumSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: String,
    isPrivate: { type: Boolean, default: false },
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
  },
  { timestamps: true },
)

export async function getAlbumModel() {
  const conn = await connectDB()
  return conn.models.Album || conn.model('Album', albumSchema, 'albums')
}

const imageSchema = new mongoose.Schema(
  {
    albumId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Album' },
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
    filename: String,
    originalName: String,
    url: String,
    thumbnailUrl: String,
    publicId: String,
    format: String,
    width: Number,
    height: Number,
    size: Number,
  },
  { timestamps: true },
)

export async function getImageModel() {
  const conn = await connectDB()
  return conn.models.Image || conn.model('Image', imageSchema, 'images')
}
