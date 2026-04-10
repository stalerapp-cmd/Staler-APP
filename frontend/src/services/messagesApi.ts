

// src/services/messagesApi.ts
import axios from 'axios';

const _BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const API_URL = `${_BASE}/api`;

const headers = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export interface Message {
  id:              string;
  conversation_id: string;
  sender_id:       string;
  content:         string;
  is_edited:       boolean;
  edited_at?:      string;
  is_deleted:      boolean;
  created_at:      string;
  sender: {
    id:             string;
    full_name:      string;
    profile_image?: string;
    role:           string;
  };
}

export interface Conversation {
  id:           string;
  type:         'support' | 'merchant' | 'exchange' | 'user_to_user';
  title?:       string;
  status:       string;
  created_at:   string;
  updated_at:   string;
  lastMessage?: Partial<Message> | null;
  unreadCount:  number;
  participants: Array<{
    id:             string;
    full_name:      string;
    profile_image?: string;
    role:           string;
  }>;
}

export interface SearchUser {
  id:             string;
  full_name:      string;
  role:           string;
  profile_image?: string;
  store_name?:    string | null;
  store_logo?:    string | null;
}

class MessagesApi {
  async searchUsers(q: string) {
    const r = await axios.get(`${API_URL}/messages/search-users`, {
      params: { q }, headers: headers(),
    });
    return r.data as { success: boolean; users: SearchUser[] };
  }

  async getConversations() {
    const r = await axios.get(`${API_URL}/messages/conversations`, { headers: headers() });
    return r.data as { success: boolean; conversations: Conversation[] };
  }

  async createConversation(type: string, recipientId: string, title?: string) {
    const r = await axios.post(
      `${API_URL}/messages/conversations`,
      { type, recipientId, title },
      { headers: headers() },
    );
    return r.data as { success: boolean; conversationId: string; existing: boolean };
  }

  async getMessages(conversationId: string) {
    const r = await axios.get(
      `${API_URL}/messages/conversations/${conversationId}/messages`,
      { headers: headers() },
    );
    return r.data as { success: boolean; messages: Message[] };
  }

  async sendMessage(conversationId: string, content: string) {
    const r = await axios.post(
      `${API_URL}/messages/conversations/${conversationId}/messages`,
      { content },
      { headers: headers() },
    );
    return r.data as { success: boolean; message: Message };
  }

  async editMessage(messageId: string, content: string) {
    const r = await axios.patch(
      `${API_URL}/messages/messages/${messageId}`,
      { content },
      { headers: headers() },
    );
    return r.data;
  }

  async deleteMessage(messageId: string) {
    const r = await axios.delete(
      `${API_URL}/messages/messages/${messageId}`,
      { headers: headers() },
    );
    return r.data;
  }

  async closeConversation(conversationId: string) {
    const r = await axios.patch(
      `${API_URL}/messages/conversations/${conversationId}/close`,
      {},
      { headers: headers() },
    );
    return r.data;
  }

  async getUnreadCount() {
    const r = await axios.get(`${API_URL}/messages/unread-count`, { headers: headers() });
    return r.data as { success: boolean; unreadCount: number };
  }
}

export default new MessagesApi();