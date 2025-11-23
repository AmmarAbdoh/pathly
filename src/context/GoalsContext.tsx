/**
 * Goals context provider
 * Manages global goal state and operations
 */

import { STORAGE_KEYS } from '@/src/constants/storage-keys';
import { Goal, GoalDirection, GoalSchedule, TimePeriod } from '@/src/types';
import { calculateGoalProgress, calculateProgress } from '@/src/utils/goal-calculations';
import { goalsStorage } from '@/src/utils/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getTotalPointsEarned, processRecurringGoals, updateGoalStreaks } from '../utils/recurring-goals';

interface GoalsContextType {
  goals: Goal[];
  lifetimePointsEarned: number;
  isLoading: boolean;
  error: string | null;
  addGoal: (
    title: string,
    target: number,
    current: number,
    unit: string,
    direction: GoalDirection,
    points: number,
    period: TimePeriod,
    customPeriodDays?: number,
    parentId?: number,
    isUltimate?: boolean,
    isRecurring?: boolean,
    description?: string,
    icon?: string,
    linkedRewardId?: number,
    subgoalsAwardPoints?: boolean,
    schedule?: GoalSchedule
  ) => Promise<void>;
  addSubgoal: (
    parentId: number,
    title: string,
    target: number,
    current: number,
    unit: string,
    direction: GoalDirection,
    points: number,
    period: TimePeriod,
    customPeriodDays?: number
  ) => Promise<void>;
  updateGoal: (id: number, current: number) => Promise<void>;
  editGoal: (
    id: number,
    title: string,
    target: number,
    current: number,
    unit: string,
    direction: GoalDirection,
    points: number,
    period: TimePeriod,
    customPeriodDays?: number,
    isUltimate?: boolean,
    isRecurring?: boolean,
    description?: string,
    icon?: string
  ) => Promise<void>;
  finishGoal: (id: number) => Promise<void>;
  removeGoal: (id: number) => Promise<void>;
  archiveGoal: (id: number) => Promise<void>;
  unarchiveGoal: (id: number) => Promise<void>;
  permanentlyDeleteGoal: (id: number) => Promise<void>;
  extendDeadline: (id: number, additionalDays: number) => Promise<void>;
  togglePause: (id: number) => Promise<void>;
  refreshGoals: () => Promise<void>;
  getSubgoals: (parentId: number) => Goal[];
  recalculateProgress: (goalId: number) => Promise<void>;
  reorderGoals: (goalIds: number[]) => Promise<void>;
  addNote: (goalId: number, text: string) => Promise<void>;
  deleteNote: (goalId: number, noteId: string) => Promise<void>;
  addDependency: (goalId: number, dependsOnId: number) => Promise<void>;
  removeDependency: (goalId: number, dependsOnId: number) => Promise<void>;
  checkDependencies: (goalId: number) => boolean;
  updateNotificationSettings: (
    goalId: number,
    enabled: boolean,
    time?: number,
    days?: number[]
  ) => Promise<void>;
}

const GoalsContext = createContext<GoalsContextType | undefined>(undefined);

interface GoalsProviderProps {
  children: ReactNode;
}

/**
 * Goals Provider Component
 * Wraps the app to provide goals context to all children
 */
