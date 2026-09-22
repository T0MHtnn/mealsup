import { Flame, Gauge, Microwave, Waves, Wind, Zap, GaugeCircle, Droplets, Box, FlameKindling } from 'lucide-react'

export const EQUIPMENT_LIST = [
  { key: 'oven', icon: Flame },
  { key: 'stovetop', icon: Gauge },
  { key: 'microwave', icon: Microwave },
  { key: 'blender', icon: Waves },
  { key: 'airfryer', icon: Wind },
  { key: 'food_processor', icon: Zap },
  { key: 'pressure_cooker', icon: GaugeCircle },
  { key: 'steamer', icon: Droplets },
  { key: 'toaster', icon: Box },
  { key: 'grill', icon: FlameKindling },
] as const

export type EquipmentKey = (typeof EQUIPMENT_LIST)[number]['key']
