import { create } from 'zustand';
import { Email, EmailSearchParams, EmailSearchResult, ReplySuggestion, MultipleReplySuggestions, EmailStats, EmailAccount, EmailCategory } from '../types/email';
import { api } from '../lib/api';

interface EmailStore {
  // State
  emails: Email[];
  currentEmail: Email | null;
  accounts: EmailAccount[];
  loading: boolean;
  error: string | null;
  searchParams: EmailSearchParams;
  total: number;
  stats: EmailStats | null;

  // Actions
  setEmails: (emails: Email[]) => void;
  setCurrentEmail: (email: Email | null) => void;
  setAccounts: (accounts: EmailAccount[]) => void;
  setStats: (stats: EmailStats) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSearchParams: (params: Partial<EmailSearchParams>) => void;

  // API actions
  fetchEmails: (params?: EmailSearchParams) => Promise<void>;
  fetchEmail: (id: string) => Promise<void>;
  generateReplySuggestion: (id: string) => Promise<ReplySuggestion>;
  generateMultipleSuggestions: (id: string, count?: number) => Promise<MultipleReplySuggestions>;
  refineReplySuggestion: (id: string, originalSuggestion: string, feedback: string) => Promise<{ refinedSuggestion: string; confidence: number }>;
  categorizeEmail: (id: string, category: string) => Promise<void>;
  deleteEmail: (id: string) => Promise<void>;
  updateEmail: (id: string, updates: Partial<Email>) => Promise<void>;

  // Account actions
  fetchAccounts: () => Promise<void>;
  createAccount: (account: Partial<EmailAccount> & { password: string }) => Promise<EmailAccount>;
  updateAccount: (id: string, updates: Partial<EmailAccount>) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;
  connectAccount: (id: string) => Promise<void>;
  disconnectAccount: (id: string) => Promise<void>;

  // Stats actions
  fetchStats: (accountId?: string) => Promise<void>;
}

