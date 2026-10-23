import React, { useState } from 'react';
import { ExperimentVariant } from '../types';
import { FlaskConical, TrendingUp, Sparkles, Check } from 'lucide-react';
import clsx from 'clsx';

interface ExperimentPanelProps {
  data: ExperimentVariant[];
  onApplyVariant?: (variant: ExperimentVariant) => void;
}

const ExperimentPanel: React.FC<ExperimentPanelProps> = ({ data, onApplyVariant }) => {
  const [appliedIdx, setAppliedIdx] = useState<number | null>(null);

  const handleApply = (variant: ExperimentVariant, idx: number) => {
    if (onApplyVariant) {
      onApplyVariant(variant);
      setAppliedIdx(idx);
      setTimeout(() => setAppliedIdx(null), 2000);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="mb-4">
        <h3 className="text-lg font-bold flex items-center gap-2 dark:text-white text-slate-900">
          <FlaskConical size={18} className="text-emerald-500" /> Experiment Lab
        </h3>
        <p className="text-xs opacity-60 mt-1">
          A/B test variants aligned with creator DNA to maximize retention.
        </p>
      </div>

      <div className="space-y-4">
        {data.map((variant, i) => (
          <div
            key={i}
            className={clsx(
              'p-4 rounded-xl border transition-all relative overflow-hidden',
              variant.predictedWinner
                ? 'bg-emerald-500/10 border-emerald-500/30'
                : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/5'
            )}
          >
            {variant.predictedWinner && (
              <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[9px] font-bold px-2 py-1 rounded-bl-lg">
                PREDICTED WINNER
              </div>
            )}

            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider opacity-60 bg-slate-500/10 dark:bg-white/10 px-1.5 py-0.5 rounded">
                {variant.type}
              </span>
            </div>

            <p className="text-sm font-medium mb-3 dark:text-slate-200 text-slate-800">
              {variant.reason}
            </p>

            <div className="flex items-center gap-2 text-xs font-bold mb-4">
              <TrendingUp
                size={14}
                className={variant.predictedWinner ? 'text-emerald-500' : 'opacity-50'}
              />
              <span>{variant.confidence}% Confidence</span>
            </div>

            {onApplyVariant && (
              <button
                onClick={() => handleApply(variant, i)}
                className="w-full py-2 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-500 text-xs font-bold transition-colors flex items-center justify-center gap-2"
              >
                {appliedIdx === i ? (
                  <>
                    <Check size={12} /> Variant Note Added to Opening
                  </>
                ) : (
                  <>
                    <Sparkles size={12} /> Apply Variant Angle to Hook
                  </>
                )}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExperimentPanel;
