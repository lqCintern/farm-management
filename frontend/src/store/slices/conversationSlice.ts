import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { Conversation, Message } from '../../types/conversation';
import axiosInstance from '../../utils/axiosConfig';

export const fetchConversation = createAsyncThunk<Conversation, number>(
  'conversations/fetchConversation',
  async (id: number) => {
    const response = await axiosInstance.get(`/controllers/api/v1/marketplace/conversations/${id}`);
    return response.data as Conversation;
  }
);

export const sendMessage = createAsyncThunk<
  Message,
  { conversationId: number; content: string }
>(
  'conversations/sendMessage',
  async ({ conversationId, content }) => {
    const response = await axiosInstance.post(
      `/controllers/api/v1/marketplace/conversations/${conversationId}/messages`,
      { content }
    );
    return response.data as Message;
  }
);

interface ConversationState {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  messages: { [conversationId: number]: Message[] };
  loading: boolean;
  error: string | null;
  lastMessageTimestamp: { [conversationId: number]: number };
}

const initialState: ConversationState = {
  conversations: [],
  currentConversation: null,
  messages: {},
  loading: false,
  error: null,
  lastMessageTimestamp: {},
};

const conversationSlice = createSlice({
  name: 'conversations',
  initialState,
  reducers: {
    setCurrentConversation(state, action) {
      state.currentConversation = action.payload;
    },
    addMessage(state, action) {
      const { conversationId, message } = action.payload;
      
      if (!state.messages[conversationId]) {
        state.messages[conversationId] = [];
      }
      
      const existingMessage = state.messages[conversationId].find(
        msg => msg.id === message.id
      );
      
      if (!existingMessage) {
        state.messages[conversationId].push(message);
        
        const messageTimestamp = new Date(message.created_at).getTime();
        state.lastMessageTimestamp[conversationId] = Math.max(
          state.lastMessageTimestamp[conversationId] || 0,
          messageTimestamp
        );
      }
    },
    setMessages(state, action) {
      const { conversationId, messages } = action.payload;
      state.messages[conversationId] = messages;
      
      if (messages.length > 0) {
        const timestamps = messages.map((msg: Message) => new Date(msg.created_at).getTime());
        state.lastMessageTimestamp[conversationId] = Math.max(...timestamps);
      }
    },
    addMessages(state, action) {
      const { conversationId, messages } = action.payload;
      
      if (!state.messages[conversationId]) {
        state.messages[conversationId] = [];
      }
      
      const existingIds = new Set(state.messages[conversationId].map((msg: Message) => msg.id));
      const newMessages = messages.filter((msg: Message) => !existingIds.has(msg.id));
      
      if (newMessages.length > 0) {
        state.messages[conversationId].push(...newMessages);
        
        const timestamps = newMessages.map((msg: Message) => new Date(msg.created_at).getTime());
        state.lastMessageTimestamp[conversationId] = Math.max(
          state.lastMessageTimestamp[conversationId] || 0,
          ...timestamps
        );
      }
    },
    clearMessages(state, action) {
      const conversationId = action.payload;
      delete state.messages[conversationId];
      delete state.lastMessageTimestamp[conversationId];
    },
    markMessageAsRead(state, action) {
      const { conversationId, messageId } = action.payload;
      const message = state.messages[conversationId]?.find(msg => msg.id === messageId);
      if (message) {
        message.read = true;
        message.read_at = new Date().toISOString();
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchConversation.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchConversation.fulfilled, (state, action) => {
        state.loading = false;
        state.currentConversation = action.payload;
        const index = state.conversations.findIndex(c => c.id === action.payload.id);
        if (index !== -1) {
          state.conversations[index] = action.payload;
        } else {
          state.conversations.push(action.payload);
        }
      })
      .addCase(fetchConversation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch conversation';
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        const conversation = state.conversations.find(
          c => c.id === action.payload.conversation_id
        );
        if (conversation) {
          conversation.last_message = {
            content: action.payload.content,
            created_at: action.payload.created_at,
          };
        }
      });
  },
});

export const { 
  setCurrentConversation, 
  addMessage, 
  setMessages, 
  addMessages, 
  clearMessages,
  markMessageAsRead 
} = conversationSlice.actions;
export default conversationSlice.reducer; 