export function GoalsProvider({ children }: GoalsProviderProps) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [lifetimePointsEarned, setLifetimePointsEarned] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load goals on mount
  useEffect(() => {
    loadGoals();
  }, []);

  /**
   * Load goals from storage and process recurring goals
   */
  const loadGoals = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const savedGoals = await goalsStorage.loadGoals();
      
      // Process recurring goals (reset if period ended)
      const processedGoals = processRecurringGoals(savedGoals);
      
      // Update streaks for all recurring goals
      const goalsWithStreaks = processedGoals.map(goal => 
        goal.isRecurring ? updateGoalStreaks(goal) : goal
      );
      
      // Save back if any goals were reset or streaks updated
      if (JSON.stringify(goalsWithStreaks) !== JSON.stringify(savedGoals)) {
        await goalsStorage.saveGoals(goalsWithStreaks);
      }
      
      // Load lifetime points earned
      const savedLifetimePoints = await AsyncStorage.getItem(STORAGE_KEYS.LIFETIME_POINTS);
      let lifetime = savedLifetimePoints ? parseInt(savedLifetimePoints, 10) : 0;
      
      // If no saved lifetime points, calculate from existing completed goals (migration)
      if (!savedLifetimePoints) {
        lifetime = goalsWithStreaks.reduce((sum, goal) => {
          if (goal.parentId) return sum; // Skip subgoals
          
          if (goal.isRecurring) {
            return sum + getTotalPointsEarned(goal);
          } else {
            return sum + (goal.isComplete ? goal.points : 0);
          }
        }, 0);
        
        // Save the calculated lifetime points
        await AsyncStorage.setItem(STORAGE_KEYS.LIFETIME_POINTS, lifetime.toString());
      }
      
      setLifetimePointsEarned(lifetime);
      setGoals(goalsWithStreaks);
    } catch (err) {
      console.error('Error loading goals:', err);
      setError('Failed to load goals');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Increment lifetime points earned (never decreases)
   */
  const incrementLifetimePoints = useCallback(async (points: number) => {
    try {
      const newTotal = lifetimePointsEarned + points;
      setLifetimePointsEarned(newTotal);
      await AsyncStorage.setItem(STORAGE_KEYS.LIFETIME_POINTS, newTotal.toString());
    } catch (err) {
      console.error('Error incrementing lifetime points:', err);
    }
  }, [lifetimePointsEarned]);

  /**
   * Refresh goals from storage
   */
  const refreshGoals = useCallback(async () => {
    await loadGoals();
  }, []);

  /**
   * Add a new goal
   */
  const addGoal = useCallback(
    async (
      title: string,
      target: number,
      current: number,
      unit: string,
      direction: GoalDirection,
      points: number,
      period: TimePeriod,
      customPeriodDays?: number,
      parentId?: number,
      isUltimate?: boolean,
      isRecurring?: boolean,
      description?: string,
      icon?: string,
      linkedRewardId?: number,
      subgoalsAwardPoints?: boolean,
      schedule?: GoalSchedule
    ) => {
      try {
        const progress = calculateProgress(current, target, direction, current);

        const newGoal: Goal = {
          id: Date.now(),
          title: title.trim(),
          description: description?.trim(),
          target,
          current,
          initialValue: current,
          unit: unit.trim(),
          progress,
          createdAt: Date.now(),
          direction,
          points,
          icon,
          period,
          customPeriodDays,
          parentId,
          subGoals: [],
          periodStartDate: Date.now(),
          isUltimate,
          isComplete: false,
          isRecurring,
          completionHistory: [],
          linkedRewardId,
          subgoalsAwardPoints: subgoalsAwardPoints ?? (isUltimate ? false : undefined), // Default false for ultimate goals
          schedule,
        };

        let updatedGoals = [...goals, newGoal];
        
        // If this is a subgoal, add it to parent's subGoals array
        if (parentId) {
          updatedGoals = updatedGoals.map(goal => {
            if (goal.id === parentId) {
              return {
                ...goal,
                subGoals: [...(goal.subGoals || []), newGoal.id],
              };
            }
            return goal;
          });
        }

        setGoals(updatedGoals);
        await goalsStorage.saveGoals(updatedGoals);
        
        // Recalculate parent progress if this is a subgoal
        if (parentId) {
          await recalculateProgressInternal(parentId, updatedGoals);
        }
      } catch (err) {
        console.error('Error adding goal:', err);
        setError('Failed to add goal');
        throw err;
      }
    },
    [goals]
  );

  /**
   * Add a subgoal to a parent goal
   */
  const addSubgoal = useCallback(
    async (
      parentId: number,
      title: string,
      target: number,
      current: number,
      unit: string,
      direction: GoalDirection,
      points: number,
      period: TimePeriod,
      customPeriodDays?: number
    ) => {
      await addGoal(
        title,
        target,
        current,
        unit,
        direction,
        points,
        period,
        customPeriodDays,
        parentId
      );
    },
    [addGoal]
  );

  /**
   * Get all subgoals for a parent goal
   */
  const getSubgoals = useCallback(
    (parentId: number): Goal[] => {
      return goals.filter(goal => goal.parentId === parentId);
    },
    [goals]
  );

  /**
   * Recalculate progress for a goal (internal helper)
   */
  const recalculateProgressInternal = async (goalId: number, currentGoals: Goal[]) => {
    const goal = currentGoals.find(g => g.id === goalId);
    if (!goal) return;

    const newProgress = calculateGoalProgress(goal, currentGoals);
    
    const updatedGoals = currentGoals.map(g => {
      if (g.id === goalId) {
        return { ...g, progress: newProgress };
      }
      return g;
    });

    setGoals(updatedGoals);
    await goalsStorage.saveGoals(updatedGoals);
    
    // If this goal has a parent, recalculate parent's progress too
    if (goal.parentId) {
      await recalculateProgressInternal(goal.parentId, updatedGoals);
    }
  };

  /**
   * Recalculate progress for a goal and its parents
   */
  const recalculateProgress = useCallback(
    async (goalId: number) => {
      await recalculateProgressInternal(goalId, goals);
    },
    [goals]
  );

  /**
   * Update goal progress
   */
  const updateGoal = useCallback(
    async (id: number, current: number) => {
      try {
        const originalGoal = goals.find(g => g.id === id);
        const wasComplete = originalGoal?.isComplete || false;
        
        const updatedGoals = goals.map((goal) => {
          if (goal.id === id) {
            const progress = calculateProgress(
              current,
              goal.target,
              goal.direction,
              goal.initialValue
            );
            const isNowComplete = progress >= 100;
            
            return { 
              ...goal, 
              current, 
              progress,
              isComplete: isNowComplete,
              completedAt: isNowComplete && !goal.isComplete ? Date.now() : goal.completedAt
            };
          }
          return goal;
        });

        setGoals(updatedGoals);
        await goalsStorage.saveGoals(updatedGoals);
        
        // Increment lifetime points if goal reached 100% for the first time
        const updatedGoal = updatedGoals.find(g => g.id === id);
        if (updatedGoal && !wasComplete && updatedGoal.isComplete) {
          // Award points if: no parent, OR parent allows subgoal points
          if (!updatedGoal.parentId) {
            await incrementLifetimePoints(updatedGoal.points);
          } else {
            const parentGoal = updatedGoals.find(g => g.id === updatedGoal.parentId);
            if (parentGoal?.subgoalsAwardPoints) {
              await incrementLifetimePoints(updatedGoal.points);
            }
          }
        }
        
        // Recalculate parent progress if this goal has a parent
        if (updatedGoal?.parentId) {
          await recalculateProgressInternal(updatedGoal.parentId, updatedGoals);
        }
      } catch (err) {
        console.error('Error updating goal:', err);
        setError('Failed to update goal');
        throw err;
      }
    },
    [goals, incrementLifetimePoints]
  );

  /**
   * Edit goal - update all properties
   */
  const editGoal = useCallback(
    async (
      id: number,
      title: string,
      target: number,
      current: number,
      unit: string,
      direction: GoalDirection,
      points: number,
      period: TimePeriod,
      customPeriodDays?: number,
      isUltimate?: boolean,
      isRecurring?: boolean,
      description?: string,
      icon?: string,
      linkedRewardId?: number
    ) => {
      try {
        const goal = goals.find(g => g.id === id);
        if (!goal) return;

        const progress = calculateProgress(current, target, direction, goal.initialValue);

        const updatedGoals = goals.map((g) => {
          if (g.id === id) {
            return {
              ...g,
              title: title.trim(),
              description: description?.trim(),
              target,
              current,
              unit: unit.trim(),
              direction,
              points,
              icon,
              period,
              customPeriodDays,
              progress,
              isUltimate,
              isRecurring,
              linkedRewardId,
            };
          }
          return g;
        });

        setGoals(updatedGoals);
        await goalsStorage.saveGoals(updatedGoals);
        
        // Recalculate parent progress if this goal has a parent
        if (goal.parentId) {
          await recalculateProgressInternal(goal.parentId, updatedGoals);
        }
      } catch (err) {
        console.error('Error editing goal:', err);
        setError('Failed to edit goal');
        throw err;
      }
    },
    [goals]
  );

  /**
   * Mark goal as complete (set to 100%)
   */
  const finishGoal = useCallback(
    async (id: number) => {
      try {
        const goal = goals.find(g => g.id === id);
        if (!goal) return;

        // Only increment lifetime points if this is the first completion (not already complete)
        const isFirstCompletion = !goal.isComplete;

        // Calculate the current value that would result in 100% progress
        let completedCurrent: number;
        if (goal.direction === 'increase') {
          completedCurrent = goal.target;
        } else {
          completedCurrent = goal.target;
        }

        const updatedGoals = goals.map((g) => {
          if (g.id === id) {
            const completedGoal = {
              ...g,
              current: completedCurrent,
              progress: 100,
              isComplete: true,
              completedAt: Date.now(), // Track completion timestamp
            };
            // Update streaks for recurring goals
            return g.isRecurring ? updateGoalStreaks(completedGoal) : completedGoal;
          }
          return g;
        });

        setGoals(updatedGoals);
        await goalsStorage.saveGoals(updatedGoals);
        
        // Increment lifetime points for first-time completion (points never decrease)
        if (isFirstCompletion) {
          // Award points if: no parent, OR parent allows subgoal points
          if (!goal.parentId) {
            await incrementLifetimePoints(goal.points);
          } else {
            const parentGoal = updatedGoals.find(g => g.id === goal.parentId);
            if (parentGoal?.subgoalsAwardPoints) {
              await incrementLifetimePoints(goal.points);
            }
          }
        }
        
        // Recalculate parent progress if this goal has a parent
        if (goal.parentId) {
          await recalculateProgressInternal(goal.parentId, updatedGoals);
        }

        // Auto-redeem linked reward if exists
        if (goal.linkedRewardId && isFirstCompletion) {
          try {
            // Load rewards from storage
            const rewardsData = await AsyncStorage.getItem('@pathly_rewards');
            if (rewardsData) {
              const rewards = JSON.parse(rewardsData);
              const linkedReward = rewards.find((r: any) => r.id === goal.linkedRewardId);
              
              if (linkedReward && !linkedReward.isRedeemed) {
                // Auto-redeem the reward
                const updatedRewards = rewards.map((r: any) => 
                  r.id === goal.linkedRewardId 
                    ? { ...r, isRedeemed: true, redeemedAt: Date.now() }
                    : r
                );
                await AsyncStorage.setItem('@pathly_rewards', JSON.stringify(updatedRewards));
                console.log(`Auto-redeemed reward ${linkedReward.title} for completing goal ${goal.title}`);
              }
            }
          } catch (rewardErr) {
            console.error('Error auto-redeeming linked reward:', rewardErr);
            // Don't throw - goal completion should succeed even if reward redemption fails
          }
        }
      } catch (err) {
        console.error('Error finishing goal:', err);
        setError('Failed to finish goal');
        throw err;
      }
    },
    [goals, incrementLifetimePoints]
  );

  /**
   * Remove a goal and all its subgoals (archives them instead of deleting)
   */
  const removeGoal = useCallback(
    async (id: number) => {
      // Archive the goal instead of deleting
      await archiveGoalInternal(id);
    },
    [goals]
  );

  /**
   * Archive a goal and all its subgoals
   */
  const archiveGoalInternal = async (id: number) => {
    try {
      const goalToArchive = goals.find(g => g.id === id);
      if (!goalToArchive) return;
      
      const now = Date.now();
      
      // Get all subgoals to archive
      const subgoalIds = goalToArchive.subGoals || [];
      const allIdsToArchive = [id, ...subgoalIds];
      
      // Archive goal and all its subgoals
      let updatedGoals = goals.map((goal) => {
        if (allIdsToArchive.includes(goal.id)) {
          return {
            ...goal,
            isArchived: true,
            archivedAt: now,
          };
        }
        return goal;
      });
      
      // If this was a subgoal, remove it from parent's subGoals array and recalculate
      if (goalToArchive.parentId) {
        updatedGoals = updatedGoals.map(goal => {
          if (goal.id === goalToArchive.parentId) {
            return {
              ...goal,
              subGoals: (goal.subGoals || []).filter(subId => subId !== id),
            };
          }
          return goal;
        });
        
        // Recalculate parent progress
        await recalculateProgressInternal(goalToArchive.parentId, updatedGoals);
      }
      
      setGoals(updatedGoals);
      await goalsStorage.saveGoals(updatedGoals);
    } catch (err) {
      console.error('Error archiving goal:', err);
      setError('Failed to archive goal');
      throw err;
    }
  };

  const archiveGoal = useCallback(
    async (id: number) => {
      await archiveGoalInternal(id);
    },
    [goals]
  );

  /**
   * Unarchive a goal and all its subgoals
   */
  const unarchiveGoal = useCallback(
    async (id: number) => {
      try {
        const goalToUnarchive = goals.find(g => g.id === id);
        if (!goalToUnarchive) return;
        
        // Get all subgoals to unarchive
        const subgoalIds = goalToUnarchive.subGoals || [];
        const allIdsToUnarchive = [id, ...subgoalIds];
        
        // Unarchive goal and all its subgoals
        const updatedGoals = goals.map((goal) => {
          if (allIdsToUnarchive.includes(goal.id)) {
            const { isArchived, archivedAt, ...rest } = goal;
            return rest as Goal;
          }
          return goal;
        });
        
        setGoals(updatedGoals);
        await goalsStorage.saveGoals(updatedGoals);
      } catch (err) {
        console.error('Error unarchiving goal:', err);
        setError('Failed to unarchive goal');
        throw err;
      }
    },
    [goals]
  );

  /**
   * Permanently delete a goal and all its subgoals
   */
  const permanentlyDeleteGoal = useCallback(
    async (id: number) => {
      try {
        const goalToRemove = goals.find(g => g.id === id);
        if (!goalToRemove) return;
        
        // Get all subgoals to remove
        const subgoalIds = goalToRemove.subGoals || [];
        const allIdsToRemove = [id, ...subgoalIds];
        
        // Remove goal and all its subgoals permanently
        let updatedGoals = goals.filter((goal) => !allIdsToRemove.includes(goal.id));
        
        // If this was a subgoal, remove it from parent's subGoals array
        if (goalToRemove.parentId) {
          updatedGoals = updatedGoals.map(goal => {
            if (goal.id === goalToRemove.parentId) {
              return {
                ...goal,
                subGoals: (goal.subGoals || []).filter(subId => subId !== id),
              };
            }
            return goal;
          });
          
          // Recalculate parent progress
          await recalculateProgressInternal(goalToRemove.parentId, updatedGoals);
        }
        
        setGoals(updatedGoals);
        await goalsStorage.saveGoals(updatedGoals);
      } catch (err) {
        console.error('Error permanently deleting goal:', err);
        setError('Failed to permanently delete goal');
        throw err;
      }
    },
    [goals]
  );

  /**
   * Extend the deadline of an expired goal
   */
  const extendDeadline = useCallback(
    async (id: number, additionalDays: number) => {
      try {
        const goal = goals.find((g) => g.id === id);
        if (!goal || !goal.periodStartDate) return;

        // Calculate new period start date (add milliseconds for additional days)
        const millisecondsPerDay = 24 * 60 * 60 * 1000;
        const newStartDate = goal.periodStartDate + (additionalDays * millisecondsPerDay);
        
        const updatedGoals = goals.map((g) =>
          g.id === id
            ? {
                ...g,
                periodStartDate: newStartDate,
              }
            : g
        );

        setGoals(updatedGoals);
        await goalsStorage.saveGoals(updatedGoals);
      } catch (err) {
        console.error('Error extending deadline:', err);
        setError('Failed to extend deadline');
        throw err;
      }
    },
    [goals]
  );

  /**
   * Toggle pause state of a goal
   */
  const togglePause = useCallback(
    async (id: number) => {
      try {
        const goal = goals.find((g) => g.id === id);
        if (!goal) return;

        const updatedGoals = goals.map((g) =>
          g.id === id
            ? {
                ...g,
                isPaused: !g.isPaused,
                pausedAt: !g.isPaused ? Date.now() : undefined,
              }
            : g
        );

        setGoals(updatedGoals);
        await goalsStorage.saveGoals(updatedGoals);
      } catch (err) {
        console.error('Error toggling pause:', err);
        setError('Failed to pause/resume goal');
        throw err;
      }
    },
    [goals]
  );

  /**
   * Reorder goals by updating their sortOrder property
   * @param goalIds - Array of goal IDs in the new desired order
   */
  const reorderGoals = useCallback(
    async (goalIds: number[]) => {
      try {
        // Create a map of goal ID to new sort order
        const sortOrderMap = new Map<number, number>();
        goalIds.forEach((id, index) => {
          sortOrderMap.set(id, index);
        });

        // Update all goals with new sort orders
        const updatedGoals = goals.map((goal) => {
          const newSortOrder = sortOrderMap.get(goal.id);
          if (newSortOrder !== undefined) {
            return { ...goal, sortOrder: newSortOrder };
          }
          return goal;
        });

        setGoals(updatedGoals);
        await goalsStorage.saveGoals(updatedGoals);
      } catch (err) {
        console.error('Error reordering goals:', err);
        setError('Failed to reorder goals');
        throw err;
      }
    },
    [goals]
  );

  const addNote = useCallback(
    async (goalId: number, text: string) => {
      try {
        const updatedGoals = goals.map((goal) => {
          if (goal.id === goalId) {
            const newNote = {
              id: Date.now().toString(),
              text: text.trim(),
              createdAt: Date.now(),
            };
            const existingNotes = goal.notes || [];
            return { ...goal, notes: [...existingNotes, newNote] };
          }
          return goal;
        });

        setGoals(updatedGoals);
        await goalsStorage.saveGoals(updatedGoals);
      } catch (err) {
        console.error('Error adding note:', err);
        setError('Failed to add note');
        throw err;
      }
    },
    [goals]
  );

  const deleteNote = useCallback(
    async (goalId: number, noteId: string) => {
      try {
        const updatedGoals = goals.map((goal) => {
          if (goal.id === goalId && goal.notes) {
            return { ...goal, notes: goal.notes.filter((note) => note.id !== noteId) };
          }
          return goal;
        });

        setGoals(updatedGoals);
        await goalsStorage.saveGoals(updatedGoals);
      } catch (err) {
        console.error('Error deleting note:', err);
        setError('Failed to delete note');
        throw err;
      }
    },
    [goals]
  );

  const addDependency = useCallback(
    async (goalId: number, dependsOnId: number) => {
      try {
        const updatedGoals = goals.map((goal) => {
          if (goal.id === goalId) {
            const existingDeps = goal.dependsOn || [];
            // Don't add if already exists
            if (existingDeps.includes(dependsOnId)) {
              return goal;
            }
            return { ...goal, dependsOn: [...existingDeps, dependsOnId] };
          }
          return goal;
        });

        setGoals(updatedGoals);
        await goalsStorage.saveGoals(updatedGoals);
      } catch (err) {
        console.error('Error adding dependency:', err);
        setError('Failed to add dependency');
        throw err;
      }
    },
    [goals]
  );

  const removeDependency = useCallback(
    async (goalId: number, dependsOnId: number) => {
      try {
        const updatedGoals = goals.map((goal) => {
          if (goal.id === goalId && goal.dependsOn) {
            return { ...goal, dependsOn: goal.dependsOn.filter((id) => id !== dependsOnId) };
          }
          return goal;
        });

        setGoals(updatedGoals);
        await goalsStorage.saveGoals(updatedGoals);
      } catch (err) {
        console.error('Error removing dependency:', err);
        setError('Failed to remove dependency');
        throw err;
      }
    },
    [goals]
  );

  const checkDependencies = useCallback(
    (goalId: number) => {
      const goal = goals.find((g) => g.id === goalId);
      if (!goal || !goal.dependsOn || goal.dependsOn.length === 0) {
        return true; // No dependencies, goal is not blocked
      }

      // Check if all dependency goals are complete
      return goal.dependsOn.every((depId) => {
        const depGoal = goals.find((g) => g.id === depId);
        return depGoal?.isComplete === true;
      });
    },
    [goals]
  );

  const updateNotificationSettings = useCallback(
    async (
      goalId: number,
      enabled: boolean,
      time?: number,
      days?: number[]
    ) => {
      try {
        const { scheduleGoalNotification, cancelGoalNotifications } = await import('../utils/notifications');
        
        const updatedGoals = await Promise.all(
          goals.map(async (goal) => {
            if (goal.id === goalId) {
              const updatedGoal = {
                ...goal,
                notificationsEnabled: enabled,
                notificationTime: time,
                notificationDays: days,
              };

              // Schedule or cancel notifications
              if (enabled && time !== undefined) {
                try {
                  const notificationIds = await scheduleGoalNotification(updatedGoal);
                  updatedGoal.notificationIds = notificationIds;
                } catch (err) {
                  console.error('Error scheduling notifications:', err);
                  throw err;
                }
              } else if (goal.notificationIds && goal.notificationIds.length > 0) {
                await cancelGoalNotifications(goal.notificationIds);
                updatedGoal.notificationIds = [];
              }

              return updatedGoal;
            }
            return goal;
          })
        );

        setGoals(updatedGoals);
        await goalsStorage.saveGoals(updatedGoals);
      } catch (err) {
        console.error('Error updating notification settings:', err);
        setError('Failed to update notification settings');
        throw err;
      }
    },
    [goals]
  );

  const value = useMemo(
    () => ({
      goals,
      lifetimePointsEarned,
      isLoading,
      error,
      addGoal,
      addSubgoal,
      updateGoal,
      editGoal,
      finishGoal,
      removeGoal,
      archiveGoal,
      unarchiveGoal,
      permanentlyDeleteGoal,
      extendDeadline,
      togglePause,
      refreshGoals,
      getSubgoals,
      recalculateProgress,
      reorderGoals,
      addNote,
      deleteNote,
      addDependency,
      removeDependency,
      checkDependencies,
      updateNotificationSettings,
    }),
    [goals, lifetimePointsEarned, isLoading, error, addGoal, addSubgoal, updateGoal, editGoal, finishGoal, removeGoal, archiveGoal, unarchiveGoal, permanentlyDeleteGoal, extendDeadline, togglePause, refreshGoals, getSubgoals, recalculateProgress, reorderGoals, addNote, deleteNote, addDependency, removeDependency, checkDependencies, updateNotificationSettings]
  );

  return (
    <GoalsContext.Provider value={value}>
      {children}
    </GoalsContext.Provider>
  );
}

/**
 * Hook to access goals context
 * @throws Error if used outside GoalsProvider
 */
export function useGoals(): GoalsContextType {
  const context = useContext(GoalsContext);
  if (!context) {
    throw new Error('useGoals must be used within a GoalsProvider');
  }
  return context;
}
