
// src/controllers/messagesController.ts

import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import crypto from 'crypto';

const RAW_KEY = process.env.MESSAGE_ENCRYPTION_KEY ?? 'stalerDefaultKey2025SecureMsg!!';
const ENC_KEY = Buffer.alloc(32);
Buffer.from(RAW_KEY, 'utf8').copy(ENC_KEY);

function encrypt(text: string): string {
  try {
    const iv        = crypto.randomBytes(16);
    const cipher    = crypto.createCipheriv('aes-256-cbc', ENC_KEY, iv);
    const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
    return `ENC|${iv.toString('hex')}|${encrypted.toString('hex')}`;
  } catch {
    return text;
  }
}

function decrypt(text: string): string {
  if (!text) return '';
  try {
    if (text.startsWith('ENC|')) {
      const parts     = text.split('|');
      if (parts.length !== 3) return text;
      const iv        = Buffer.from(parts[1], 'hex');
      const enc       = Buffer.from(parts[2], 'hex');
      const decipher  = crypto.createDecipheriv('aes-256-cbc', ENC_KEY, iv);
      return Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8');
    }
    if (text.startsWith('enc:')) {
      const parts = text.split(':');
      if (parts.length < 3) return text;
      const iv        = Buffer.from(parts[1], 'hex');
      const enc       = Buffer.from(parts[2], 'hex');
      const decipher  = crypto.createDecipheriv('aes-256-cbc', ENC_KEY, iv);
      return Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8');
    }
    return text; 
  } catch {
    return text; 
  }
}

function decryptAll(msgs: any[]): any[] {
  return (msgs || []).map(m => ({ ...m, content: decrypt(m.content) }));
}

class MessagesController {

  async searchUsers(req: Request, res: Response) {
    try {
      const me = req.user.userId;
      const q  = String(req.query.q ?? '').trim();

      if (q.length < 2) {
        return res.status(400).json({ success: false, message: 'At least 2 characters required' });
      }

      const { data: users } = await supabaseAdmin
        .from('users')
        .select('id, full_name, role, profile_image')
        .ilike('full_name', `%${q}%`)
        .neq('id', me)
        .neq('role', 'admin')
        .limit(20);

      const result = (users ?? []).map((u: any) => ({
        id:            u.id,
        full_name:     u.full_name,
        role:          u.role,
        profile_image: u.profile_image,
      }));

      return res.json({ success: true, users: result });

    } catch (err) {
      console.error('searchUsers error:', err);
      return res.status(500).json({ success: false, message: 'Search failed' });
    }
  }

  async getConversations(req: Request, res: Response) {
    try {
      const me = req.user.userId;

      const { data: rows, error } = await supabaseAdmin
        .from('conversation_participants')
        .select(`
          conversation_id,
          last_read_at,
          conversations (
            id, type, title, status, created_at, updated_at, created_by
          )
        `)
        .eq('user_id', me);

      if (error) throw error;

      const result = await Promise.all(
        (rows ?? []).map(async (row: any) => {
          const conv = row.conversations;
          if (!conv) return null;


          const { data: lastRow } = await supabaseAdmin
            .from('messages')
            .select('id, content, created_at, sender_id')
            .eq('conversation_id', conv.id)
            .eq('is_deleted', false)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          const lastMessage = lastRow
            ? { ...lastRow, content: decrypt(lastRow.content) }
            : null;

          const { count: unread } = await supabaseAdmin
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .neq('sender_id', me)
            .eq('is_deleted', false)
            .gt('created_at', row.last_read_at ?? '1970-01-01');

          const { data: parts } = await supabaseAdmin
            .from('conversation_participants')
            .select('user_id, users ( id, full_name, profile_image, role )')
            .eq('conversation_id', conv.id)
            .neq('user_id', me);

          return {
            ...conv,
            lastMessage,
            unreadCount:  unread ?? 0,
            participants: (parts ?? []).map((p: any) => p.users).filter(Boolean),
          };
        })
      );

      const sorted = result
        .filter(Boolean)
        .sort((a: any, b: any) => {
          const ta = a.lastMessage?.created_at ?? a.created_at ?? '';
          const tb = b.lastMessage?.created_at ?? b.created_at ?? '';
          return ta < tb ? 1 : -1;
        });

      return res.json({ success: true, conversations: sorted });

    } catch (err) {
      console.error('getConversations error:', err);
      return res.status(500).json({ success: false, message: 'Failed to fetch conversations' });
    }
  }

