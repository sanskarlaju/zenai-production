// src/components/ai/TaskGenerator.jsx
import React, { useState } from 'react';
import { useAITaskCreation } from '../../hooks/useAI';
import { Sparkles, Wand2 } from 'lucide-react';
import Button from '../common/Button';
import Input from '../common/Input';
import Card from '../common/Card';
import Modal from '../common/Modal';

const TaskGenerator = ({ projectId, onTaskCreated }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [description, setDescription] = useState('');
  const createTaskMutation = useAITaskCreation();

  const handleGenerate = async () => {
    if (!description.trim()) return;

    try {
      const response = await createTaskMutation.mutateAsync({
        description,
        projectId
      });

      if (onTaskCreated) {
        onTaskCreated(response.data);
      }

      setIsOpen(false);
      setDescription('');
    } catch (error) {
      console.error('Task generation error:', error);
    }
  };

  const examples = [
    'Build user authentication with OAuth',
    'Create dashboard with analytics charts',
    'Implement real-time notifications'
  ];

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        variant="secondary"
        className="gap-2"
      >
        <Sparkles size={20} />
        Generate with AI
      </Button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Generate Task with AI"
        size="lg"
      >
        <div className="space-y-6">
          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Describe what you want to build
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="E.g., Build a login page with email and password validation, Google OAuth, and password reset functionality"
              rows={5}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
            />
            <p className="text-sm text-gray-500 mt-2">
              Be as detailed as possible. The AI will create a structured task with acceptance criteria.
            </p>
          </div>

          {/* Examples */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-3">
              Try these examples:
            </p>
            <div className="space-y-2">
              {examples.map((example, idx) => (
                <button
                  key={idx}
                  onClick={() => setDescription(example)}
                  className="w-full text-left px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition text-sm text-gray-700"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <Button
              variant="ghost"
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleGenerate}
              loading={createTaskMutation.isLoading}
              disabled={!description.trim()}
            >
              <Wand2 size={20} />
              Generate Task
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default TaskGenerator;