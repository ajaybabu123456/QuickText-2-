import mongoose, { Schema, Document } from 'mongoose';

export interface IShare extends Document {
  code: string;
  data: string;
  views: number;
  createdAt: Date;
  expiresAt: Date;
  password?: string;
  salt?: string;
  oneTimeAccess: boolean;
  isAccessed: boolean;
  contentType: 'text' | 'code';
  language?: string;
  ipAddress?: string;
  maxViews?: number;
}

const shareSchema = new Schema({
  code: { type: String, required: true, unique: true },
  data: { type: String, required: true },
  views: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true, expires: 0 }, // Dynamic TTL
  password: { type: String }, // Hashed password
  salt: { type: String }, // Salt for password hashing
  oneTimeAccess: { type: Boolean, default: false },
  isAccessed: { type: Boolean, default: false },
  contentType: { type: String, enum: ['text', 'code'], default: 'text' },
  language: { type: String }, // Programming language for syntax highlighting
  ipAddress: { type: String }, // For rate limiting
  maxViews: { type: Number, default: -1 } // -1 for unlimited, positive number for limited views
});

export default mongoose.model<IShare>('Share', shareSchema);