  async createConversation(req: Request, res: Response) {
    try {
      const me                    = req.user.userId;
      const { type, recipientId, title } = req.body;

      if (!type) {
        return res.status(400).json({ success: false, message: 'type is required' });
      }

      if (type === 'support') {
        const { data: existing } = await supabaseAdmin
          .from('conversation_participants')
          .select('conversation_id, conversations!inner( id, type, status )')
          .eq('user_id', me);

        for (const row of (existing ?? [])) {
          const c = (row as any).conversations;
          if (c?.type === 'support' && c?.status === 'active') {
            return res.json({ success: true, conversationId: c.id, existing: true });
          }
        }

        const { data: conv, error: ce } = await supabaseAdmin
          .from('conversations')
          .insert({ type: 'support', title: 'Support Request', created_by: me, status: 'active' })
          .select()
          .single();

        if (ce || !conv) throw ce;

        const { data: admins } = await supabaseAdmin
          .from('users').select('id').eq('role', 'admin');

        await supabaseAdmin.from('conversation_participants').insert([
          { conversation_id: conv.id, user_id: me },
          ...((admins ?? []).map((a: any) => ({ conversation_id: conv.id, user_id: a.id }))),
        ]);

        return res.json({ success: true, conversationId: conv.id, existing: false });
      }

      if (!recipientId) {
        return res.status(400).json({ success: false, message: 'recipientId is required' });
      }

      const { data: mineRows } = await supabaseAdmin
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', me);

      for (const row of (mineRows ?? [])) {
        const cid = row.conversation_id;

        const { data: other } = await supabaseAdmin
          .from('conversation_participants')
          .select('user_id')
          .eq('conversation_id', cid)
          .eq('user_id', recipientId)
          .maybeSingle();

        if (!other) continue;

        const { data: convCheck } = await supabaseAdmin
          .from('conversations')
          .select('id, type')
          .eq('id', cid)
          .eq('type', type)
          .maybeSingle();

        if (convCheck) {
          return res.json({ success: true, conversationId: convCheck.id, existing: true });
        }
      }

      const { data: conv, error: ce } = await supabaseAdmin
        .from('conversations')
        .insert({ type, title: title ?? null, created_by: me, status: 'active' })
        .select()
        .single();

      if (ce || !conv) throw ce;

      const { error: pe } = await supabaseAdmin
        .from('conversation_participants')
        .insert([
          { conversation_id: conv.id, user_id: me },
          { conversation_id: conv.id, user_id: recipientId },
        ]);

      if (pe) {
        await supabaseAdmin.from('conversations').delete().eq('id', conv.id);
        throw pe;
      }

      return res.json({ success: true, conversationId: conv.id, existing: false });

    } catch (err) {
      console.error('createConversation error:', err);
      return res.status(500).json({ success: false, message: 'Failed to create conversation' });
    }
  }

  async getMessages(req: Request, res: Response) {
    try {
      const me             = req.user.userId;
      const { conversationId } = req.params;

      const { data: p } = await supabaseAdmin
        .from('conversation_participants')
        .select('id')
        .eq('conversation_id', conversationId)
        .eq('user_id', me)
        .maybeSingle();

      if (!p) return res.status(403).json({ success: false, message: 'Access denied' });

      const { data: msgs, error } = await supabaseAdmin
        .from('messages')
        .select('*, sender:users( id, full_name, profile_image, role )')
        .eq('conversation_id', conversationId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true });

      if (error) throw error;

      await supabaseAdmin
        .from('conversation_participants')
        .update({ last_read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .eq('user_id', me);

      return res.json({ success: true, messages: decryptAll(msgs) });

    } catch (err) {
      console.error('getMessages error:', err);
      return res.status(500).json({ success: false, message: 'Failed to fetch messages' });
    }
  }

  async sendMessage(req: Request, res: Response) {
    try {
      const me             = req.user.userId;
      const { conversationId } = req.params;
      const { content }    = req.body;

      if (!content?.trim()) {
        return res.status(400).json({ success: false, message: 'Content is required' });
      }

      const { data: p } = await supabaseAdmin
        .from('conversation_participants')
        .select('id')
        .eq('conversation_id', conversationId)
        .eq('user_id', me)
        .maybeSingle();

      if (!p) return res.status(403).json({ success: false, message: 'Access denied' });

      const { data: msg, error } = await supabaseAdmin
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id:       me,
          content:         encrypt(content.trim()),
          is_edited:       false,
        })
        .select('*, sender:users( id, full_name, profile_image, role )')
        .single();

      if (error) throw error;

      await supabaseAdmin
        .from('conversation_participants')
        .update({ last_read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .eq('user_id', me);

      await supabaseAdmin
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId);

      return res.json({ success: true, message: { ...msg, content: content.trim() } });

    } catch (err) {
      console.error('sendMessage error:', err);
      return res.status(500).json({ success: false, message: 'Failed to send message' });
    }
  }

