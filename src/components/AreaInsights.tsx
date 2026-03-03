'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles,
  Home,
  Car,
  Shield,
  MapPin,
  TrendingUp,
  ThumbsUp,
  BarChart3,
} from 'lucide-react';
import surveysApi, { SurveyInsight } from '@/lib/api/surveys';

const categoryIcons: Record<string, React.ElementType> = {
  rent: Home,
  traffic: Car,
  safety: Shield,
  amenities: Sparkles,
  general: MapPin,
};

const categoryColors: Record<string, { bg: string; text: string; bar: string }> = {
  rent: {
    bg: 'bg-[var(--peach-100)] dark:bg-[var(--peach-500)]/10',
    text: 'text-[var(--peach-600)] dark:text-[var(--peach-400)]',
    bar: 'bg-gradient-to-r from-[var(--peach-400)] to-[var(--pink-400)]',
  },
  traffic: {
    bg: 'bg-[var(--yellow-100)] dark:bg-[var(--yellow-500)]/10',
    text: 'text-[var(--yellow-600)] dark:text-[var(--yellow-400)]',
    bar: 'bg-gradient-to-r from-[var(--yellow-400)] to-[var(--peach-400)]',
  },
  safety: {
    bg: 'bg-[var(--teal-100)] dark:bg-[var(--teal-500)]/10',
    text: 'text-[var(--teal-600)] dark:text-[var(--teal-400)]',
    bar: 'bg-gradient-to-r from-[var(--teal-400)] to-[var(--lime-400)]',
  },
  amenities: {
    bg: 'bg-[var(--lavender-100)] dark:bg-[var(--lavender-400)]/10',
    text: 'text-[var(--lavender-500)] dark:text-[var(--lavender-400)]',
    bar: 'bg-gradient-to-r from-[var(--lavender-400)] to-[var(--pink-400)]',
  },
  general: {
    bg: 'bg-[var(--lime-100)] dark:bg-[var(--lime-500)]/10',
    text: 'text-[var(--lime-600)] dark:text-[var(--lime-400)]',
    bar: 'bg-gradient-to-r from-[var(--lime-400)] to-[var(--teal-400)]',
  },
};

function InsightCard({ insight }: { insight: SurveyInsight }) {
  const Icon = categoryIcons[insight.category] || MapPin;
  const colors = categoryColors[insight.category] || categoryColors.general;

  // Format display based on type
  const renderValue = () => {
    switch (insight.type) {
      case 'rating': {
        const avg = insight.data.average || 0;
        const percentage = (avg / 5) * 100;
        return (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-neutral-600 dark:text-neutral-400 font-medium">
                {insight.data.label}
              </span>
              <span className="font-bold text-neutral-900 dark:text-neutral-100">
                {avg}/5
              </span>
            </div>
            <div className="h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
              <div
                className={`h-full ${colors.bar} rounded-full transition-all duration-500`}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        );
      }
      case 'yesno': {
        const yesPercent = insight.data.yes || 0;
        return (
          <div className="flex items-center gap-2">
            <ThumbsUp className="w-4 h-4 text-[var(--lime-500)]" />
            <span className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
              {yesPercent}%
            </span>
            <span className="text-sm text-neutral-500">say yes</span>
          </div>
        );
      }
      case 'choice':
      case 'area_pick': {
        const winner = insight.data.winner;
        const pct = insight.data.winnerPercentage || 0;
        return (
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[var(--teal-500)]" />
            <span className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
              {winner}
            </span>
            <span className="text-sm text-neutral-500">({pct}%)</span>
          </div>
        );
      }
      default:
        return null;
    }
  };

  // Short label for the insight
  const getLabel = () => {
    if (insight.area) return `${insight.category.charAt(0).toUpperCase() + insight.category.slice(1)} in ${insight.area}`;
    return insight.question.length > 40 ? insight.question.substring(0, 40) + '...' : insight.question;
  };

  return (
    <div className="py-3 first:pt-0 last:pb-0">
      <div className="flex items-start gap-3">
        <div className={`w-8 h-8 rounded-lg ${colors.bg} flex items-center justify-center flex-shrink-0`}>
          <Icon className={`w-4 h-4 ${colors.text}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">
            {getLabel()}
          </p>
          {renderValue()}
        </div>
      </div>
    </div>
  );
}

export default function AreaInsights() {
  const [insights, setInsights] = useState<SurveyInsight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    surveysApi.getInsights()
      .then(data => {
        setInsights(data.slice(0, 5)); // Show top 5
      })
      .catch(err => {
        console.error('Failed to fetch insights:', err);
      })
      .finally(() => setLoading(false));
  }, []);

  // Don't render if no insights
  if (!loading && insights.length === 0) return null;

  const totalResponses = insights.reduce((sum, i) => sum + (i.data.totalResponses || 0), 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="card-glass p-5"
    >
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-5 h-5 text-[var(--teal-500)]" />
        <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">
          Community Insights
        </h3>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-neutral-200 dark:bg-neutral-700" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-2/3" />
                  <div className="h-2 bg-neutral-200 dark:bg-neutral-700 rounded w-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {insights.map((insight) => (
              <InsightCard key={insight.questionId} insight={insight} />
            ))}
          </div>
          {totalResponses > 0 && (
            <p className="text-[10px] text-neutral-400 mt-3 text-center">
              Based on {totalResponses.toLocaleString()} community responses
            </p>
          )}
        </>
      )}
    </motion.div>
  );
}
