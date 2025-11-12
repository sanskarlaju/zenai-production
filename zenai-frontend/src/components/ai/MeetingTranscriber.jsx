// src/components/ai/MeetingTranscriber.jsx
import React, { useState, useRef } from 'react';
import { useAudioTranscription } from '../../hooks/useAI';
import { Mic, Upload, FileAudio, Download } from 'lucide-react';
import Button from '../common/Button';
import Card from '../common/Card';
import Modal from '../common/Modal';
import toast from 'react-hot-toast';

const MeetingTranscriber = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [audioFile, setAudioFile] = useState(null);
  const [metadata, setMetadata] = useState({
    title: '',
    participants: []
  });
  const [result, setResult] = useState(null);
  const fileInputRef = useRef(null);
  const transcribeMutation = useAudioTranscription();

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const validTypes = ['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/m4a'];
      if (!validTypes.includes(file.type)) {
        toast.error('Invalid file type. Please upload an audio file.');
        return;
      }

      // Validate file size (max 50MB)
      if (file.size > 50 * 1024 * 1024) {
        toast.error('File size too large. Maximum size is 50MB.');
        return;
      }

      setAudioFile(file);
    }
  };

  const handleTranscribe = async () => {
    if (!audioFile) {
      toast.error('Please select an audio file');
      return;
    }

    try {
      const response = await transcribeMutation.mutateAsync({
        file: audioFile,
        metadata
      });

      setResult(response.data);
      toast.success('Transcription completed!');
    } catch (error) {
      console.error('Transcription error:', error);
    }
  };

  const downloadReport = () => {
    if (!result) return;

    const report = `
# Meeting Summary

**Date:** ${new Date(result.metadata.date).toLocaleString()}
**Duration:** ${Math.round(result.transcription.duration / 60)} minutes
**Participants:** ${result.metadata.participants.join(', ')}

## Executive Summary
${result.summary.executiveSummary}

## Key Points
${result.summary.keyPoints.map(point => `- ${point}`).join('\n')}

## Decisions Made
${result.summary.decisions.map(decision => `- ${decision}`).join('\n')}

## Action Items
${result.actionItems.map(item => `
- **${item.action}**
  - Owner: ${item.owner || 'Unassigned'}
  - Due: ${item.dueDate || 'Not set'}
  - Priority: ${item.priority}
`).join('\n')}

## Next Steps
${result.summary.nextSteps.map(step => `- ${step}`).join('\n')}

## Questions & Blockers
${result.summary.questions.concat(result.summary.blockers).map(q => `- ${q}`).join('\n')}

---

## Full Transcript
${result.transcription.text}
    `;

    const blob = new Blob([report], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `meeting-summary-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        variant="secondary"
      >
        <Mic size={20} />
        Transcribe Meeting
      </Button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Transcribe Meeting"
        size="lg"
      >
        <div className="space-y-6">
          {!result ? (
            <>
              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Audio File
                </label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary-500 transition cursor-pointer"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="audio/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  {audioFile ? (
                    <div className="flex items-center justify-center gap-3">
                      <FileAudio className="text-primary-600" size={32} />
                      <div className="text-left">
                        <p className="font-medium text-gray-900">{audioFile.name}</p>
                        <p className="text-sm text-gray-500">
                          {(audioFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <Upload className="mx-auto text-gray-400 mb-3" size={48} />
                      <p className="text-gray-600 mb-1">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-sm text-gray-500">
                        MP3, WAV, M4A (max 50MB)
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* Metadata */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Meeting Title
                  </label>
                  <input
                    type="text"
                    value={metadata.title}
                    onChange={(e) => setMetadata({ ...metadata, title: e.target.value })}
                    placeholder="Sprint Planning Meeting"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Participants (comma separated)
                  </label>
                  <input
                    type="text"
                    onChange={(e) => setMetadata({ 
                      ...metadata, 
                      participants: e.target.value.split(',').map(p => p.trim()) 
                    })}
                    placeholder="Alice, Bob, Charlie"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
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
                  onClick={handleTranscribe}
                  loading={transcribeMutation.isLoading}
                  disabled={!audioFile}
                >
                  <Mic size={20} />
                  Transcribe
                </Button>
              </div>
            </>
          ) : (
            <>
              {/* Results */}
              <div className="space-y-6">
                {/* Summary */}
                <Card className="bg-gradient-to-br from-primary-50 to-secondary-50">
                  <h3 className="font-bold text-lg mb-3">Executive Summary</h3>
                  <p className="text-gray-700">{result.summary.executiveSummary}</p>
                </Card>

                {/* Key Points */}
                <div>
                  <h3 className="font-bold text-lg mb-3">Key Discussion Points</h3>
                  <ul className="space-y-2">
                    {result.summary.keyPoints.map((point, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 bg-primary-600 rounded-full mt-2" />
                        <span className="text-gray-700">{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Action Items */}
                <div>
                  <h3 className="font-bold text-lg mb-3">Action Items</h3>
                  <div className="space-y-3">
                    {result.actionItems.map((item, idx) => (
                      <Card key={idx} className="bg-yellow-50">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium text-gray-900">{item.action}</p>
                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                              {item.owner && <span>👤 {item.owner}</span>}
                              {item.dueDate && <span>📅 {item.dueDate}</span>}
                              <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                item.priority === 'high' ? 'bg-red-100 text-red-800' :
                                item.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                                {item.priority}
                              </span>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Transcript */}
                <div>
                  <h3 className="font-bold text-lg mb-3">Full Transcript</h3>
                  <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
                    <p className="text-gray-700 whitespace-pre-wrap text-sm">
                      {result.transcription.text}
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 justify-end">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setResult(null);
                    setAudioFile(null);
                    setIsOpen(false);
                  }}
                >
                  Close
                </Button>
                <Button onClick={downloadReport}>
                  <Download size={20} />
                  Download Report
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </>
  );
};

export default MeetingTranscriber;