  async editMessage(req: Request, res: Response) {
    try {
      const me           = req.user.userId;
      const { messageId }  = req.params;
      const { content }  = req.body;

      if (!content?.trim()) {
        return res.status(400).json({ success: false, message: 'Content is required' });
      }

      const { data: msg } = await supabaseAdmin
        .from('messages')
        .select('sender_id, created_at, is_deleted')
        .eq('id', messageId)
        .maybeSingle();

      if (!msg) return res.status(404).json({ success: false, message: 'Message not found' });
      if (msg.sender_id !== me) return res.status(403).json({ success: false, message: 'Not your message' });
      if (msg.is_deleted) return res.status(400).json({ success: false, message: 'Message is deleted' });

      const age = Date.now() - new Date(msg.created_at).getTime();
      if (age > 15 * 60 * 1000) {
        return res.status(400).json({ success: false, message: 'Can only edit within 15 minutes' });
      }

      await supabaseAdmin
        .from('messages')
        .update({ content: encrypt(content.trim()), is_edited: true, edited_at: new Date().toISOString() })
        .eq('id', messageId);

      return res.json({ success: true, message: { id: messageId, content: content.trim(), is_edited: true } });

    } catch (err) {
      console.error('editMessage error:', err);
      return res.status(500).json({ success: false, message: 'Failed to edit message' });
    }
  }

  async deleteMessage(req: Request, res: Response) {
    try {
      const me           = req.user.userId;
      const { messageId }  = req.params;

      const { data: msg } = await supabaseAdmin
        .from('messages')
        .select('sender_id')
        .eq('id', messageId)
        .maybeSingle();

      if (!msg || msg.sender_id !== me) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }

      await supabaseAdmin
        .from('messages')
        .update({ is_deleted: true })
        .eq('id', messageId);

      return res.json({ success: true });

    } catch (err) {
      console.error('deleteMessage error:', err);
      return res.status(500).json({ success: false, message: 'Failed to delete message' });
    }
  }

  async closeConversation(req: Request, res: Response) {
    try {
      const me               = req.user.userId;
      const { conversationId } = req.params;

      const { data: conv } = await supabaseAdmin
        .from('conversations')
        .select('created_by')
        .eq('id', conversationId)
        .maybeSingle();

      const { data: user } = await supabaseAdmin
        .from('users').select('role').eq('id', me).maybeSingle();

      if (!conv || (conv.created_by !== me && (user as any)?.role !== 'admin')) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }

      await supabaseAdmin
        .from('conversations')
        .update({ status: 'closed' })
        .eq('id', conversationId);

      return res.json({ success: true });

    } catch (err) {
      console.error('closeConversation error:', err);
      return res.status(500).json({ success: false, message: 'Failed to close conversation' });
    }
  }

  async getUnreadCount(req: Request, res: Response) {
    try {
      const me = req.user.userId;

      const { data: parts } = await supabaseAdmin
        .from('conversation_participants')
        .select('conversation_id, last_read_at')
        .eq('user_id', me);

      let total = 0;
      for (const p of (parts ?? [])) {
        const { count } = await supabaseAdmin
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', p.conversation_id)
          .neq('sender_id', me)
          .eq('is_deleted', false)
          .gt('created_at', p.last_read_at ?? '1970-01-01');
        total += count ?? 0;
      }

      return res.json({ success: true, unreadCount: total });

    } catch (err) {
      console.error('getUnreadCount error:', err);
      return res.status(500).json({ success: false, message: 'Failed to get unread count' });
    }
  }
}

export default new MessagesController();