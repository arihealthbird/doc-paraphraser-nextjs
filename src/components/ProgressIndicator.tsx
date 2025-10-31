'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { memo, useEffect, useRef, useMemo } from 'react';
import {
  DocumentTextIcon,
  Squares2X2Icon,
  SparklesIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { CheckIcon } from '@heroicons/react/24/solid';
import type { Stage, StageStatus, STAGES } from '@/lib/types';

interface ProgressIndicatorProps {
  progress: number; // 0-100
  currentChunk: number;
  totalChunks: number;
  currentStage: Stage;
  stageStatuses: Record<Stage, StageStatus>;
  processing: boolean;
  startedAt?: number; // ms timestamp
  updatedAt?: number; // ms timestamp
  modelName?: string;
}

const STAGE_ICONS: Record<Stage, React.ComponentType<{ className?: string }>> = {
  upload_parse: DocumentTextIcon,
  analyze_chunk: Squares2X2Icon,
  paraphrase: SparklesIcon,
  quality_check: ShieldCheckIcon,
  finalize: CheckCircleIcon,
};

const STAGE_MESSAGES: Record<Stage, (chunks: number, current: number, model: string) => string> = {
  upload_parse: () => 'Extracting text from your file using LlamaCloud…',
  analyze_chunk: (chunks) => `Analyzing structure and preparing ${chunks} ${chunks === 1 ? 'chunk' : 'chunks'}…`,
  paraphrase: (chunks, current, model) => `Paraphrasing chunk ${current} of ${chunks} with ${model}…`,
  quality_check: () => 'Verifying accuracy and checking for hallucinations…',
  finalize: () => 'Finalizing your paraphrased document…',
};

// Radial Progress Ring Component
const RadialProgress = memo(({ progress, stage, eta, speed }: { progress: number; stage: string; eta?: string; speed?: string }) => {
  const radius = 70;
  const strokeWidth = 12;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center">
      {/* Pulsing background glow */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-orange-200/40 to-amber-200/40 blur-2xl lux-pulse-ring" />
      
      {/* SVG Ring */}
      <svg width="200" height="200" className="relative z-10">
        <defs>
          <linearGradient id="luxGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#f59e0b" />
          </linearGradient>
        </defs>
        
        {/* Background circle */}
        <circle
          cx="100"
          cy="100"
          r={radius}
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        
        {/* Progress circle */}
        <motion.circle
          cx="100"
          cy="100"
          r={radius}
          stroke="url(#luxGradient)"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          transform={`rotate(-90 100 100)`}
        />
      </svg>
      
      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
        <motion.div
          key={progress}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="text-5xl font-black bg-gradient-to-br from-orange-600 to-amber-600 bg-clip-text text-transparent"
        >
          {Math.round(progress)}%
        </motion.div>
        <div className="text-xs font-medium text-gray-600 mt-1 max-w-[140px] leading-tight">
          {stage}
        </div>
        {(eta || speed) && (
          <div className="text-xs text-gray-500 mt-2 space-y-0.5">
            {speed && <div className="font-medium">{speed}</div>}
            {eta && <div>{eta}</div>}
          </div>
        )}
      </div>
    </div>
  );
});

RadialProgress.displayName = 'RadialProgress';

// Stage Item Component
const StageItem = memo(({ 
  stage, 
  label, 
  status, 
  index 
}: { 
  stage: Stage; 
  label: string; 
  status: StageStatus; 
  index: number;
}) => {
  const Icon = STAGE_ICONS[stage];
  const isActive = status === 'in_progress';
  const isComplete = status === 'complete';

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className={`relative flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
        isActive
          ? 'border-orange-400 bg-gradient-to-r from-orange-50 to-amber-50 lux-shimmer'
          : isComplete
          ? 'border-green-400 bg-green-50/50'
          : 'border-gray-200 bg-white/50'
      }`}
    >
      {/* Icon badge */}
      <div
        className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
          isActive
            ? 'bg-gradient-to-br from-orange-500 to-amber-500 shadow-lg'
            : isComplete
            ? 'bg-gradient-to-br from-green-500 to-emerald-500 shadow-md'
            : 'bg-gray-200'
        }`}
      >
        {isComplete ? (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            <CheckIcon className="w-6 h-6 text-white" />
          </motion.div>
        ) : (
          <Icon className={`w-6 h-6 ${isActive ? 'text-white' : 'text-gray-500'}`} />
        )}
      </div>

      {/* Label and status */}
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-gray-900 text-sm">{label}</div>
        <div className="text-xs text-gray-500 mt-0.5">
          {status === 'pending' && 'Queued'}
          {status === 'in_progress' && (
            <span className="text-orange-600 font-medium">In Progress...</span>
          )}
          {status === 'complete' && (
            <span className="text-green-600 font-medium">✓ Complete</span>
          )}
        </div>
      </div>

      {/* Particle effect on completion */}
      {isComplete && (
        <AnimatePresence>
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl">
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 1, y: 0, x: `${20 + i * 30}%` }}
                animate={{ opacity: 0, y: -40 }}
                transition={{ duration: 0.8, delay: i * 0.1 }}
                className="absolute bottom-0 w-2 h-2 bg-green-400 rounded-full"
              />
            ))}
          </div>
        </AnimatePresence>
      )}
    </motion.div>
  );
});

StageItem.displayName = 'StageItem';

// Chunk Card Component
const ChunkCard = memo(({ 
  index, 
  status, 
  isActive 
}: { 
  index: number; 
  status: 'queued' | 'processing' | 'completed'; 
  isActive: boolean;
}) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isActive && ref.current) {
      ref.current.scrollIntoView({ 
        block: 'nearest', 
        inline: 'center', 
        behavior: 'smooth' 
      });
    }
  }, [isActive]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: Math.min(index * 0.02, 0.5) }}
      className={`relative flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-xl border-2 flex items-center justify-center font-bold text-sm transition-all ${
        status === 'completed'
          ? 'border-green-400 bg-green-50 text-green-700 shadow-md'
          : status === 'processing'
          ? 'border-orange-400 bg-gradient-to-br from-orange-50 to-amber-50 text-orange-700 shadow-lg scale-110 animate-rainbow-border'
          : 'border-gray-200 bg-gray-50 text-gray-400'
      }`}
    >
      <span className="relative z-10">
        {status === 'completed' ? '✓' : index + 1}
      </span>
      
      {/* Processing spinner */}
      {status === 'processing' && (
        <div className="absolute inset-0 rounded-xl overflow-hidden">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-[-2px] rounded-xl"
            style={{
              background: 'conic-gradient(from 0deg, transparent, #f97316, transparent)',
            }}
          />
        </div>
      )}
    </motion.div>
  );
});

ChunkCard.displayName = 'ChunkCard';

// Main Component
export default function ProgressIndicator({
  progress,
  currentChunk,
  totalChunks,
  currentStage,
  stageStatuses,
  processing,
  startedAt,
  updatedAt,
  modelName = 'Claude 3.5 Sonnet',
}: ProgressIndicatorProps) {
  // Compute ETA and speed
  const { eta, speed } = useMemo(() => {
    if (!startedAt || !updatedAt || currentChunk === 0) {
      return { eta: undefined, speed: undefined };
    }

    const elapsedMs = updatedAt - startedAt;
    const elapsedMin = elapsedMs / 60000;
    const chunksPerMin = currentChunk / Math.max(elapsedMin, 0.01);
    const remaining = Math.max(totalChunks - currentChunk, 0);
    const etaMin = remaining / Math.max(chunksPerMin, 0.01);

    return {
      speed: `${chunksPerMin.toFixed(1)} chunks/min`,
      eta: etaMin > 0.5 ? `~${Math.ceil(etaMin)}m left` : 'Almost done!',
    };
  }, [currentChunk, totalChunks, startedAt, updatedAt]);

  // Status message
  const statusMessage = useMemo(() => {
    return STAGE_MESSAGES[currentStage](totalChunks, currentChunk, modelName);
  }, [currentStage, totalChunks, currentChunk, modelName]);

  // Chunk states
  const chunkStates = useMemo(() => {
    return Array.from({ length: totalChunks }, (_, i) => {
      if (i < currentChunk - 1) return 'completed';
      if (i === currentChunk - 1) return 'processing';
      return 'queued';
    });
  }, [totalChunks, currentChunk]);

  const stages: { key: Stage; label: string }[] = [
    { key: 'upload_parse', label: 'Upload & Parsing' },
    { key: 'analyze_chunk', label: 'Analysis & Chunking' },
    { key: 'paraphrase', label: 'AI Paraphrasing' },
    { key: 'quality_check', label: 'Quality Check' },
    { key: 'finalize', label: 'Finalization' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="lux-glass p-6 sm:p-8 space-y-6"
      role="region"
      aria-label="Paraphrasing progress"
    >
      {/* Status message */}
      <div
        className="text-center"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        <motion.p
          key={statusMessage}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm sm:text-base font-medium text-gray-700"
        >
          {statusMessage}
        </motion.p>
      </div>

      {/* Two-column layout: radial + stages */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Radial progress */}
        <div className="flex justify-center lg:sticky lg:top-8">
          <RadialProgress
            progress={progress}
            stage={stages.find(s => s.key === currentStage)?.label || ''}
            eta={eta}
            speed={speed}
          />
        </div>

        {/* Stage tracker */}
        <div
          className="space-y-3"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
          aria-label="Processing stages"
        >
          {stages.map((stage, index) => (
            <StageItem
              key={stage.key}
              stage={stage.key}
              label={stage.label}
              status={stageStatuses[stage.key]}
              index={index}
            />
          ))}
        </div>
      </div>

      {/* Chunk grid */}
      {totalChunks > 0 && (
        <div className="pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-800">
              Processing Chunks ({currentChunk}/{totalChunks})
            </h3>
            {progress < 100 && (
              <div className="text-xs text-gray-500">
                {Math.max(totalChunks - currentChunk, 0)} remaining
              </div>
            )}
          </div>
          
          <div className="relative">
            <div className="flex gap-2 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              {chunkStates.map((status, index) => (
                <ChunkCard
                  key={index}
                  index={index}
                  status={status}
                  isActive={index === currentChunk - 1}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
