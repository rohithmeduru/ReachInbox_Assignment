'use client';

import React, { useState, useEffect } from 'react';
import {
  ChatBubbleLeftRightIcon,
  SparklesIcon,
  ClipboardDocumentIcon,
  ArrowPathIcon,
  ChevronDownIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { useEmailStore } from '../store/emailStore';

interface ReplySuggestionProps {
  emailId: string;
}

const ReplySuggestion: React.FC<ReplySuggestionProps> = ({ emailId }) => {
  const [suggestion, setSuggestion] = useState<string>('');
  const [confidence, setConfidence] = useState<number>(0);
  const [reasoning, setReasoning] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [multipleSuggestions, setMultipleSuggestions] = useState<any[]>([]);
  const [showMultiple, setShowMultiple] = useState(false);
  const [showRefine, setShowRefine] = useState(false);
  const [feedback, setFeedback] = useState('');

  const { generateReplySuggestion, generateMultipleSuggestions, refineReplySuggestion } = useEmailStore();

  useEffect(() => {
    if (emailId) {
      generateInitialSuggestion();
    }
  }, [emailId]);

  const generateInitialSuggestion = async () => {
    try {
      setLoading(true);
      setError('');
      const result = await generateReplySuggestion(emailId);
      setSuggestion(result.suggestion);
      setConfidence(result.confidence);
      setReasoning(result.reasoning || '');
    } catch (err) {
      setError('Failed to generate reply suggestion');
      console.error('Error generating suggestion:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateMultiple = async () => {
    try {
      setLoading(true);
      const result = await generateMultipleSuggestions(emailId);
      setMultipleSuggestions(result.suggestions);
      setShowMultiple(true);
    } catch (err) {
      setError('Failed to generate multiple suggestions');
      console.error('Error generating multiple suggestions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefine = async () => {
    if (!feedback.trim()) return;

    try {
      setLoading(true);
      const result = await refineReplySuggestion(emailId, suggestion, feedback);
      setSuggestion(result.refinedSuggestion);
      setConfidence(result.confidence);
      setFeedback('');
      setShowRefine(false);
    } catch (err) {
      setError('Failed to refine suggestion');
      console.error('Error refining suggestion:', err);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(suggestion);
    // TODO: Show success toast
  };

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.8) return 'text-green-600 bg-green-100';
    if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const formatConfidence = (confidence: number): string => {
    return `${Math.round(confidence * 100)}%`;
  };

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <SparklesIcon className="h-8 w-8 text-red-500 mr-3" />
          <div>
            <h3 className="text-lg font-medium text-gray-900">AI Reply Suggestion</h3>
            <p className="text-red-600 text-sm">{error}</p>
            <button
              onClick={generateInitialSuggestion}
              className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
          <div>
            <h3 className="text-lg font-medium text-gray-900">AI Reply Suggestion</h3>
            <p className="text-gray-600 text-sm">Generating smart reply suggestion...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <SparklesIcon className="h-8 w-8 text-blue-500 mr-3" />
            <div>
              <h3 className="text-lg font-medium text-gray-900">AI Reply Suggestion</h3>
              <div className="flex items-center mt-1 space-x-3">
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${getConfidenceColor(confidence)}`}>
                  Confidence: {formatConfidence(confidence)}
                </span>
                {reasoning && (
                  <span className="text-xs text-gray-500">
                    {reasoning}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleGenerateMultiple}
              disabled={loading}
              className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
              title="Generate multiple suggestions"
            >
              <ChevronDownIcon className="h-5 w-5" />
            </button>
            <button
              onClick={generateInitialSuggestion}
              disabled={loading}
              className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
              title="Regenerate suggestion"
            >
              <ArrowPathIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Suggestion Content */}
      <div className="p-6">
        <div className="relative">
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-md">
            <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
              {suggestion || 'No suggestion available'}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center space-x-2">
              <button
                onClick={copyToClipboard}
                className="flex items-center px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
              >
                <ClipboardDocumentIcon className="h-4 w-4 mr-1" />
                Copy
              </button>

              <button
                onClick={() => setShowRefine(!showRefine)}
                className="flex items-center px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
              >
                <ChatBubbleLeftRightIcon className="h-4 w-4 mr-1" />
                Refine
              </button>
            </div>

            {/* Reply Actions */}
            <div className="flex items-center space-x-2">
              <button
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Reply in Email Client
              </button>
            </div>
          </div>
        </div>

        {/* Refine Interface */}
        {showRefine && (
          <div className="mt-4 p-4 bg-gray-50 rounded-md">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              How would you like to improve this suggestion?
            </label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="e.g., Make it more formal, add more details, change the tone..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              rows={3}
            />
            <div className="flex items-center justify-end mt-2 space-x-2">
              <button
                onClick={() => {
                  setShowRefine(false);
                  setFeedback('');
                }}
                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleRefine}
                disabled={!feedback.trim() || loading}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                Refine
              </button>
            </div>
          </div>
        )}

        {/* Multiple Suggestions */}
        {showMultiple && multipleSuggestions.length > 0 && (
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-gray-900">Alternative Suggestions</h4>
              <button
                onClick={() => setShowMultiple(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            {multipleSuggestions.map((altSuggestion, index) => (
              <div
                key={index}
                className="bg-gray-50 border border-gray-200 p-3 rounded-md cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => {
                  setSuggestion(altSuggestion.text);
                  setConfidence(altSuggestion.confidence);
                  setShowMultiple(false);
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-gray-600">
                    {altSuggestion.tone}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded-full ${getConfidenceColor(altSuggestion.confidence)}`}>
                    {formatConfidence(altSuggestion.confidence)}
                  </span>
                </div>
                <p className="text-sm text-gray-700 line-clamp-3">
                  {altSuggestion.text}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReplySuggestion;