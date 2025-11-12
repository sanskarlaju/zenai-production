// src/components/ai/AIChat.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useAIChat, useChatHistory } from '../../hooks/useAI';
import { Send, Bot, User, Loader } from 'lucide-react';
import Button from '../common/Button';
import Card from '../common/Card';
import ChatMessage from './ChatMessage';
import { motion, AnimatePresence } from 'framer-motion';

const AIChat = ({ projectId, taskId }) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);
  const chatMutation = useAIChat();

  const { data: historyData } = useChatHistory({ limit: 50 });

  useEffect(() => {
    if (historyData?.data?.messages) {
      setMessages(historyData.data.messages);
    }
  }, [historyData]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!message.trim()) return;

    const userMessage = {
      role: 'user',
      content: message,
      createdAt: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setMessage('');

    try {
      const response = await chatMutation.mutateAsync({
        message,
        context: {
          type: projectId ? 'project-management' : undefined,
          projectId,
          taskId
        }
      });

      const aiMessage = {
        role: 'ai',
        content: response.data.response,
        createdAt: new Date(),
        metadata: response.data.metadata
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Chat error:', error);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-200px)]">
      <Card className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg">
              <Bot className="text-white" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">AI Assistant</h2>
              <p className="text-sm text-gray-500">
                Ask me anything about your projects and tasks
              </p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-4">
          <AnimatePresence>
            {messages.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <Bot className="mx-auto text-gray-300 mb-4" size={64} />
                <p className="text-gray-500 text-lg mb-2">
                  Hi! I'm your AI assistant
                </p>
                <p className="text-gray-400 text-sm">
                  Ask me to create tasks, analyze projects, or help with planning
                </p>
              </motion.div>
            ) : (
              messages.map((msg, idx) => (
                <ChatMessage key={idx} message={msg} />
              ))
            )}
          </AnimatePresence>

          {chatMutation.isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg"
            >
              <Loader className="animate-spin text-primary-600" size={20} />
              <span className="text-gray-600">AI is thinking...</span>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t pt-4">
          <div className="flex gap-3">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message... (Shift+Enter for new line)"
              rows={3}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <Button
              onClick={handleSend}
              disabled={!message.trim() || chatMutation.isLoading}
              className="self-end"
            >
              <Send size={20} />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AIChat;