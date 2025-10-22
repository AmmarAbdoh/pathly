import { useGoals } from "@/src/context/GoalsContext";
import { Picker } from '@react-native-picker/picker';
import { useRouter } from "expo-router";
import { useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";

export default function AddGoal() {
  const { addGoal } = useGoals();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [targetValue, setTargetValue] = useState("");
  const [currentValue, setCurrentValue] = useState("");
  const [unit, setUnit] = useState("");
  const [direction, setDirection] = useState<'increase' | 'decrease'>('increase');

  const handleSave = () => {
    addGoal(title, parseFloat(targetValue), parseFloat(currentValue), unit, direction);
    router.back();
  };

  return (
    <View className="flex-1 bg-gray-50 px-4 pt-10">
      <Text className="text-2xl font-bold mb-6 text-indigo-600">New Goal</Text>

      <Text className="text-gray-600 mb-2">Goal Title</Text>
      <TextInput
        className="bg-white p-3 rounded-xl mb-4 shadow-sm"
        value={title}
        onChangeText={setTitle}
        placeholder="e.g. Lose Weight"
      />

      <Text className="text-gray-600 mb-2">Current Value</Text>
      <TextInput
        className="bg-white p-3 rounded-xl mb-4 shadow-sm"
        value={currentValue}
        onChangeText={setCurrentValue}
        placeholder="e.g. 80"
        keyboardType="numeric"
      />

      <Text className="text-gray-600 mb-2">Target Value</Text>
      <TextInput
        className="bg-white p-3 rounded-xl mb-4 shadow-sm"
        value={targetValue}
        onChangeText={setTargetValue}
        placeholder="e.g. 70"
        keyboardType="numeric"
      />

      <Text className="text-gray-600 mb-2">Unit</Text>
      <TextInput
        className="bg-white p-3 rounded-xl mb-4 shadow-sm"
        value={unit}
        onChangeText={setUnit}
        placeholder="e.g. kg"
      />

      <Text className="text-gray-600 mb-2">Progress Direction</Text>
      <View className="bg-white p-3 rounded-xl mb-6 shadow-sm">
        <Picker
          selectedValue={direction}
          onValueChange={(itemValue: 'increase' | 'decrease') => setDirection(itemValue)}
        >
          <Picker.Item label="Increasing (e.g., Books Read)" value="increase" />
          <Picker.Item label="Decreasing (e.g., Weight Loss)" value="decrease" />
        </Picker>
      </View>

      <TouchableOpacity
        className="bg-indigo-600 py-3 rounded-xl"
        onPress={handleSave}
      >
        <Text className="text-center text-white font-semibold text-lg">
          Save Goal
        </Text>
      </TouchableOpacity>
    </View>
  );
}
