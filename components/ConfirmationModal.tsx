/**
 * ConfirmationModal component
 * Reusable modal for confirmation dialogs
 */

import { useTheme } from '@/src/context/ThemeContext';
import React, { memo } from 'react';
import {
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface ConfirmationModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmStyle?: 'default' | 'destructive';
}

/**
 * Custom confirmation modal component
 */
const ConfirmationModal = memo<ConfirmationModalProps>(({
  visible,
  title,
  message,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
  confirmStyle = 'default',
}) => {
  const { theme } = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
      statusBarTranslucent
    >
      <Pressable 
        style={styles.overlay}
        onPress={onCancel}
        accessibilityLabel="Close modal"
      >
        <Pressable 
          style={[styles.container, { backgroundColor: theme.colors.card }]}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Title */}
          <Text style={[styles.title, { color: theme.colors.text }]}>
            {title}
          </Text>

          {/* Message */}
          <Text style={[styles.message, { color: theme.colors.textSecondary }]}>
            {message}
          </Text>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            {/* Cancel Button */}
            <TouchableOpacity
              style={[
                styles.button,
                styles.cancelButton,
                { borderColor: theme.colors.border }
              ]}
              onPress={onCancel}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={cancelText}
            >
              <Text style={[styles.buttonText, { color: theme.colors.text }]}>
                {cancelText}
              </Text>
            </TouchableOpacity>

            {/* Confirm Button */}
            <TouchableOpacity
              style={[
                styles.button,
                styles.confirmButton,
                {
                  backgroundColor:
                    confirmStyle === 'destructive'
                      ? theme.colors.danger
                      : theme.colors.primary,
                },
              ]}
              onPress={onConfirm}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={confirmText}
            >
              <Text style={[styles.buttonText, styles.confirmButtonText]}>
                {confirmText}
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
});

ConfirmationModal.displayName = 'ConfirmationModal';

export default ConfirmationModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 24,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    borderWidth: 1.5,
  },
  confirmButton: {
    // backgroundColor set dynamically
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButtonText: {
    color: '#FFF',
  },
});
