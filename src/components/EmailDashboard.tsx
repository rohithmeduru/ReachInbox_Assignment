'use client';

import React, { useEffect, useState } from 'react';
import { useEmailStore } from '../store/emailStore';
import { EmailCategory } from '../types/email';
import EmailList from './EmailList';
import EmailView from './EmailView';
import SearchFilters from './SearchFilters';
import ReplySuggestion from './ReplySuggestion';

const EmailDashboard: React.FC = () => {
  const {
    emails,
    currentEmail,
    loading,
    error,
    total,
    fetchEmails,
    fetchEmail,
    setSearchParams,
    stats,
    fetchStats
  } = useEmailStore();

  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);

  useEffect(() => {
    // Initial fetch
    fetchEmails();
    fetchStats();
  }, [fetchEmails, fetchStats]);

  const handleSearch = (searchParams: any) => {
    setSearchParams(searchParams);
    fetchEmails(searchParams);
    setSelectedEmailId(null);
  };

  const handleEmailSelect = async (emailId: string) => {
    setSelectedEmailId(emailId);
    await fetchEmail(emailId);
  };

  const getCategoryStats = () => {
    const stats = emails.reduce((acc, email) => {
      const category = email.category || 'Uncategorized';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(stats).map(([category, count]) => ({
      category,
      count,
      color: getCategoryColor(category as EmailCategory)
    }));
  };

  const getCategoryColor = (category: EmailCategory | string): string => {
    const colors: Record<string, string> = {
      [EmailCategory.INTERESTED]: 'bg-green-100 text-green-800',
      [EmailCategory.MEETING_BOOKED]: 'bg-blue-100 text-blue-800',
      [EmailCategory.NOT_INTERESTED]: 'bg-red-100 text-red-800',
      [EmailCategory.SPAM]: 'bg-gray-100 text-gray-800',
      [EmailCategory.OUT_OF_OFFICE]: 'bg-yellow-100 text-yellow-800',
      'Uncategorized': 'bg-purple-100 text-purple-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  if (loading && emails.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading emails...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Email Onebox</h1>
              <p className="text-sm text-gray-500">{total} emails</p>
            </div>

            {/* Category Stats */}
            <div className="flex space-x-2">
              {getCategoryStats().map(({ category, count, color }) => (
                <div
                  key={category}
                  className={`px-3 py-1 rounded-full text-xs font-medium ${color}`}
                >
                  {category}: {count}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Search Filters */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <SearchFilters onSearch={handleSearch} loading={loading} />
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Email List */}
          <div className="lg:col-span-1">
            <EmailList
              emails={emails}
              selectedEmailId={selectedEmailId}
              onEmailSelect={handleEmailSelect}
              loading={loading}
            />
          </div>

          {/* Email Content */}
          <div className="lg:col-span-2 space-y-6">
            {currentEmail ? (
              <>
                <EmailView email={currentEmail} />

                {/* Reply Suggestion */}
                <ReplySuggestion emailId={currentEmail.id} />
              </>
            ) : (
              <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
                <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <p>Select an email to view its content</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailDashboard;