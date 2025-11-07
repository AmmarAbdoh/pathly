/**
 * Data export utilities
 * Export goals and rewards data to various formats
 */

import { Platform, Share } from 'react-native';
import { Goal, Reward } from '../types';

export interface ExportData {
  exportDate: string;
  exportTimestamp: number;
  goals: Goal[];
  rewards: Reward[];
  lifetimePointsEarned: number;
}

/**
 * Generate JSON export data
 */
export function generateJSONExport(
  goals: Goal[],
  rewards: Reward[],
  lifetimePointsEarned: number
): string {
  const exportData: ExportData = {
    exportDate: new Date().toISOString(),
    exportTimestamp: Date.now(),
    goals,
    rewards,
    lifetimePointsEarned,
  };
  
  return JSON.stringify(exportData, null, 2);
}

/**
 * Convert goals array to CSV format
 */
function goalsToCSV(goals: Goal[]): string {
  const headers = [
    'ID',
    'Title',
    'Description',
    'Target',
    'Current',
    'Unit',
    'Progress %',
    'Direction',
    'Points',
    'Period',
    'Is Complete',
    'Created At',
    'Completed At',
    'Is Ultimate',
    'Is Recurring',
    'Is Paused',
    'Is Archived',
    'Category',
    'Icon',
  ];
  
  const rows = goals.map((goal) => [
    goal.id,
    `"${(goal.title || '').replace(/"/g, '""')}"`,
    `"${(goal.description || '').replace(/"/g, '""')}"`,
    goal.target,
    goal.current,
    `"${(goal.unit || '').replace(/"/g, '""')}"`,
    Math.round(goal.progress),
    goal.direction,
    goal.points,
    goal.period,
    goal.isComplete ? 'Yes' : 'No',
    new Date(goal.createdAt).toISOString(),
    goal.completedAt ? new Date(goal.completedAt).toISOString() : '',
    goal.isUltimate ? 'Yes' : 'No',
    goal.isRecurring ? 'Yes' : 'No',
    goal.isPaused ? 'Yes' : 'No',
    goal.isArchived ? 'Yes' : 'No',
    goal.category || '',
    goal.icon || '',
  ]);
  
  return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
}

/**
 * Convert rewards array to CSV format
 */
function rewardsToCSV(rewards: Reward[]): string {
  const headers = [
    'ID',
    'Title',
    'Description',
    'Cost',
    'Icon',
    'Created At',
    'Is Redeemed',
    'Redeemed At',
    'Linked To Goal ID',
  ];
  
  const rows = rewards.map((reward) => [
    reward.id,
    `"${(reward.title || '').replace(/"/g, '""')}"`,
    `"${(reward.description || '').replace(/"/g, '""')}"`,
    reward.pointsCost,
    reward.icon || '',
    new Date(reward.createdAt).toISOString(),
    reward.isRedeemed ? 'Yes' : 'No',
    reward.redeemedAt ? new Date(reward.redeemedAt).toISOString() : '',
    reward.linkedToGoalId || '',
  ]);
  
  return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
}

/**
 * Generate CSV export data
 */
export function generateCSVExport(
  goals: Goal[],
  rewards: Reward[],
  lifetimePointsEarned: number
): string {
  const sections = [
    '=== GOALS ===',
    goalsToCSV(goals),
    '',
    '=== REWARDS ===',
    rewardsToCSV(rewards),
    '',
    `=== STATISTICS ===`,
    `Total Goals,${goals.length}`,
    `Completed Goals,${goals.filter((g) => g.isComplete).length}`,
    `Total Rewards,${rewards.length}`,
    `Redeemed Rewards,${rewards.filter((r) => r.isRedeemed).length}`,
    `Lifetime Points Earned,${lifetimePointsEarned}`,
  ];
  
  return sections.join('\n');
}

/**
 * Share data using the native Share API
 * On mobile, this will trigger the share sheet
 * On web, it will download the file or show share options
 */
export async function shareData(
  data: string,
  title: string
): Promise<void> {
  if (Platform.OS === 'web') {
    // On web, create a download link
    const blob = new Blob([data], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = title;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } else {
    // On mobile, use the Share API
    await Share.share({
      message: data,
      title: title,
    });
  }
}

export interface ImportResult {
  success: boolean;
  message: string;
  data: {
    goals: Goal[];
    rewards: Reward[];
    lifetimePoints: number | null;
  } | null;
  errors: string[];
}

/**
 * Parse and validate JSON import data
 */
export function parseJSONImport(jsonString: string): ImportResult {
  const errors: string[] = [];
  
  try {
    const data = JSON.parse(jsonString);
    
    // Validate structure
    if (!data.goals || !Array.isArray(data.goals)) {
      return {
        success: false,
        message: 'Invalid format: goals array not found',
        data: null,
        errors: ['goals array not found'],
      };
    }
    if (!data.rewards || !Array.isArray(data.rewards)) {
      return {
        success: false,
        message: 'Invalid format: rewards array not found',
        data: null,
        errors: ['rewards array not found'],
      };
    }
    
    // Validate and filter goals
    const validGoals = data.goals.filter((goal: any, index: number) => {
      if (!goal.title || typeof goal.title !== 'string') {
        errors.push(`Goal ${index + 1}: Missing or invalid title`);
        return false;
      }
      if (typeof goal.target !== 'number' || goal.target <= 0) {
        errors.push(`Goal ${index + 1}: Invalid target value`);
        return false;
      }
      if (typeof goal.current !== 'number') {
        errors.push(`Goal ${index + 1}: Invalid current value`);
        return false;
      }
      return true;
    });
    
    // Validate and filter rewards
    const validRewards = data.rewards.filter((reward: any, index: number) => {
      if (!reward.title || typeof reward.title !== 'string') {
        errors.push(`Reward ${index + 1}: Missing or invalid title`);
        return false;
      }
      if (typeof reward.pointsCost !== 'number' || reward.pointsCost <= 0) {
        errors.push(`Reward ${index + 1}: Invalid points cost`);
        return false;
      }
      return true;
    });
    
    return {
      success: true,
      message: `Successfully parsed ${validGoals.length} goals and ${validRewards.length} rewards`,
      data: {
        goals: validGoals as Goal[],
        rewards: validRewards as Reward[],
        lifetimePoints: typeof data.lifetimePoints === 'number' ? data.lifetimePoints : null,
      },
      errors,
    };
  } catch (error) {
    return {
      success: false,
      message: 'Failed to parse JSON file',
      data: null,
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    };
  }
}

/**
 * Parse CSV import data (basic implementation - currently not fully supported)
 */
export function parseCSVImport(csvString: string): ImportResult {
  // CSV import is not fully implemented yet
  return {
    success: false,
    message: 'CSV import is not yet supported. Please use JSON format.',
    data: null,
    errors: ['CSV import not implemented'],
  };
}


