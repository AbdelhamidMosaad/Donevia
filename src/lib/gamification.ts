
'use client';

import {
  BookOpen,
  CheckCircle2,
  Lightbulb,
  Rocket,
  Sparkles,
  Trophy,
} from 'lucide-react';
import type { Badge, BadgeId, StudyProfile } from './types';
import { db } from './firebase';
import {
  collection,
  doc,
  getDocs,
  query,
  runTransaction,
} from 'firebase/firestore';

export const badges: Record<BadgeId, Badge> = {
  'subtopic-master-1': {
    id: 'subtopic-master-1',
    name: 'First Steps',
    description: 'Complete your first topic.',
    icon: 'CheckCircle2',
  },
  'subtopic-master-10': {
    id: 'subtopic-master-10',
    name: 'Study Enthusiast',
    description: 'Complete 10 topics.',
    icon: 'BookOpen',
  },
  'subtopic-master-50': {
    id: 'subtopic-master-50',
    name: 'Topic Explorer',
    description: 'Complete 50 topics.',
    icon: 'Lightbulb',
  },
  'subtopic-master-100': {
    id: 'subtopic-master-100',
    name: 'Knowledge Navigator',
    description: 'Complete 100 topics.',
    icon: 'Rocket',
  },
  'goal-crusher-1': {
    id: 'goal-crusher-1',
    name: 'Goal Crusher',
    description: 'Complete your first study goal.',
    icon: 'Trophy',
  },
  'goal-crusher-5': {
    id: 'goal-crusher-5',
    name: 'Goal Dominator',
    description: 'Complete 5 study goals.',
    icon: 'Trophy',
  },
  'perfect-week': {
    id: 'perfect-week',
    name: 'Perfect Week',
    description: 'Maintain a 7-day study streak.',
    icon: 'Sparkles',
  },
  'knowledge-architect': {
    id: 'knowledge-architect',
    name: 'Knowledge Architect',
    description: 'Create a study goal with at least 5 chapters.',
    icon: 'Sparkles',
  },
};

const levels = [
  0, 100, 250, 500, 1000, 2000, 4000, 8000, 16000, 32000,
];
export const maxLevel = levels.length;

export const getXPForNextLevel = (level: number): number => {
  return levels[level] || Infinity;
};

// Points awarded for different actions
const XP_PER_TOPIC = 10;
const XP_PER_GOAL_COMPLETION = 100;

export const checkAndAwardBadges = async (
  userId: string,
  eventType: 'topic' | 'goal' | 'chapter'
): Promise<BadgeId[]> => {
  const settingsRef = doc(db, 'users', userId, 'profile', 'settings');
  const awardedBadges: BadgeId[] = [];

  try {
    await runTransaction(db, async (transaction) => {
      const settingsSnap = await transaction.get(settingsRef);
      let profile: StudyProfile = settingsSnap.data()?.studyProfile || {
        level: 1,
        experiencePoints: 0,
        earnedBadges: [],
        currentStreak: 0,
        longestStreak: 0,
        lastStudyDay: '',
      };

      // --- Award XP ---
      if (eventType === 'topic') {
        profile.experiencePoints += XP_PER_TOPIC;
      } else if (eventType === 'goal') {
        profile.experiencePoints += XP_PER_GOAL_COMPLETION;
      }
      
      // --- Level Up Check ---
      let xpForNext = getXPForNextLevel(profile.level);
      while (profile.experiencePoints >= xpForNext) {
          profile.level += 1;
          // Optionally, you can decide if XP resets on level up or carries over.
          // For now, we'll let it carry over.
          xpForNext = getXPForNextLevel(profile.level);
      }

      // --- Badge Checks ---
      const allTopicsQuery = query(
        collection(db, 'users', userId, 'studyTopics')
      );
      const allTopicsSnap = await getDocs(allTopicsQuery);
      const completedTopics = allTopicsSnap.docs.filter(
        (doc) => doc.data().isCompleted
      ).length;

      const checkAndAddBadge = (id: BadgeId) => {
        if (!profile.earnedBadges.includes(id)) {
          profile.earnedBadges.push(id);
          awardedBadges.push(id);
        }
      };

      if (completedTopics >= 1) checkAndAddBadge('subtopic-master-1');
      if (completedTopics >= 10) checkAndAddBadge('subtopic-master-10');
      if (completedTopics >= 50) checkAndAddBadge('subtopic-master-50');
      if (completedTopics >= 100) checkAndAddBadge('subtopic-master-100');
      
      if (profile.currentStreak >= 7) checkAndAddBadge('perfect-week');

      // More complex checks can be added here
      // For goal completion, you would need to fetch goal data and check if all topics are complete.

      transaction.set(settingsRef, { studyProfile: profile }, { merge: true });
    });
  } catch (error) {
    console.error('Error in gamification check:', error);
    // Don't throw, as it's not a critical failure
  }

  return awardedBadges;
};
