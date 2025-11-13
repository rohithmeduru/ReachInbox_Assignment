'use client';

import React from 'react';
import { Email, EmailCategory } from '../types/email';
import { formatDistanceToNow } from 'date-fns';

interface EmailListProps {
  emails: Email[];
  selectedEmailId: string | null;
  onEmailSelect: (emailId: string) => void;
  loading: boolean;
}

const EmailList: React.FC<EmailListProps> = ({
  emails,
  selectedEmailId,
  onEmailSelect,
  loading
}) => {
  const getCategoryColor = (category?: EmailCategory): string => {
    if (!category) return 'bg-gray-100 text-gray-800';

    const colors: Record<EmailCategory, string> = {
      [EmailCategory.INTERESTED]: 'bg-green-100 text-green-800',
      [EmailCategory.MEETING_BOOKED]: 'bg-blue-100 text-blue-800',
      [EmailCategory.NOT_INTERESTED]: 'bg-red-100 text-red-800',
      [EmailCategory.SPAM]: 'bg-gray-100 text-gray-800',
      [EmailCategory.OUT_OF_OFFICE]: 'bg-yellow-100 text-yellow-800'
    };

    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const truncateText = (text: string, maxLength: number = 100): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch {
      return dateString;
    }
  };

  if (loading && emails.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2 mb-1"></div>
              <div className="h-3 bg-gray-200 rounded w-full"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (emails.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
        <p className="text-gray-500">No emails found</p>
        <p className="text-sm text-gray-400 mt-2">Try adjusting your search filters</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="max-h-96 overflow-y-auto">
        {emails.map((email) => (
          <div
            key={email.id}
            onClick={() => onEmailSelect(email.id)}
            className={`p-4 border-b border-gray-200 cursor-pointer transition-colors hover:bg-gray-50 ${
              selectedEmailId === email.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
            }`}
          >
            {/* Email Header */}
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {email.from.name || email.from.email}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {email.from.email}
                </p>
              </div>
              <div className="flex flex-col items-end ml-2">
                <span className="text-xs text-gray-500 whitespace-nowrap">
                  {formatDate(email.date)}
                </span>
                {email.category && (
                  <span className={`mt-1 px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(email.category)}`}>
                    {email.category}
                  </span>
                )}
              </div>
            </div>

            {/* Subject */}
            <h3 className="text-sm font-medium text-gray-900 mb-1 line-clamp-1">
              {email.subject || '(No Subject)'}
            </h3>

            {/* Email Preview */}
            <p className="text-sm text-gray-600 line-clamp-2">
              {truncateText(email.body)}
            </p>

            {/* Email Meta */}
            <div className="flex items-center mt-2 text-xs text-gray-500">
              <span className="mr-3">{email.folder}</span>
              {email.attachments && email.attachments.length > 0 && (
                <span className="flex items-center">
                  <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                  {email.attachments.length}
                </span>
              )}
              {email.flags && email.flags.length > 0 && (
                <span className="ml-3 flex items-center">
                  <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                  </svg>
                  {email.flags.length}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EmailList;