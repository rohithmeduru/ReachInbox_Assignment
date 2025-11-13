'use client';

import React, { useState } from 'react';
import { Email, EmailCategory } from '../types/email';
import { format } from 'date-fns';
import {
  EnvelopeIcon,
  CalendarIcon,
  TagIcon,
  PaperClipIcon,
  StarIcon,
  ArchiveBoxIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

interface EmailViewProps {
  email: Email;
}

const EmailView: React.FC<EmailViewProps> = ({ email }) => {
  const [showFullHtml, setShowFullHtml] = useState(false);
  const [isStarred, setIsStarred] = useState(false);

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

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return format(date, 'PPP p');
    } catch {
      return dateString;
    }
  };

  const handleStarToggle = () => {
    setIsStarred(!isStarred);
    // TODO: Implement starring functionality
  };

  const handleArchive = () => {
    // TODO: Implement archive functionality
    console.log('Archive email:', email.id);
  };

  const handleDelete = () => {
    // TODO: Implement delete functionality
    console.log('Delete email:', email.id);
  };

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Email Header */}
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {email.subject || '(No Subject)'}
            </h2>

            {/* From and To */}
            <div className="space-y-2 text-sm">
              <div className="flex items-center">
                <EnvelopeIcon className="h-4 w-4 text-gray-400 mr-2" />
                <span className="font-medium text-gray-900">From:</span>
                <span className="ml-2 text-gray-600">
                  {email.from.name ? `${email.from.name} <${email.from.email}>` : email.from.email}
                </span>
              </div>

              <div className="flex items-center">
                <span className="font-medium text-gray-900 ml-6">To:</span>
                <span className="ml-2 text-gray-600">
                  {email.to.map((recipient) =>
                    recipient.name ? `${recipient.name} <${recipient.email}>` : recipient.email
                  ).join(', ')}
                </span>
              </div>

              {email.cc && email.cc.length > 0 && (
                <div className="flex items-center">
                  <span className="font-medium text-gray-900 ml-6">Cc:</span>
                  <span className="ml-2 text-gray-600">
                    {email.cc.map((recipient) =>
                      recipient.name ? `${recipient.name} <${recipient.email}>` : recipient.email
                    ).join(', ')}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2 ml-4">
            <button
              onClick={handleStarToggle}
              className="p-2 text-gray-400 hover:text-yellow-500 transition-colors"
              title="Star email"
            >
              {isStarred ? (
                <StarIconSolid className="h-5 w-5 text-yellow-500" />
              ) : (
                <StarIcon className="h-5 w-5" />
              )}
            </button>

            <button
              onClick={handleArchive}
              className="p-2 text-gray-400 hover:text-blue-500 transition-colors"
              title="Archive email"
            >
              <ArchiveBoxIcon className="h-5 w-5" />
            </button>

            <button
              onClick={handleDelete}
              className="p-2 text-gray-400 hover:text-red-500 transition-colors"
              title="Delete email"
            >
              <TrashIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Email Meta */}
        <div className="flex items-center space-x-4 text-sm text-gray-500">
          <div className="flex items-center">
            <CalendarIcon className="h-4 w-4 mr-1" />
            {formatDate(email.date)}
          </div>

          <div className="flex items-center">
            <TagIcon className="h-4 w-4 mr-1" />
            {email.folder}
          </div>

          {email.attachments && email.attachments.length > 0 && (
            <div className="flex items-center">
              <PaperClipIcon className="h-4 w-4 mr-1" />
              {email.attachments.length} attachment{email.attachments.length !== 1 ? 's' : ''}
            </div>
          )}

          {email.category && (
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(email.category)}`}>
              {email.category}
            </span>
          )}

          {email.categoryConfidence && (
            <span className="text-xs text-gray-400">
              ({Math.round(email.categoryConfidence * 100)}% confidence)
            </span>
          )}
        </div>
      </div>

      {/* Email Body */}
      <div className="p-6">
        {email.attachments && email.attachments.length > 0 && (
          <div className="mb-4 p-3 bg-gray-50 rounded-md">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Attachments</h4>
            <div className="space-y-1">
              {email.attachments.map((attachment, index) => (
                <div key={index} className="flex items-center text-sm text-gray-600">
                  <PaperClipIcon className="h-3 w-3 mr-2" />
                  <span className="truncate">{attachment.filename}</span>
                  <span className="ml-2 text-xs text-gray-400">
                    ({attachment.contentType}, {(attachment.size / 1024).toFixed(1)} KB)
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Toggle between text and HTML view */}
        {email.htmlBody && (
          <div className="mb-4">
            <button
              onClick={() => setShowFullHtml(!showFullHtml)}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              {showFullHtml ? 'Show plain text' : 'Show HTML version'}
            </button>
          </div>
        )}

        {/* Email Content */}
        <div className="prose max-w-none">
          {showFullHtml && email.htmlBody ? (
            <div
              className="border border-gray-200 rounded-md p-4 bg-gray-50"
              dangerouslySetInnerHTML={{ __html: email.htmlBody }}
            />
          ) : (
            <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
              {email.body || 'No content'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmailView;