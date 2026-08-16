/**
 * App-wide learner state.
 *
 * Holds the learner profile and every topic ability in memory, backed by SQLite. The
 * dataset is small (a few dozen rows), so loading it all up front keeps the screens
 * synchronous and avoids a loading spinner on every navigation.
 */

import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { TOPICS, topicsForTier } from '@/content/curriculum';
import { hasContent } from '@/content/questions';
import * as repository from '@/data/repository';
import {
  initialAbility,
  masteryLevel,
  masteryProgress,
  predictedGrade,
} from '@/domain/ability';
import { recommendTopic } from '@/domain/selection';
import type {
  Grade,
  Learner,
  MasteryLevel,
  Tier,
  Topic,
  TopicAbility,
} from '@/domain/types';

interface LearnerContextValue {
  ready: boolean;
  learner: Learner;
  abilities: Map<string, TopicAbility>;
  /** Topics for the learner's tier. */
  topics: Topic[];
  /** Ability for a topic, falling back to a seeded one if never practised. */
  abilityFor: (topicId: string) => TopicAbility;
  masteryFor: (topic: Topic) => MasteryLevel;
  progressFor: (topic: Topic) => number;
  /** Overall predicted grade across everything practised so far. */
  predicted: Grade;
  /** The next topic the learning journey suggests, or null if all are mastered. */
  nextTopic: Topic | null;
  refresh: () => Promise<void>;
  setSettings: (tier: Tier, targetGrade: Grade) => Promise<void>;
  resetProgress: () => Promise<void>;
}

const DEFAULT_LEARNER: Learner = {
  tier: 'foundation',
  targetGrade: 5,
  xp: 0,
  streakDays: 0,
  lastActiveDay: null,
};

const LearnerContext = createContext<LearnerContextValue | null>(null);

export function LearnerProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [learner, setLearner] = useState<Learner>(DEFAULT_LEARNER);
  const [abilities, setAbilities] = useState<Map<string, TopicAbility>>(new Map());

  const refresh = useCallback(async () => {
    const [nextLearner, storedAbilities] = await Promise.all([
      repository.getLearner(),
      repository.getAllAbilities(),
    ]);
    setLearner(nextLearner);
    setAbilities(new Map(storedAbilities.map((a) => [a.topicId, a])));
    setReady(true);
  }, []);

  useEffect(() => {
    refresh().catch((error) => {
      // Storage failing should not leave the app stuck on a spinner forever.
      console.error('Failed to load learner state', error);
      setReady(true);
    });
  }, [refresh]);

  const value = useMemo<LearnerContextValue>(() => {
    const topics = topicsForTier(learner.tier);

    const abilityFor = (topicId: string) =>
      abilities.get(topicId) ?? initialAbility(topicId, learner.targetGrade);

    const masteryFor = (topic: Topic) =>
      masteryLevel(abilityFor(topic.id), topic.targetGrade);

    const progressFor = (topic: Topic) =>
      masteryProgress(abilityFor(topic.id), topic.targetGrade);

    const isMastered = (topic: Topic) => masteryFor(topic) === 'mastered';
    const isSecure = (topic: Topic) => {
      const level = masteryFor(topic);
      return level === 'secure' || level === 'mastered';
    };

    // Only suggest topics we actually have questions for; the rest are visible in the
    // curriculum but cannot be practised yet.
    const practisable = topics.filter((topic) => hasContent(topic.id));

    return {
      ready,
      learner,
      abilities,
      topics,
      abilityFor,
      masteryFor,
      progressFor,
      predicted: predictedGrade(
        TOPICS.map((topic) => abilityFor(topic.id)),
        learner.targetGrade,
      ),
      nextTopic: recommendTopic(practisable, abilities, isMastered, isSecure),
      refresh,
      setSettings: async (tier: Tier, targetGrade: Grade) => {
        await repository.updateLearnerSettings(tier, targetGrade);
        await refresh();
      },
      resetProgress: async () => {
        const { resetProgress } = await import('@/data/db');
        await resetProgress();
        await refresh();
      },
    };
  }, [ready, learner, abilities, refresh]);

  return <LearnerContext.Provider value={value}>{children}</LearnerContext.Provider>;
}

export function useLearner(): LearnerContextValue {
  const context = useContext(LearnerContext);
  if (!context) {
    throw new Error('useLearner must be used inside a LearnerProvider');
  }
  return context;
}
