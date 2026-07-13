import mongoose from 'mongoose';

// MongoDB is optional: set MONGODB_URI (e.g. an Atlas free-tier cluster) to
// persist articles across serverless cold starts. Without it the app still
// works using the in-memory cache.
let connPromise = null;

export async function getDb() {
  const uri = process.env.MONGODB_URI;
  if (!uri) return null;
  if (!connPromise) {
    connPromise = mongoose
      .connect(uri, { dbName: 'coffeenews', serverSelectionTimeoutMS: 5000 })
      .catch((err) => {
        connPromise = null;
        throw err;
      });
  }
  return connPromise;
}

const articleSchema = new mongoose.Schema(
  {
    link: { type: String, unique: true, index: true },
    title: String,
    snippet: String,
    source: String,
    category: String,
    image: String,
    publishedAt: { type: Date, index: true },
  },
  { timestamps: true }
);

export const Article =
  mongoose.models.Article || mongoose.model('Article', articleSchema);
