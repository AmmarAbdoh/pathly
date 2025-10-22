/**
 * Goals context provider
 * Manages global goal state and operations
 */

import { Goal, GoalDirection, TimePeriod } from '@/src/types';
import { calculateGoalProgress, calculateProgress } from '@/src/utils/goal-calculations';
import { processRecurringGoals } from '@/src/utils/recurring-goals';
import { goalsStorage } from '@/src/utils/storage';
import React, { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';

interface GoalsContextType {
  goals: Goal[];
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
    icon?: string
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
  refreshGoals: () => Promise<void>;
  getSubgoals: (parentId: number) => Goal[];
  recalculateProgress: (goalId: number) => Promise<void>;
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
      
      // Save back if any goals were reset
      if (JSON.stringify(processedGoals) !== JSON.stringify(savedGoals)) {
        await goalsStorage.saveGoals(processedGoals);
      }
      
      setGoals(processedGoals);
    } catch (err) {
      console.error('Error loading goals:', err);
      setError('Failed to load goals');
    } finally {
      setIsLoading(false);
    }
  };

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
      icon?: string
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
        const updatedGoals = goals.map((goal) => {
          if (goal.id === id) {
            const progress = calculateProgress(
              current,
              goal.target,
              goal.direction,
              goal.initialValue
            );
            return { ...goal, current, progress };
          }
          return goal;
        });

        setGoals(updatedGoals);
        await goalsStorage.saveGoals(updatedGoals);
        
        // Recalculate parent progress if this goal has a parent
        const updatedGoal = updatedGoals.find(g => g.id === id);
        if (updatedGoal?.parentId) {
          await recalculateProgressInternal(updatedGoal.parentId, updatedGoals);
        }
      } catch (err) {
        console.error('Error updating goal:', err);
        setError('Failed to update goal');
        throw err;
      }
    },
    [goals]
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
      icon?: string
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

        // Calculate the current value that would result in 100% progress
        let completedCurrent: number;
        if (goal.direction === 'increase') {
          completedCurrent = goal.target;
        } else {
          completedCurrent = goal.target;
        }

        const updatedGoals = goals.map((g) => {
          if (g.id === id) {
            return {
              ...g,
              current: completedCurrent,
              progress: 100,
              isComplete: true,
              completedAt: Date.now(), // Track completion timestamp
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
        console.error('Error finishing goal:', err);
        setError('Failed to finish goal');
        throw err;
      }
    },
    [goals]
  );

  /**
   * Remove a goal and all its subgoals
   */
  const removeGoal = useCallback(
    async (id: number) => {
      try {
        const goalToRemove = goals.find(g => g.id === id);
        if (!goalToRemove) return;
        
        // Get all subgoals to remove
        const subgoalIds = goalToRemove.subGoals || [];
        const allIdsToRemove = [id, ...subgoalIds];
        
        // Remove goal and all its subgoals
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
        console.error('Error removing goal:', err);
        setError('Failed to remove goal');
        throw err;
      }
    },
    [goals]
  );

  const value = useMemo(
    () => ({
      goals,
      isLoading,
      error,
      addGoal,
      addSubgoal,
      updateGoal,
      editGoal,
      finishGoal,
      removeGoal,
      refreshGoals,
      getSubgoals,
      recalculateProgress,
    }),
    [goals, isLoading, error, addGoal, addSubgoal, updateGoal, editGoal, finishGoal, removeGoal, refreshGoals, getSubgoals, recalculateProgress]
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
