// src/components/ai/ChatMessage.jsx
import React from 'react';
import { Bot, User } from 'lucide-react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { format } from 'date-fns';

const ChatMessage = ({ message }) => {
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Avatar */}
      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
        isUser 
          ? 'bg-gradient-to-br from-blue-500 to-purple-500' 
          : 'bg-gradient-to-br from-primary-500 to-secondary-500'
      }`}>
        {isUser ? (
          <User className="text-white" size={20} />
        ) : (
          <Bot className="text-white" size={20} />
        )}
      </div>

      {/* Message Content */}
      <div className={`flex-1 max-w-[80%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div className={`rounded-2xl px-4 py-3 ${
          isUser 
            ? 'bg-gradient-to-br from-blue-500 to-purple-500 text-white' 
            : 'bg-gray-100 text-gray-900'
        }`}>
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="prose prose-sm max-w-none">
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
          )}
        </div>

        {/* Timestamp */}
        <p className="text-xs text-gray-500 mt-1 px-2">
          {format(new Date(message.createdAt), 'HH:mm')}
          {message.metadata?.responseTime && (
            <span className="ml-2">• {message.metadata.responseTime}ms</span>
          )}
        </p>
      </div>
    </motion.div>
  );
};

export default ChatMessage;