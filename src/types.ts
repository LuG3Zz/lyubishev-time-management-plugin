// types.ts
export interface PluginSettings {
    colorPresets: string[];
    activityCategories: string[];
  }
  
  export interface CellColor {
    color: string;
    activity: string;
    category?: string;
  }
  
  export interface DayData {
    date: string;
    weekday: string;
    hours: CellColor[];
  }
  
  export interface CellColors {
    [date: string]: DayData;
  }