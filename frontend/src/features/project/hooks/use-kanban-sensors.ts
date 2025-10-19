import { PointerSensor, useSensor, useSensors, type SensorDescriptor } from '@dnd-kit/core';

export type KanbanSensors = SensorDescriptor<any>[];

export function useKanbanSensors(distance = 6): KanbanSensors {
  return useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance },
    }),
  );
}
