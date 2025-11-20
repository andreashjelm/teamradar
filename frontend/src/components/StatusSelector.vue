<template>
  <div class="space-y-2">
    <label class="block text-sm font-medium text-gray-700 mb-2">
      Presence Status
    </label>
    <select
      :value="modelValue"
      @change="$emit('update:modelValue', $event.target.value)"
      class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
    >
      <option value="available">Available</option>
      <option value="home">Working from Home</option>
      <option value="office">In Office</option>
      <option value="meeting">In Meeting</option>
      <option value="sick">Sick</option>
      <option value="vacation">On Vacation</option>
    </select>
  </div>
</template>

<script setup>
defineProps({
  modelValue: {
    type: String,
    required: true
  }
});

defineEmits(['update:modelValue']);
</script>

