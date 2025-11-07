/**
 * Rewards screen
 * Display and manage redeemable rewards
 */

import ConfirmationModal from '@/components/ConfirmationModal';
import RewardTemplatesModal from '@/components/RewardTemplatesModal';
import { DEFAULT_REWARD_ICON, GOAL_REWARD_ICONS } from '@/src/constants/icons';
import { RewardTemplate } from '@/src/constants/reward-templates';
import { useGoals } from '@/src/context/GoalsContext';
import { useLanguage } from '@/src/context/LanguageContext';
import { useRewards } from '@/src/context/RewardsContext';
import { useTheme } from '@/src/context/ThemeContext';
import { calculateStatistics } from '@/src/utils/statistics';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Alert,
    Modal,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

export default function RewardsScreen() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { goals, lifetimePointsEarned } = useGoals();
  const {
    rewards,
    addReward,
    editReward,
    redeemReward,
    removeReward,
    getAvailableRewards,
    getRedeemedRewards,
  } = useRewards();

  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [editingReward, setEditingReward] = useState<number | null>(null);
  const [confirmRedeemId, setConfirmRedeemId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [pointsCost, setPointsCost] = useState('');
  const [selectedIcon, setSelectedIcon] = useState(DEFAULT_REWARD_ICON);

  // Calculate statistics
  const stats = calculateStatistics(goals, rewards, lifetimePointsEarned);
  const availablePoints = stats.lifetimePointsEarned - stats.spentPoints;
  const availableRewards = getAvailableRewards();
  const redeemedRewards = getRedeemedRewards();

  const onRefresh = async () => {
    setRefreshing(true);
    // Refresh would happen automatically through context
    setTimeout(() => setRefreshing(false), 1000);
  };

  const openAddModal = () => {
    setEditingReward(null);
    setTitle('');
    setDescription('');
    setPointsCost('');
    setSelectedIcon(DEFAULT_REWARD_ICON);
    setShowAddModal(true);
  };

  const handleSelectTemplate = (template: RewardTemplate) => {
    setTitle(template.title);
    setDescription(template.description);
    setPointsCost(template.pointsCost.toString());
    setSelectedIcon(template.icon);
    setShowTemplates(false);
    setShowAddModal(true);
  };

  const openEditModal = (reward: any) => {
    setEditingReward(reward.id);
    setTitle(reward.title);
    setDescription(reward.description);
    setPointsCost(reward.pointsCost.toString());
    setSelectedIcon(reward.icon);
    setShowAddModal(true);
  };

  const closeModal = () => {
    setShowAddModal(false);
    setEditingReward(null);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a reward title');
      return;
    }

    const cost = parseInt(pointsCost);
    if (isNaN(cost) || cost < 1) {
      Alert.alert('Invalid Points', 'Reward must cost at least 1 point');
      return;
    }

    try {
      if (editingReward) {
        await editReward(editingReward, title, description, cost, selectedIcon);
      } else {
        await addReward(title, description, cost, selectedIcon);
      }
      closeModal();
    } catch (error) {
      Alert.alert('Error', 'Failed to save reward');
    }
  };

  const handleRedeem = async (rewardId: number, pointsCost: number) => {
    if (availablePoints < pointsCost) {
      Alert.alert('Not Enough Points', `You need ${pointsCost - availablePoints} more points to redeem this reward.`);
      return;
    }
    setConfirmRedeemId(rewardId);
  };

  const confirmRedeem = async () => {
    if (confirmRedeemId) {
      try {
        await redeemReward(confirmRedeemId);
        Alert.alert('Success! 🎉', 'Reward redeemed! Enjoy your treat!');
      } catch (error) {
        Alert.alert('Error', 'Failed to redeem reward');
      }
      setConfirmRedeemId(null);
    }
  };

  const handleDelete = async () => {
    if (confirmDeleteId) {
      try {
        await removeReward(confirmDeleteId);
      } catch (error) {
        Alert.alert('Error', 'Failed to delete reward');
      }
      setConfirmDeleteId(null);
    }
  };

  const selectIcon = (icon: string) => {
    setSelectedIcon(icon);
    setShowIconPicker(false);
  };

  const renderRewardCard = ({ item }: { item: any }) => {
    const canAfford = availablePoints >= item.pointsCost;
    const isRedeemed = item.isRedeemed;

    return (
      <View style={[styles.rewardCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
        <View style={styles.rewardHeader}>
          <Text style={styles.rewardIcon}>{item.icon}</Text>
          <View style={styles.rewardInfo}>
            <Text style={[styles.rewardTitle, { color: theme.colors.text }]}>{item.title}</Text>
            {item.description ? (
              <Text style={[styles.rewardDescription, { color: theme.colors.textSecondary }]}>
                {item.description}
              </Text>
            ) : null}
          </View>
        </View>

        <View style={styles.rewardFooter}>
          <View style={[styles.pointsBadge, { backgroundColor: isRedeemed ? '#10b981' : canAfford ? theme.colors.primary : '#94a3b8' }]}>
            <Ionicons name="star" size={16} color="#fff" />
            <Text style={styles.pointsText}>{item.pointsCost}</Text>
          </View>

          {isRedeemed ? (
            <View style={styles.redeemedBadge}>
              <Ionicons name="checkmark-circle" size={20} color="#10b981" />
              <Text style={styles.redeemedText}>{t.rewards.redeemed}</Text>
            </View>
          ) : (
            <View style={styles.rewardActions}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: theme.colors.primary + '20' }]}
                onPress={() => openEditModal(item)}
              >
                <Ionicons name="create-outline" size={20} color={theme.colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: '#ef444420' }]}
                onPress={() => setConfirmDeleteId(item.id)}
              >
                <Ionicons name="trash-outline" size={20} color="#ef4444" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.redeemButton,
                  {
                    backgroundColor: canAfford ? '#10b981' : '#94a3b8',
                  },
                ]}
                onPress={() => handleRedeem(item.id, item.pointsCost)}
                disabled={!canAfford}
              >
                <Text style={styles.redeemButtonText}>{t.rewards.redeem}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.card, borderBottomColor: theme.colors.border }]}>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>{t.rewards.title}</Text>
        <View style={[styles.pointsDisplay, { backgroundColor: theme.colors.primary }]}>
          <Ionicons name="star" size={20} color="#fff" />
          <Text style={styles.pointsDisplayText}>{availablePoints}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Templates Button */}
        <TouchableOpacity
          style={[styles.templatesButton, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
          onPress={() => setShowTemplates(true)}
          activeOpacity={0.7}
        >
          <Ionicons name="albums-outline" size={24} color={theme.colors.primary} />
          <View style={styles.templatesButtonText}>
            <Text style={[styles.templatesButtonTitle, { color: theme.colors.text }]}>
              {t.rewards.useTemplate}
            </Text>
            <Text style={[styles.templatesButtonSubtitle, { color: theme.colors.textSecondary }]}>
              {t.rewards.quickRewards}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
        </TouchableOpacity>

        {/* Points Info Card */}
        <View style={[styles.infoCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>{t.rewards.totalEarned}</Text>
            <Text style={[styles.infoValue, { color: '#f59e0b' }]}>{stats.totalPoints}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>{t.rewards.spent}</Text>
            <Text style={[styles.infoValue, { color: '#ef4444' }]}>{stats.spentPoints}</Text>
          </View>
          <View style={[styles.infoRow, styles.infoRowBorder, { borderTopColor: theme.colors.border }]}>
            <Text style={[styles.infoLabel, { color: theme.colors.text, fontWeight: '700' }]}>{t.rewards.available}</Text>
            <Text style={[styles.infoValue, { color: '#10b981', fontWeight: '700' }]}>{availablePoints}</Text>
          </View>
        </View>

        {/* Available Rewards */}
        {availableRewards.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{t.rewards.availableRewards}</Text>
            {availableRewards.map((reward) => (
              <View key={reward.id}>{renderRewardCard({ item: reward })}</View>
            ))}
          </>
        )}

        {/* Redeemed Rewards */}
        {redeemedRewards.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{t.rewards.redeemedRewards}</Text>
            {redeemedRewards.map((reward) => (
              <View key={reward.id}>{renderRewardCard({ item: reward })}</View>
            ))}
          </>
        )}

        {/* Empty State */}
        {rewards.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🎁</Text>
            <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>{t.rewards.noRewards}</Text>
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              {t.rewards.createRewards}
            </Text>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Floating Add Button */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={openAddModal}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Add/Edit Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                {editingReward ? t.rewards.editReward : t.rewards.createReward}
              </Text>
              <TouchableOpacity onPress={closeModal}>
                <Ionicons name="close" size={24} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Icon Picker */}
              <Text style={[styles.label, { color: theme.colors.text }]}>{t.rewards.icon}</Text>
              <TouchableOpacity
                style={[styles.iconButton, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}
                onPress={() => setShowIconPicker(true)}
              >
                <Text style={styles.selectedIcon}>{selectedIcon}</Text>
              </TouchableOpacity>

              {/* Title */}
              <Text style={[styles.label, { color: theme.colors.text }]}>{t.rewards.rewardTitle} *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.colors.background, color: theme.colors.text, borderColor: theme.colors.border }]}
                value={title}
                onChangeText={setTitle}
                placeholder={t.rewards.rewardTitle}
                placeholderTextColor={theme.colors.textSecondary}
              />

              {/* Description */}
              <Text style={[styles.label, { color: theme.colors.text }]}>{t.rewards.description}</Text>
              <TextInput
                style={[styles.input, styles.textArea, { backgroundColor: theme.colors.background, color: theme.colors.text, borderColor: theme.colors.border }]}
                value={description}
                onChangeText={setDescription}
                placeholder={t.rewards.descriptionOptional}
                placeholderTextColor={theme.colors.textSecondary}
                multiline
                numberOfLines={3}
              />

              {/* Points Cost */}
              <Text style={[styles.label, { color: theme.colors.text }]}>{t.rewards.pointsCost} *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.colors.background, color: theme.colors.text, borderColor: theme.colors.border }]}
                value={pointsCost}
                onChangeText={setPointsCost}
                placeholder={t.rewards.pointsCost}
                placeholderTextColor={theme.colors.textSecondary}
                keyboardType="numeric"
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton, { borderColor: theme.colors.border }]}
                onPress={closeModal}
              >
                <Text style={[styles.cancelButtonText, { color: theme.colors.text }]}>{t.common.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton, { backgroundColor: theme.colors.primary }]}
                onPress={handleSave}
              >
                <Text style={styles.saveButtonText}>{editingReward ? t.common.save : t.common.add}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Icon Picker Modal */}
      <Modal visible={showIconPicker} animationType="fade" transparent>
        <Pressable style={styles.modalOverlay} onPress={() => setShowIconPicker(false)}>
          <Pressable style={[styles.iconPickerContent, { backgroundColor: theme.colors.card }]} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>{t.rewards.icon}</Text>
              <TouchableOpacity onPress={() => setShowIconPicker(false)}>
                <Ionicons name="close" size={24} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView 
              style={styles.iconScrollView}
              removeClippedSubviews={true}
            >
              <View style={styles.iconGrid}>
                {GOAL_REWARD_ICONS.map((icon, index) => (
                  <TouchableOpacity
                    key={`icon-${index}-${icon}`}
                    style={[
                      styles.iconOption,
                      { backgroundColor: theme.colors.background },
                      selectedIcon === icon && { backgroundColor: theme.colors.primary + '20', borderColor: theme.colors.primary },
                    ]}
                    onPress={() => selectIcon(icon)}
                  >
                    <Text style={styles.iconOptionText}>{icon}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Confirmation Modals */}
      <ConfirmationModal
        visible={confirmRedeemId !== null}
        title={t.rewards.redeemConfirm}
        message={t.rewards.redeemConfirmMessage}
        confirmText={t.rewards.redeem}
        cancelText={t.common.cancel}
        onConfirm={confirmRedeem}
        onCancel={() => setConfirmRedeemId(null)}
      />

      <ConfirmationModal
        visible={confirmDeleteId !== null}
        title={t.rewards.deleteReward}
        message={t.rewards.deleteConfirm}
        confirmText={t.common.delete}
        cancelText={t.common.cancel}
        confirmStyle="destructive"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDeleteId(null)}
      />

      {/* Reward Templates Modal */}
      <RewardTemplatesModal
        visible={showTemplates}
        onClose={() => setShowTemplates(false)}
        onSelectTemplate={handleSelectTemplate}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 60,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
  },
  pointsDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  pointsDisplayText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  infoCard: {
    margin: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoRowBorder: {
    borderTopWidth: 1,
    marginTop: 8,
    paddingTop: 16,
  },
  infoLabel: {
    fontSize: 16,
  },
  infoValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginHorizontal: 20,
    marginBottom: 12,
    marginTop: 8,
  },
  rewardCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  rewardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  rewardIcon: {
    fontSize: 48,
    marginRight: 16,
  },
  rewardInfo: {
    flex: 1,
  },
  rewardTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  rewardDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  rewardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  pointsText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  rewardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  redeemButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 18,
  },
  redeemButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  redeemedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  redeemedText: {
    color: '#10b981',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 80,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  modalBody: {
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  iconButton: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  selectedIcon: {
    fontSize: 48,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {},
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  iconPickerContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
  },
  iconScrollView: {
    maxHeight: 400,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 20,
    justifyContent: 'space-evenly',
  },
  iconOption: {
    width: '18%',
    aspectRatio: 1,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    marginBottom: 12,
  },
  iconOptionText: {
    fontSize: 32,
  },
  searchInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    fontSize: 15,
  },
  templatesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 8,
    gap: 12,
    borderWidth: 1,
  },
  templatesButtonText: {
    flex: 1,
  },
  templatesButtonTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  templatesButtonSubtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
});
