'use client';

import { useState, useRef } from 'react';
import { ParaphrasingConfig } from '@/lib/types';

// Available AI models with descriptions (Latest models available on OpenRouter)
const AI_MODELS = [
  {
    id: 'anthropic/claude-3.5-sonnet',
    name: 'Claude 3.5 Sonnet',
    description: 'Latest Claude. Best overall quality and nuanced writing.',
    speed: 'Medium',
    cost: '$$$',
    recommended: true,
  },
  {
    id: 'openai/o1-preview',
    name: 'OpenAI o1-preview',
    description: 'Advanced reasoning model. Exceptional for complex tasks.',
    speed: 'Slow',
    cost: '$$$$',
    recommended: false,
  },
  {
    id: 'openai/gpt-4-turbo',
    name: 'GPT-4 Turbo',
    description: 'Latest GPT-4. Powerful and fast with 128k context.',
    speed: 'Fast',
    cost: '$$$',
    recommended: false,
  },
  {
    id: 'google/gemini-pro-1.5',
    name: 'Gemini Pro 1.5',
    description: 'Google\'s best. 1M+ token context, multimodal.',
    speed: 'Medium',
    cost: '$$',
    recommended: false,
  },
  {
    id: 'deepseek/deepseek-chat',
    name: 'DeepSeek V3',
    description: 'Chinese frontier model. Excellent reasoning, very affordable.',
    speed: 'Fast',
    cost: '$',
    recommended: false,
  },
  {
    id: 'qwen/qwen-2.5-72b-instruct',
    name: 'Qwen 2.5 72B',
    description: 'Alibaba\'s flagship. Strong multilingual, great for Chinese.',
    speed: 'Medium',
    cost: '$',
    recommended: false,
  },
  {
    id: 'anthropic/claude-3-opus',
    name: 'Claude 3 Opus',
    description: 'Most powerful Claude. Best for long, complex documents.',
    speed: 'Slow',
    cost: '$$$$',
    recommended: false,
  },
  {
    id: 'meta-llama/llama-3.1-405b-instruct',
    name: 'Llama 3.1 405B',
    description: 'Meta\'s largest open model. Rival to GPT-4.',
    speed: 'Slow',
    cost: '$$$',
    recommended: false,
  },
  {
    id: 'mistralai/mistral-large',
    name: 'Mistral Large',
    description: 'European AI champion. Multilingual, fast, cost-effective.',
    speed: 'Fast',
    cost: '$$',
    recommended: false,
  },
  {
    id: 'x-ai/grok-2',
    name: 'Grok 2',
    description: 'xAI\'s model. Conversational and creative paraphrasing.',
    speed: 'Medium',
    cost: '$$$',
    recommended: false,
  },
];

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentChunk, setCurrentChunk] = useState(0);
  const [totalChunks, setTotalChunks] = useState(0);
  const [result, setResult] = useState<string>('');
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [config, setConfig] = useState<ParaphrasingConfig>({
    tone: 'neutral',
    formality: 'medium',
    creativity: 'moderate',
    preserveFormatting: true,
    model: AI_MODELS[0].id, // Default to Claude 3.5 Sonnet
  });
  
  const [selectedModel, setSelectedModel] = useState(AI_MODELS[0]);

  const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB for Vercel Pro plan

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const ext = selectedFile.name.split('.').pop()?.toLowerCase();
      
      // Check file size
      if (selectedFile.size > MAX_FILE_SIZE) {
        setError(`File too large. Maximum size is ${(MAX_FILE_SIZE / 1024 / 1024).toFixed(0)}MB (Vercel Pro plan limit).`);
        setFile(null);
        return;
      }
      
      if (ext && ['pdf', 'docx', 'txt'].includes(ext)) {
        setFile(selectedFile);
        setError('');
        setResult('');
      } else {
        setError('Please select a PDF, DOCX, or TXT file');
        setFile(null);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setProcessing(true);
    setProgress(0);
    setError('');
    setResult('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('config', JSON.stringify(config));

      const response = await fetch('/api/paraphrase', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        if (response.status === 413) {
          throw new Error('File too large for server. Please use a smaller file (max 50MB).');
        }
        throw new Error(`Failed to process document (${response.status})`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response stream');
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim());

        for (const line of lines) {
          try {
            const update = JSON.parse(line);
            
            if (update.type === 'progress') {
              setProgress(update.progress || 0);
              setCurrentChunk(update.currentChunk || 0);
              setTotalChunks(update.totalChunks || 0);
            } else if (update.type === 'complete') {
              setResult(update.result || '');
              setProgress(100);
            } else if (update.type === 'error') {
              setError(update.error || 'Unknown error');
            }
          } catch (e) {
            console.error('Failed to parse update:', line);
          }
        }
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setProcessing(false);
    }
  };

  const downloadResult = () => {
    if (!result) return;
    const blob = new Blob([result], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `paraphrased_${file?.name?.replace(/\.[^.]+$/, '.txt')}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Nick's Document System</h1>
          <p className="text-gray-600 mb-2">AI-powered document paraphrasing with 10+ advanced models</p>
          <p className="text-sm text-indigo-600 mb-8">✨ Pro Features: Up to 50MB files, 700+ pages, 5-minute processing</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Document
              </label>
              <div className="flex items-center space-x-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.txt"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
              </div>
              {file && (
                <p className="mt-2 text-sm text-gray-600">
                  Selected: <span className="font-medium">{file.name}</span> ({(file.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>

            {/* AI Model Selection */}
            <div className="border-t pt-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                AI Model
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {AI_MODELS.map((model) => (
                  <button
                    key={model.id}
                    type="button"
                    onClick={() => {
                      setSelectedModel(model);
                      setConfig({ ...config, model: model.id });
                    }}
                    className={`relative p-4 rounded-lg border-2 text-left transition-all ${
                      selectedModel.id === model.id
                        ? 'border-indigo-600 bg-indigo-50'
                        : 'border-gray-200 hover:border-indigo-300 bg-white'
                    }`}
                  >
                    {model.recommended && (
                      <span className="absolute top-2 right-2 text-xs bg-green-500 text-white px-2 py-0.5 rounded-full">
                        Recommended
                      </span>
                    )}
                    <div className="font-semibold text-gray-900 mb-1">{model.name}</div>
                    <div className="text-xs text-gray-600 mb-2">{model.description}</div>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="flex items-center gap-1">
                        <span className="text-gray-500">Speed:</span>
                        <span className="font-medium text-gray-700">{model.speed}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="text-gray-500">Cost:</span>
                        <span className="font-medium text-gray-700">{model.cost}</span>
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Configuration */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tone</label>
                <select
                  value={config.tone}
                  onChange={(e) => setConfig({ ...config, tone: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="formal">Formal</option>
                  <option value="neutral">Neutral</option>
                  <option value="casual">Casual</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Formality</label>
                <select
                  value={config.formality}
                  onChange={(e) => setConfig({ ...config, formality: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Creativity</label>
                <select
                  value={config.creativity}
                  onChange={(e) => setConfig({ ...config, creativity: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="conservative">Conservative</option>
                  <option value="moderate">Moderate</option>
                  <option value="creative">Creative</option>
                </select>
              </div>

              <div className="flex items-center">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.preserveFormatting}
                    onChange={(e) => setConfig({ ...config, preserveFormatting: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Preserve Formatting</span>
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!file || processing}
              className="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {processing ? 'Processing...' : 'Paraphrase Document'}
            </button>
          </form>

          {/* Progress */}
          {processing && (
            <div className="mt-6">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Processing chunk {currentChunk} of {totalChunks}</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {/* Result */}
          {result && (
            <div className="mt-6">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-lg font-semibold text-gray-900">Paraphrased Result</h2>
                <button
                  onClick={downloadResult}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                >
                  Download TXT
                </button>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 max-h-96 overflow-y-auto">
                <pre className="text-sm text-gray-800 whitespace-pre-wrap font-sans">{result}</pre>
              </div>
            </div>
          )}
          
          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-center text-sm text-gray-600">
              <span className="font-semibold text-gray-900">Nick's Document System</span> © 2025
              <span className="mx-2">•</span>
              Powered by Open Insurance AI
              <span className="mx-2">•</span>
              <a href="https://github.com/arihealthbird/doc-paraphraser-nextjs" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-700">
                GitHub
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
