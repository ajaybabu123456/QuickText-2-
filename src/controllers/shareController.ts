import { Request, Response } from 'express';
import Share, { IShare } from '../models/Share';
import crypto from 'crypto';
import bcrypt from 'bcrypt';

// Generate unique 4-character code (like qtext.io)
const generateCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Hash password with salt
const hashPassword = async (password: string): Promise<{ hash: string; salt: string }> => {
  const salt = await bcrypt.genSalt(12);
  const hash = await bcrypt.hash(password, salt);
  return { hash, salt };
};

// Verify password
const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

// Calculate expiry time based on duration
const calculateExpiry = (duration: string): Date => {
  const now = new Date();
  switch (duration) {
    case '5m': return new Date(now.getTime() + 5 * 60 * 1000);
    case '15m': return new Date(now.getTime() + 15 * 60 * 1000);
    case '30m': return new Date(now.getTime() + 30 * 60 * 1000);
    case '1h': return new Date(now.getTime() + 60 * 60 * 1000);
    default: return new Date(now.getTime() + 15 * 60 * 1000); // Default 15 minutes
  }
};

// Detect programming language from content
const detectLanguage = (content: string): string | undefined => {
  const patterns = {
    javascript: /\b(function|const|let|var|=>|console\.log|document\.)\b/,
    python: /\b(def|import|from|print|if __name__|class)\b/,
    java: /\b(public class|public static void|System\.out\.println)\b/,
    cpp: /\b(#include|iostream|cout|cin|namespace std)\b/,
    html: /<[^>]+>/,
    css: /\{[^}]*\}/,
    sql: /\b(SELECT|INSERT|UPDATE|DELETE|FROM|WHERE)\b/i,
    json: /^\s*[\{\[]/,
    xml: /<\?xml|<[a-zA-Z][^>]*>/
  };

  for (const [lang, pattern] of Object.entries(patterns)) {
    if (pattern.test(content)) {
      return lang;
    }
  }
  return undefined;
};

export const createShare = async (req: Request, res: Response): Promise<void> => {
  try {
    const { 
      content, 
      password, 
      duration = '15m', 
      oneTimeAccess = false,
      contentType = 'text',
      language,
      maxViews = -1
    } = req.body;
    
    if (!content) {
      res.status(400).json({ error: 'Content is required' });
      return;
    }

    if (content.length > 50000) { // 50KB limit
      res.status(400).json({ error: 'Content too large. Maximum 50KB allowed.' });
      return;
    }

    const clientIP = req.ip || req.connection.remoteAddress;
    let code = generateCode();
    
    // Ensure unique code
    while (await Share.findOne({ code })) {
      code = generateCode();
    }

    const shareData: any = {
      code,
      data: content,
      expiresAt: calculateExpiry(duration),
      oneTimeAccess,
      contentType,
      ipAddress: clientIP,
      maxViews: maxViews > 0 ? maxViews : -1
    };

    // Add password protection if provided
    if (password) {
      const { hash, salt } = await hashPassword(password);
      shareData.password = hash;
      shareData.salt = salt;
    }

    // Auto-detect language for code content
    if (contentType === 'code' && !language) {
      shareData.language = detectLanguage(content);
    } else if (language) {
      shareData.language = language;
    }

    const share = new Share(shareData);
    await share.save();
    
    res.json({ 
      code,
      expiresAt: shareData.expiresAt,
      hasPassword: !!password,
      oneTimeAccess,
      contentType,
      language: shareData.language
    });
  } catch (error) {
    console.error('Create share error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const getShare = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code } = req.params;
    const { password } = req.body;
    
    const share: IShare | null = await Share.findOne({ 
      code,
      expiresAt: { $gt: new Date() }
    });
    
    if (!share) {
      res.status(404).json({ error: 'Share not found or expired' });
      return;
    }

    if (share.oneTimeAccess && share.isAccessed) {
      res.status(410).json({ error: 'This share has already been accessed and is no longer available' });
      return;
    }

    const maxViews = share.maxViews ?? -1;
    if (maxViews > 0 && share.views >= maxViews) {
      res.status(410).json({ error: 'This share has reached its maximum view limit' });
      return;
    }

    if (share.password) {
      if (!password) {
        res.status(401).json({ 
          error: 'Password required',
          requiresPassword: true 
        });
        return;
      }

      const isValidPassword = await verifyPassword(password, share.password);
      if (!isValidPassword) {
        res.status(401).json({ error: 'Invalid password' });
        return;
      }
    }

    share.views += 1;
    if (share.oneTimeAccess) {
      share.isAccessed = true;
    }
    await share.save();

    res.json({ 
      content: share.data,
      views: share.views,
      contentType: share.contentType,
      language: share.language,
      oneTimeAccess: share.oneTimeAccess,
      expiresAt: share.expiresAt,
      createdAt: share.createdAt
    });

    if (share.oneTimeAccess) {
      await Share.deleteOne({ _id: share._id });
    }
  } catch (error) {
    console.error('Get share error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const updateShare = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code } = req.params;
    const { content } = req.body;
    
    if (!content) {
      res.status(400).json({ error: 'Content is required' });
      return;
    }

    const share = await Share.findOne({ code });
    if (!share) {
      res.status(404).json({ error: 'Share not found' });
      return;
    }

    share.data = content;
    await share.save();
    
    res.json({ message: 'Share updated successfully' });
  } catch (error) {
    console.error('Update share error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
