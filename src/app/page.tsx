'use client';

import { useState, useRef } from 'react';
import { ParaphrasingConfig } from '@/lib/types';
import { EtherealShadow } from '@/components/ui/etheral-shadow';

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
  const [jobId, setJobId] = useState<string>('');
  const [hallucinationScore, setHallucinationScore] = useState<number | null>(null);
  const [showCompletionPopup, setShowCompletionPopup] = useState(false);
  const [completionMessage, setCompletionMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const funnyMessages = [
    // Classic celebrations
    "🎉 Boom! Your document just got a vocabulary upgrade!",
    "✨ Alakazam! Your text has been magically transformed!",
    "🚀 Mission accomplished! Your words are now in disguise!",
    "🎨 Chef's kiss! Your document is beautifully rephrased!",
    "🎪 Ta-da! Your text just pulled off the ultimate switcheroo!",
    "🦸 Superhero landing! Your document is ready for action!",
    "🎯 Bullseye! Perfectly paraphrased and ready to go!",
    "🌟 Abracadabra! Your content has been wonderfully reworded!",
    "🎵 And... scene! Your masterpiece is ready!",
    "🏆 Gold medal performance! Your document shines!",
    "🍕 Hot and fresh! Your text is ready to serve!",
    "🎸 Drop the mic! Your paraphrase is legendary!",
    "🌈 Rainbow road complete! Your document crossed the finish line!",
    "🎮 Achievement unlocked: Master Paraphraser!",
    "🔥 Your document just leveled up! Absolutely fire!",
    
    // Nick-specific messages
    "Hey Nick! Your document just got a personality transplant. You're welcome! 😎",
    "Nick, I hope you're sitting down... your text is THAT good now! 🎩",
    "Nick's approved! This paraphrase passes the vibe check ✅",
    "Yo Nick! Your words just went through a spa day. They're glowing! 💆",
    "Nick, even Shakespeare is jealous of this rewrite! 📜",
    "Hey Nick, I didn't just paraphrase this... I gave it a glow-up! ✨",
    "Nick's Document System strikes again! Another masterpiece! 🎨",
    "Nick, your document is ready. No autographs, please! 🖊️",
    "Breaking News: Nick's document is now 47% fancier! 📰",
    "Nick, I seasoned your text with extra flavor. Bon appétit! 👨‍🍳",
    
    // Pop culture references
    "May the words be with you! Your document is Jedi-level now! ⚔️",
    "Thanos snapped, and half your redundant words vanished! Perfectly balanced! 🫰",
    "Your document just entered its villain era. It's THAT good! 😈",
    "Plot twist: Your text was the main character all along! 📖",
    "This isn't your average paraphrase. This is... ADVANCED paraphrase! 🧪",
    "Your document just got bit by a radioactive thesaurus! 🕷️",
    "Houston, we have a paraphrase! And it's out of this world! 🚀",
    "I solemnly swear this document is now more mischievously worded! 🪄",
    "Welcome to the matrix. Your document chose the blue pill! 💊",
    "Your text just pulled a Clark Kent → Superman transformation! 🦸",
    
    // Food & cooking themed
    "Your document is now Michelin-star quality! 👨‍🍳",
    "Medium rare? Nah, your text is perfectly done! 🥩",
    "I tossed your words in the air like a pizza chef. Magnifico! 🍕",
    "Your document just caramelized beautifully. *Chef's kiss* 🍮",
    "Served fresh with a side of eloquence! Bon appétit! 🍽️",
    "Your text got the Gordon Ramsay treatment. It's NOT RAW anymore! 👨‍🍳",
    "Baked to perfection! Your document is golden brown! 🥖",
    "I whisked your words into something fluffy and delightful! 🥐",
    
    // Gaming references
    "VICTORY ROYALE! Your document just won the battle! 🎮",
    "Critical hit! Your paraphrase deals 9999 damage! ⚔️",
    "Achievement Unlocked: Legendary Wordsmith! 🏅",
    "Combo x100! Your text is on fire! 🔥",
    "Level up! Your document gained +50 eloquence! ⬆️",
    "Respawn complete! Your text has a new life! 🔄",
    "Headshot! Your words hit different now! 🎯",
    "You've collected all 7 Dragon Balls of paraphrasing! 🐉",
    "Final boss defeated! Your document is the ultimate champion! 👑",
    "New high score! This paraphrase is unbeatable! 🕹️",
    
    // Movie/TV references
    "I'll be back... oh wait, your document already is! 🤖",
    "You had me at 'paraphrase.' Your doc is ready! 💝",
    "To infinity and beyond! Your text just reached new heights! 🚀",
    "I'm the king of the world! And this is the king of documents! 🚢",
    "There's no place like home... and no paraphrase like this! 🌈",
    "E.T. phone home... to tell everyone about this amazing text! 👽",
    "Life is like a box of chocolates... this document is the good one! 🍫",
    "Show me the money! No wait, show me THIS document! 💰",
    "You can't handle the truth... that your text is THIS good! ⚖️",
    "Here's looking at you, kid. Your document is beautiful! 🎬",
    
    // Music themed
    "Your document just dropped the hottest album of the year! 🎵",
    "This paraphrase hits different. It's a whole vibe! 🎧",
    "Your words are now Grammy-nominated! 🏆",
    "Remix complete! Your text is the club banger now! 🎶",
    "Your document just went platinum! 💿",
    "Drop the bass! Your text is bumping! 🔊",
    "This paraphrase is a certified bop! 🎤",
    "Your words are now on the Billboard Hot 100! 📊",
    
    // Sports themed
    "GOOOAAALLL! Your document scores! ⚽",
    "Touchdown! Your text crossed the goal line! 🏈",
    "Slam dunk! Nothing but net on this paraphrase! 🏀",
    "Home run! Your document is out of the park! ⚾",
    "Hole in one! Perfect paraphrase on the first try! ⛳",
    "Checkmate! Your document wins the game! ♟️",
    "Strike! Your text knocked down all the pins! 🎳",
    "Photo finish! Your document wins by a nose! 🏇",
    
    // Science & tech
    "Einstein called. He wants to study your document! 🧪",
    "Your text just went quantum. It's in multiple states of awesome! ⚛️",
    "NASA approved! Your document is ready for launch! 🛸",
    "Your words evolved like Pokémon! They're way stronger now! ⚡",
    "Eureka! We've discovered the perfect paraphrase! 🔬",
    "Your document just passed the Turing test of eloquence! 🤖",
    "Beam me up, Scotty! This text is out of this world! 🖖",
    "Your words just split the atom of mediocrity! 💥",
    
    // Random hilarious ones
    "Your document walked in ugly and walked out as a supermodel! 💅",
    "I put your text through the car wash of eloquence! ✨",
    "Your words went to finishing school. They have manners now! 🎓",
    "Document.exe has stopped being boring! 💻",
    "Your text got a personality transplant. The surgery was a success! 🏥",
    "I gave your words a makeover. They clean up NICE! 💄",
    "Your document leveled up from 'meh' to 'WOW'! 📈",
    "The transformation is complete. Your text is now a butterfly! 🦋",
    "Your words went to therapy. They're so much better now! 🛋️",
    "I unleashed the kraken of paraphrasing on your document! 🐙",
    "Your text got struck by lightning. It's electric now! ⚡",
    "Document upgrade: complete. Installing confidence... 100%! 📊",
    "Your words just graduated with honors! 🎓",
    "I sprinkled some magic dust on your text. Poof! ✨",
    "Your document is now fluent in Fancy! 🎩",
    "Warning: Your text is now hazardously good! ⚠️",
    "I turned your document up to 11! 🎸",
    "Your words just got their pilot's license! Ready for takeoff! ✈️",
    "Plot twist: Your document was secretly amazing all along! 🎭",
    "Your text just won Document Idol! 🎤",
    "Congratulations! Your words are now Instagram-worthy! 📸",
    "Your document joined the Avengers of eloquence! 🦸",
    "I fed your text some spinach. It's strong now! 💪",
    "Your words are now certified organic and locally sourced! 🌱",
    "Document status: SLAYING! 💅",
    "Your text is now main character energy! ⭐",
    "I gave your words a Red Bull. They have wings now! 🪽",
    "Your document is now too cool for school! 😎",
    "Warning: This paraphrase may cause extreme satisfaction! ⚠️",
    "Your text just became the chosen one! 🔮",
    "I blessed your document with the holy water of eloquence! 💧",
    "Your words are now black belt in communication! 🥋",
    "Document transformation: Bruce Banner → Hulk! SMASH! 💚",
    "Your text just won the lottery of linguistics! 💰",
    "I vaccinated your document against boring-ness! 💉",
    "Your words are now street legal in all 50 states! 🚗",
    "Document upgrade: From dial-up to fiber optic! 🚀",
    "Your text just earned its PhD in Awesome! 🎓",
    "I gave your words a spa day at the Dictionary Resort! 🧖",
    "Your document is now Marie Kondo approved! It sparks joy! ✨",
    "Warning: Side effects may include excessive readability! 💊",
    "Your text just became a certified snack! 🍪",
    "Document.exe has successfully updated to version 2.0! 💻",
    "Your words are now Netflix-worthy! Binge-read ready! 📺",
    "I put your text in the hyperbolic time chamber. It's stronger! ⏰",
    "Your document just unlocked its final form! 🦎",
    "Roses are red, violets are blue, your document is paraphrased, and it's amazing too! 🌹",
  ];

  const [config, setConfig] = useState<ParaphrasingConfig>({
    tone: 'neutral',
    formality: 'medium',
    creativity: 'moderate',
    preserveFormatting: true,
    model: AI_MODELS[0].id, // Default to Claude 3.5 Sonnet
    intensity: 3, // Default to moderate paraphrasing
  });
  
  const [selectedModel, setSelectedModel] = useState(AI_MODELS[0]);

  const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4MB - Vercel infrastructure limit

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const ext = selectedFile.name.split('.').pop()?.toLowerCase();
      
      // Check file size
      if (selectedFile.size > MAX_FILE_SIZE) {
        setError(`File too large. Maximum size is ${(MAX_FILE_SIZE / 1024 / 1024).toFixed(0)}MB (Vercel platform limit). For larger files, please contact support.`);
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

  const pollJobStatus = async (jobId: string) => {
    try {
      const response = await fetch(`/api/jobs/${jobId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch job status (${response.status})`);
      }

      const text = await response.text();
      if (!text) {
        console.error('Empty response from job status endpoint');
        return;
      }

      const data = JSON.parse(text);
      
      console.log('Job status:', data.status, 'Result:', data.result ? `${data.result.length} chars` : 'null');
      
      setProgress(data.progress || 0);
      setCurrentChunk(data.currentChunk || 0);
      setTotalChunks(data.totalChunks || 0);

      if (data.status === 'completed') {
        console.log('Setting result:', data.result);
        setResult(data.result || '');
        setHallucinationScore(data.hallucinationScore ?? null);
        setProcessing(false);
        
        // Show completion popup with random funny message
        const randomMessage = funnyMessages[Math.floor(Math.random() * funnyMessages.length)];
        setCompletionMessage(randomMessage);
        setShowCompletionPopup(true);
        
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
      } else if (data.status === 'failed') {
        setError(data.error || 'Processing failed');
        setProcessing(false);
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
      }
    } catch (err: any) {
      console.error('Poll error:', err);
      setError(err.message || 'Failed to check job status');
      setProcessing(false);
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    // Clear any existing poll interval
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }

    setProcessing(true);
    setProgress(0);
    setError('');
    setResult('');
    setJobId('');
    setHallucinationScore(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('config', JSON.stringify(config));

      console.log('Sending request to /api/paraphrase...');
      const response = await fetch('/api/paraphrase', {
        method: 'POST',
        body: formData,
      });

      console.log('Response received:', response.status, response.statusText);
      
      // Parse response text first to avoid double-consuming
      const responseText = await response.text();
      console.log('Response text length:', responseText.length);
      console.log('Response text preview:', responseText.substring(0, 200));
      
      if (!response.ok) {
        if (response.status === 413) {
          throw new Error('File too large for server. Maximum is 4MB due to Vercel limits.');
        }
        // Try to parse error as JSON
        let errorMessage = `Failed to process document (${response.status})`;  
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          // Not JSON, use raw text
          if (responseText) {
            errorMessage = responseText;
          }
        }
        throw new Error(errorMessage);
      }

      // Parse successful response
      console.log('Parsing response as JSON...');
      const data = JSON.parse(responseText);
      console.log('Parsed data:', JSON.stringify(data).substring(0, 200));
      setJobId(data.jobId);
      setTotalChunks(data.totalChunks || 0);

      // Response now contains the complete result (synchronous processing)
      if (data.status === 'completed') {
        setResult(data.result || '');
        setHallucinationScore(data.hallucinationScore ?? null);
        setProgress(100);
        setProcessing(false);
        
        // Show completion popup with random funny message
        const randomMessage = funnyMessages[Math.floor(Math.random() * funnyMessages.length)];
        setCompletionMessage(randomMessage);
        setShowCompletionPopup(true);
      } else {
        // Fallback to polling if status is not completed (backward compatibility)
        pollIntervalRef.current = setInterval(() => {
          pollJobStatus(data.jobId);
        }, 2000);
        pollJobStatus(data.jobId);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      setProcessing(false);
    }
  };

  const downloadResult = async () => {
    if (!jobId) return;
    
    try {
      // Download in original format from API
      const response = await fetch(`/api/download/${jobId}`);
      
      if (!response.ok) {
        throw new Error('Failed to download file');
      }
      
      // Get filename from Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `paraphrased_${file?.name}`;
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+?)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Download error:', err);
      setError(err.message || 'Failed to download file');
    }
  };
  
  const getHallucinationAssessment = (score: number | null) => {
    if (score === null) return null;
    
    if (score <= 20) {
      return { label: 'Excellent', color: 'green', bgColor: 'bg-green-50', textColor: 'text-green-800', borderColor: 'border-green-200' };
    } else if (score <= 40) {
      return { label: 'Good', color: 'blue', bgColor: 'bg-blue-50', textColor: 'text-blue-800', borderColor: 'border-blue-200' };
    } else if (score <= 60) {
      return { label: 'Moderate', color: 'yellow', bgColor: 'bg-yellow-50', textColor: 'text-yellow-800', borderColor: 'border-yellow-200' };
    } else if (score <= 80) {
      return { label: 'Poor', color: 'orange', bgColor: 'bg-orange-50', textColor: 'text-orange-800', borderColor: 'border-orange-200' };
    } else {
      return { label: 'Critical', color: 'red', bgColor: 'bg-red-50', textColor: 'text-red-800', borderColor: 'border-red-200' };
    }
  };

  return (
    <EtherealShadow
      color="rgba(194, 65, 12, 0.6)"
      animation={{ scale: 100, speed: 90 }}
      noise={{ opacity: 0.4, scale: 1.2 }}
      sizing="fill"
      className="min-h-screen w-full bg-orange-950"
    >
      <div className="min-h-screen py-12 px-4 flex items-center justify-center">
        <div className="max-w-4xl w-full mx-auto">
          <div className={`bg-white/85 backdrop-blur-2xl rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] p-8 md:p-10 border-white/40 ring-1 ring-black/5 relative ${
            processing 
              ? 'border-4 animate-rainbow-border' 
              : 'border'
          }`}>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2 text-center">Nick's Document System</h1>
            <p className="text-gray-700 text-lg mb-8 text-center">AI-powered document paraphrasing with 10+ advanced models</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-3">
                Select Document
              </label>
              <div className="relative">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.txt"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="flex items-center justify-center w-full px-6 py-4 bg-gradient-to-r from-orange-50 to-amber-50 border-2 border-dashed border-orange-300 rounded-xl cursor-pointer hover:border-orange-400 hover:from-orange-100 hover:to-amber-100 transition-all shadow-sm hover:shadow-md"
                >
                  <div className="text-center">
                    <svg className="mx-auto h-12 w-12 text-orange-400 mb-2" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <div className="text-sm text-gray-700">
                      <span className="font-semibold text-orange-600">Choose a file</span>
                      <span className="text-gray-500"> or drag and drop</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">PDF, DOCX, or TXT up to 4MB</p>
                  </div>
                </label>
              </div>
              {file && (
                <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl flex items-center gap-4 animate-slide-in">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-green-800 mb-1">✓ File Ready to Process</p>
                    <p className="text-sm text-gray-700 font-medium truncate">{file.name}</p>
                    <p className="text-xs text-gray-500 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB • {file.type || 'Document'}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setFile(null);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                      }
                    }}
                    className="flex-shrink-0 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
            </div>

            {/* AI Model Selection */}
            <div className="border-t border-gray-200 pt-6">
              <label className="block text-sm font-medium text-gray-800 mb-3">
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
                    className={`relative p-4 rounded-xl border-2 text-left transition-all ${
                      selectedModel.id === model.id
                        ? 'border-orange-500 bg-orange-50 shadow-lg'
                        : 'border-gray-200 hover:border-orange-300 bg-white hover:bg-gray-50'
                    }`}
                  >
                    {model.recommended && (
                      <span className="absolute top-2 right-2 text-xs bg-green-500 text-white px-2 py-0.5 rounded-full shadow-lg">
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

            {/* Paraphrasing Intensity Slider */}
            <div className="border-t border-gray-200 pt-6">
              <label className="block text-base font-semibold text-gray-800 mb-6 text-center">
                Paraphrasing Intensity
              </label>
              <div className="px-8 py-4">
                {/* Current Level Indicator */}
                <div className="mb-6 text-center">
                  <div className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl border-2 border-orange-200 shadow-lg">
                    <span className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                      {(config.intensity || 3) === 1 && 'Minimal'}
                      {(config.intensity || 3) === 2 && 'Light'}
                      {(config.intensity || 3) === 3 && 'Moderate'}
                      {(config.intensity || 3) === 4 && 'Substantial'}
                      {(config.intensity || 3) === 5 && 'Complete'}
                    </span>
                  </div>
                </div>

                {/* Slider Container */}
                <div className="relative mb-8 px-2">
                  {/* Slider Track with Dots */}
                  <div className="absolute top-1/2 left-2 right-2 -translate-y-1/2 pointer-events-none">
                    <div className="h-2 bg-gradient-to-r from-orange-200 via-orange-300 to-amber-400 rounded-full shadow-inner" />
                    {/* Position Markers */}
                    <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 flex justify-between">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <div
                          key={level}
                          className={`w-5 h-5 -ml-2.5 rounded-full border-3 transition-all duration-300 ${
                            (config.intensity || 3) === level
                              ? 'bg-white border-orange-600 scale-125 shadow-xl'
                              : 'bg-white border-gray-300 scale-100'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  
                  {/* Actual Slider Input */}
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="1"
                    value={config.intensity || 3}
                    onChange={(e) => setConfig({ ...config, intensity: parseInt(e.target.value) })}
                    className="relative w-full h-8 appearance-none bg-transparent cursor-pointer z-10"
                    style={{
                      WebkitAppearance: 'none',
                    }}
                  />
                </div>

                {/* Level Labels */}
                <div className="flex justify-between mb-6 px-1">
                  {[
                    { value: 1, label: 'Minimal' },
                    { value: 2, label: 'Light' },
                    { value: 3, label: 'Moderate' },
                    { value: 4, label: 'Substantial' },
                    { value: 5, label: 'Complete' },
                  ].map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setConfig({ ...config, intensity: value })}
                      className={`flex-1 text-center transition-all duration-300 cursor-pointer py-2 rounded-lg ${
                        (config.intensity || 3) === value
                          ? 'text-sm font-bold text-orange-700 scale-110'
                          : 'text-xs font-medium text-gray-500 hover:text-orange-600 hover:scale-105'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {/* Description Panel */}
                <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-5 border border-orange-100 shadow-sm">
                  <p className="text-sm leading-relaxed text-gray-700 text-center">
                    {(config.intensity || 3) === 1 && (
                      <span><strong className="text-orange-700">Minimal Changes:</strong> Preserves original wording with only essential vocabulary adjustments. Ideal for technical or legal documents.</span>
                    )}
                    {(config.intensity || 3) === 2 && (
                      <span><strong className="text-orange-700">Light Touch:</strong> Subtle modifications to structure and word choice while maintaining the original voice and style.</span>
                    )}
                    {(config.intensity || 3) === 3 && (
                      <span><strong className="text-orange-700">Balanced Rewrite:</strong> Comprehensive rephrasing with different sentence structures and vocabulary, preserving all original meaning.</span>
                    )}
                    {(config.intensity || 3) === 4 && (
                      <span><strong className="text-orange-700">Substantial Transformation:</strong> Significant restructuring with new phrasing and expression patterns while keeping factual accuracy.</span>
                    )}
                    {(config.intensity || 3) === 5 && (
                      <span><strong className="text-orange-700">Complete Reimagination:</strong> Fresh, creative expression of the same ideas with entirely new structures and vocabulary.</span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Configuration */}
            <div className="border-t border-gray-200 pt-6 space-y-6">
              {/* Tone */}
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-3">Tone</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'formal', label: 'Formal', icon: '👔', desc: 'Professional' },
                    { value: 'neutral', label: 'Neutral', icon: '⚖️', desc: 'Balanced' },
                    { value: 'casual', label: 'Casual', icon: '😊', desc: 'Friendly' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setConfig({ ...config, tone: option.value as any })}
                      className={`p-3 rounded-xl border-2 transition-all text-center ${
                        config.tone === option.value
                          ? 'border-orange-500 bg-gradient-to-br from-orange-50 to-amber-50 shadow-md scale-105'
                          : 'border-gray-200 bg-white hover:border-orange-300 hover:bg-orange-50/50'
                      }`}
                    >
                      <div className="text-2xl mb-1">{option.icon}</div>
                      <div className="text-sm font-semibold text-gray-900">{option.label}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{option.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Formality */}
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-3">Formality</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'high', label: 'High', icon: '🎩', desc: 'Very formal' },
                    { value: 'medium', label: 'Medium', icon: '📝', desc: 'Standard' },
                    { value: 'low', label: 'Low', icon: '💬', desc: 'Conversational' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setConfig({ ...config, formality: option.value as any })}
                      className={`p-3 rounded-xl border-2 transition-all text-center ${
                        config.formality === option.value
                          ? 'border-orange-500 bg-gradient-to-br from-orange-50 to-amber-50 shadow-md scale-105'
                          : 'border-gray-200 bg-white hover:border-orange-300 hover:bg-orange-50/50'
                      }`}
                    >
                      <div className="text-2xl mb-1">{option.icon}</div>
                      <div className="text-sm font-semibold text-gray-900">{option.label}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{option.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Creativity */}
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-3">Creativity</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'conservative', label: 'Conservative', icon: '🛡️', desc: 'Safe & close' },
                    { value: 'moderate', label: 'Moderate', icon: '🎨', desc: 'Balanced' },
                    { value: 'creative', label: 'Creative', icon: '✨', desc: 'Imaginative' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setConfig({ ...config, creativity: option.value as any })}
                      className={`p-3 rounded-xl border-2 transition-all text-center ${
                        config.creativity === option.value
                          ? 'border-orange-500 bg-gradient-to-br from-orange-50 to-amber-50 shadow-md scale-105'
                          : 'border-gray-200 bg-white hover:border-orange-300 hover:bg-orange-50/50'
                      }`}
                    >
                      <div className="text-2xl mb-1">{option.icon}</div>
                      <div className="text-sm font-semibold text-gray-900">{option.label}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{option.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Preserve Formatting */}
              <div className="pt-2">
                <label className="flex items-center space-x-3 cursor-pointer p-4 rounded-xl border-2 border-gray-200 bg-white hover:border-orange-300 hover:bg-orange-50/50 transition-all">
                  <input
                    type="checkbox"
                    checked={config.preserveFormatting}
                    onChange={(e) => setConfig({ ...config, preserveFormatting: e.target.checked })}
                    className="w-5 h-5 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                  />
                  <div className="flex-1">
                    <span className="text-sm font-semibold text-gray-900">Preserve Formatting</span>
                    <p className="text-xs text-gray-500 mt-0.5">Keep original structure and layout</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!file || processing}
              className={`w-full py-3 px-6 rounded-xl font-semibold transition-all ${
                file && !processing
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:from-orange-600 hover:to-amber-600 shadow-lg hover:shadow-xl cursor-pointer'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-50'
              }`}
            >
              {processing ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              ) : !file ? (
                'Upload a Document First'
              ) : (
                'Paraphrase Document'
              )}
            </button>
          </form>

          {/* Progress */}
          {processing && (
            <div className="mt-6">
              <div className="flex justify-between text-sm text-gray-700 mb-2">
                <span>Processing chunk {currentChunk} of {totalChunks}</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-gradient-to-r from-orange-500 to-amber-500 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              {jobId && (
                <p className="text-xs text-gray-500 mt-2">Job ID: {jobId}</p>
              )}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl">
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
                  className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all text-sm font-medium shadow-lg hover:shadow-xl"
                >
                  Download {file?.name.split('.').pop()?.toUpperCase() || 'File'}
                </button>
              </div>
              
              {/* Hallucination Score */}
              {hallucinationScore !== null && (
                <div className={`mb-4 p-5 rounded-xl border-2 ${
                  getHallucinationAssessment(hallucinationScore)?.bgColor
                } ${
                  getHallucinationAssessment(hallucinationScore)?.borderColor
                }`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className={`text-lg font-bold ${
                          getHallucinationAssessment(hallucinationScore)?.textColor
                        }`}>
                          {getHallucinationAssessment(hallucinationScore)?.label} Quality
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          getHallucinationAssessment(hallucinationScore)?.bgColor
                        } ${
                          getHallucinationAssessment(hallucinationScore)?.textColor
                        } border ${
                          getHallucinationAssessment(hallucinationScore)?.borderColor
                        }`}>
                          {hallucinationScore}% Hallucination Risk
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-700 mb-3 leading-relaxed">
                        {hallucinationScore <= 20 && (
                          <span>✅ <strong>Outstanding fidelity.</strong> The paraphrase stays true to the original content with minimal risk of added or altered information. Safe to use without additional review.</span>
                        )}
                        {hallucinationScore > 20 && hallucinationScore <= 40 && (
                          <span>✓ <strong>Good fidelity.</strong> Minor deviations detected but the core meaning is preserved. Light review recommended for critical documents.</span>
                        )}
                        {hallucinationScore > 40 && hallucinationScore <= 60 && (
                          <span>⚠️ <strong>Moderate changes detected.</strong> Some rephrasing may have altered nuances. Review is recommended to ensure accuracy.</span>
                        )}
                        {hallucinationScore > 60 && hallucinationScore <= 80 && (
                          <span>⚠️ <strong>Significant deviations found.</strong> The paraphrase includes notable changes that may affect meaning. Careful review is strongly advised.</span>
                        )}
                        {hallucinationScore > 80 && (
                          <span>❌ <strong>High risk of hallucinations.</strong> Major content alterations or potential fabrications detected. Thorough review and fact-checking required before use.</span>
                        )}
                      </p>
                      
                      {/* Visual bar indicator */}
                      <div className="mt-3">
                        <div className="flex items-center gap-2 text-xs text-gray-600 mb-1">
                          <span>Low Risk</span>
                          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className={`h-full transition-all duration-500 ${
                                hallucinationScore <= 20 ? 'bg-green-500' :
                                hallucinationScore <= 40 ? 'bg-blue-500' :
                                hallucinationScore <= 60 ? 'bg-yellow-500' :
                                hallucinationScore <= 80 ? 'bg-orange-500' :
                                'bg-red-500'
                              }`}
                              style={{ width: `${hallucinationScore}%` }}
                            />
                          </div>
                          <span>High Risk</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-center justify-center px-4">
                      <div className={`text-5xl font-black ${
                        getHallucinationAssessment(hallucinationScore)?.textColor
                      }`}>
                        {hallucinationScore}%
                      </div>
                      <div className="text-xs text-gray-600 mt-1 text-center">risk score</div>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 max-h-96 overflow-y-auto">
                <pre className="text-sm text-gray-800 whitespace-pre-wrap font-sans">{result}</pre>
              </div>
            </div>
          )}
          
          {/* Completion Popup */}
          {showCompletionPopup && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
              <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full transform animate-bounce-in">
                <div className="text-center">
                  <div className="text-6xl mb-4">🎉</div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">
                    Document Paraphrased!
                  </h3>
                  <p className="text-lg text-gray-700 mb-6">
                    {completionMessage}
                  </p>
                  <button
                    onClick={() => setShowCompletionPopup(false)}
                    className="px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl font-semibold hover:from-orange-600 hover:to-amber-600 transition-all shadow-lg hover:shadow-xl"
                  >
                    Awesome! Show me the results
                  </button>
                </div>
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
              <a href="https://github.com/arihealthbird/doc-paraphraser-nextjs" target="_blank" rel="noopener noreferrer" className="text-orange-600 hover:text-orange-700 underline">
                GitHub
              </a>
            </p>
          </div>
        </div>
      </div>
      </div>
    </EtherealShadow>
  );
}