export const useEmailStore = create<EmailStore>((set, get) => ({
  // Initial state
  emails: [],
  currentEmail: null,
  accounts: [],
  loading: false,
  error: null,
  searchParams: {
    limit: 50,
    offset: 0
  },
  total: 0,
  stats: null,

  // Basic actions
  setEmails: (emails) => set({ emails }),
  setCurrentEmail: (email) => set({ currentEmail: email }),
  setAccounts: (accounts) => set({ accounts }),
  setStats: (stats) => set({ stats }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setSearchParams: (params) => set((state) => ({
    searchParams: { ...state.searchParams, ...params }
  })),

  // Email API actions
  fetchEmails: async (params) => {
    try {
      set({ loading: true, error: null });

      const searchParams = { ...get().searchParams, ...params };
      const response = await api.get<EmailSearchResult>('/emails', {
        params: searchParams
      });

      set({
        emails: response.data.emails,
        total: response.data.total,
        searchParams
      });
    } catch (error) {
      set({ error: 'Failed to fetch emails' });
      console.error('Fetch emails error:', error);
    } finally {
      set({ loading: false });
    }
  },

  fetchEmail: async (id) => {
    try {
      set({ loading: true, error: null });

      const response = await api.get<{ success: boolean; data?: Email }>(`/emails/${id}`);

      if (response.data.success && response.data.data) {
        set({ currentEmail: response.data.data });
      }
    } catch (error) {
      set({ error: 'Failed to fetch email' });
      console.error('Fetch email error:', error);
    } finally {
      set({ loading: false });
    }
  },

  generateReplySuggestion: async (id) => {
    try {
      const response = await api.post<{ success: boolean; data?: ReplySuggestion }>(`/emails/${id}/reply-suggestion`);

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      throw new Error('Invalid response');
    } catch (error) {
      console.error('Generate reply suggestion error:', error);
      throw error;
    }
  },

  generateMultipleSuggestions: async (id, count = 3) => {
    try {
      const response = await api.post<{ success: boolean; data?: MultipleReplySuggestions }>(`/emails/${id}/reply-suggestions/multiple`, {
        count
      });

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      throw new Error('Invalid response');
    } catch (error) {
      console.error('Generate multiple suggestions error:', error);
      throw error;
    }
  },

  refineReplySuggestion: async (id, originalSuggestion, feedback) => {
    try {
      const response = await api.post(`/emails/${id}/reply-suggestions/refine`, {
        originalSuggestion,
        feedback
      });

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      throw new Error('Invalid response');
    } catch (error) {
      console.error('Refine reply suggestion error:', error);
      throw error;
    }
  },

  categorizeEmail: async (id, category) => {
    try {
      await api.post(`/emails/${id}/categorize`, { category });

      // Update current email if it's the one being categorized
      const currentEmail = get().currentEmail;
      if (currentEmail && currentEmail.id === id) {
        set({
          currentEmail: {
            ...currentEmail,
            category: category as EmailCategory,
            aiProcessed: true
          }
        });
      }

      // Update email in list if it exists
      const emails = get().emails;
      const updatedEmails = emails.map(email =>
        email.id === id ? { ...email, category, aiProcessed: true } : email
      );
      set({ emails: updatedEmails });
    } catch (error) {
      console.error('Categorize email error:', error);
      throw error;
    }
  },

  deleteEmail: async (id) => {
    try {
      await api.delete(`/emails/${id}`);

      // Remove from state
      const emails = get().emails.filter(email => email.id !== id);
      set({ emails });

      // Clear current email if it's the one being deleted
      const currentEmail = get().currentEmail;
      if (currentEmail && currentEmail.id === id) {
        set({ currentEmail: null });
      }
    } catch (error) {
      console.error('Delete email error:', error);
      throw error;
    }
  },

  updateEmail: async (id, updates) => {
    try {
      await api.put(`/emails/${id}`, updates);

      // Update in state
      const currentEmail = get().currentEmail;
      if (currentEmail && currentEmail.id === id) {
        set({
          currentEmail: { ...currentEmail, ...updates }
        });
      }

      // Update email in list if it exists
      const emails = get().emails.map(email =>
        email.id === id ? { ...email, ...updates } : email
      );
      set({ emails });
    } catch (error) {
      console.error('Update email error:', error);
      throw error;
    }
  },

  // Account API actions
  fetchAccounts: async () => {
    try {
      set({ loading: true, error: null });

      const response = await api.get<{ success: boolean; data?: EmailAccount[] }>('/accounts');

      if (response.data.success && response.data.data) {
        set({ accounts: response.data.data });
      }
    } catch (error) {
      set({ error: 'Failed to fetch accounts' });
      console.error('Fetch accounts error:', error);
    } finally {
      set({ loading: false });
    }
  },

  createAccount: async (account) => {
    try {
      const response = await api.post<{ success: boolean; data?: EmailAccount }>('/accounts', account);

      if (response.data.success && response.data.data) {
        const accounts = get().accounts;
        set({ accounts: [response.data.data, ...accounts] });
        return response.data.data;
      }

      throw new Error('Failed to create account');
    } catch (error) {
      console.error('Create account error:', error);
      throw error;
    }
  },

  updateAccount: async (id, updates) => {
    try {
      await api.put(`/accounts/${id}`, updates);

      // Update in state
      const accounts = get().accounts.map(account =>
        account.id === id ? { ...account, ...updates } : account
      );
      set({ accounts });
    } catch (error) {
      console.error('Update account error:', error);
      throw error;
    }
  },

  deleteAccount: async (id) => {
    try {
      await api.delete(`/accounts/${id}`);

      // Remove from state
      const accounts = get().accounts.filter(account => account.id !== id);
      set({ accounts });
    } catch (error) {
      console.error('Delete account error:', error);
      throw error;
    }
  },

  connectAccount: async (id) => {
    try {
      await api.post(`/accounts/${id}/connect`);

      // Update account status
      const accounts = get().accounts.map(account =>
        account.id === id ? { ...account, isActive: true, lastSync: new Date().toISOString() } : account
      );
      set({ accounts });
    } catch (error) {
      console.error('Connect account error:', error);
      throw error;
    }
  },

  disconnectAccount: async (id) => {
    try {
      await api.post(`/accounts/${id}/disconnect`);

      // Update account status
      const accounts = get().accounts.map(account =>
        account.id === id ? { ...account, isActive: false } : account
      );
      set({ accounts });
    } catch (error) {
      console.error('Disconnect account error:', error);
      throw error;
    }
  },

  // Stats actions
  fetchStats: async (accountId) => {
    try {
      const response = await api.get<{ success: boolean; data?: EmailStats }>('/emails/stats', {
        params: accountId ? { accountId } : {}
      });

      if (response.data.success && response.data.data) {
        set({ stats: response.data.data });
      }
    } catch (error) {
      console.error('Fetch stats error:', error);
    }
  }
}));