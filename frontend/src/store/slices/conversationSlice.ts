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
  loading: boolean;
  error: string | null;
}

const initialState: ConversationState = {
  conversations: [],
  currentConversation: null,
  loading: false,
  error: null,
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
      const conversation = state.conversations.find(c => c.id === conversationId);
      if (conversation) {
        conversation.messages.push(message);
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
          conversation.messages.push(action.payload);
        }
      });
  },
});

export const { setCurrentConversation, addMessage } = conversationSlice.actions;
export default conversationSlice.reducer; 