/**
 * Utility Types for Component Props and State
 * Reusable type utilities for better component design
 */

import React from 'react';
import { BusinessCategory, AnalysisMode, LatLng, MapBounds } from './enhanced';

// Component base types
export type BaseComponentProps = {
  className?: string;
  id?: string;
  'data-testid'?: string;
};

export type ComponentWithChildren<T = {}> = T & {
  children?: React.ReactNode;
};

export type ComponentWithOptionalChildren<T = {}> = T & {
  children?: React.ReactNode;
};

// Event handler types
export type ClickHandler = (event: React.MouseEvent) => void;
export type ChangeHandler<T = string> = (value: T) => void;
export type SubmitHandler = (event: React.FormEvent) => void;
export type KeyboardHandler = (event: React.KeyboardEvent) => void;
export type FocusHandler = (event: React.FocusEvent) => void;

export type AsyncClickHandler = (event: React.MouseEvent) => Promise<void>;
export type AsyncChangeHandler<T = string> = (value: T) => Promise<void>;
export type AsyncSubmitHandler = (event: React.FormEvent) => Promise<void>;

// Form-related types
export type FormFieldProps<T = string> = {
  value: T;
  onChange: ChangeHandler<T>;
  onBlur?: FocusHandler;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
  'aria-label'?: string;
  'aria-describedby'?: string;
};

export type SelectOption<T = string> = {
  value: T;
  label: string;
  disabled?: boolean;
  icon?: string;
  description?: string;
};

export type SelectProps<T = string> = FormFieldProps<T> & {
  options: SelectOption<T>[];
  multiple?: boolean;
  searchable?: boolean;
  clearable?: boolean;
  loading?: boolean;
};

// Button types
export type ButtonVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'ghost' | 'link';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export type ButtonProps = BaseComponentProps & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  onClick?: ClickHandler | AsyncClickHandler;
  type?: 'button' | 'submit' | 'reset';
  children: React.ReactNode;
};

// Modal and dialog types
export type ModalProps = BaseComponentProps & {
  open: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closable?: boolean;
  maskClosable?: boolean;
  children: React.ReactNode;
};

export type DialogProps = ModalProps & {
  type?: 'info' | 'success' | 'warning' | 'error' | 'confirm';
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
  confirmLoading?: boolean;
};

// Loading and skeleton types
export type LoadingProps = BaseComponentProps & {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  overlay?: boolean;
  spinning?: boolean;
  children?: React.ReactNode;
};

export type SkeletonProps = BaseComponentProps & {
  width?: string | number;
  height?: string | number;
  variant?: 'text' | 'rectangular' | 'circular';
  animation?: 'pulse' | 'wave' | false;
  lines?: number;
};

// Table types
export type TableColumn<T = any> = {
  key: string;
  title: string;
  dataIndex?: keyof T;
  width?: string | number;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  filterable?: boolean;
  render?: (value: any, record: T, index: number) => React.ReactNode;
  sorter?: (a: T, b: T) => number;
  filters?: Array<{ text: string; value: any }>;
};

export type TableProps<T = any> = BaseComponentProps & {
  columns: TableColumn<T>[];
  data: T[];
  loading?: boolean;
  pagination?: {
    current: number;
    pageSize: number;
    total: number;
    onChange: (page: number, pageSize: number) => void;
  };
  rowKey?: keyof T | ((record: T) => string);
  onRow?: (record: T, index: number) => React.HTMLAttributes<HTMLTableRowElement>;
  scroll?: { x?: number; y?: number };
  size?: 'sm' | 'md' | 'lg';
};

// Card types
export type CardProps = BaseComponentProps & ComponentWithChildren<{
  title?: React.ReactNode;
  extra?: React.ReactNode;
  cover?: React.ReactNode;
  actions?: React.ReactNode[];
  hoverable?: boolean;
  loading?: boolean;
  bordered?: boolean;
  size?: 'sm' | 'md' | 'lg';
}>;

// Tabs types
export type TabItem = {
  key: string;
  label: React.ReactNode;
  children: React.ReactNode;
  disabled?: boolean;
  closable?: boolean;
  icon?: React.ReactNode;
};

export type TabsProps = BaseComponentProps & {
  items: TabItem[];
  activeKey?: string;
  defaultActiveKey?: string;
  onChange?: (key: string) => void;
  onEdit?: (targetKey: string, action: 'add' | 'remove') => void;
  type?: 'line' | 'card' | 'editable-card';
  size?: 'sm' | 'md' | 'lg';
  position?: 'top' | 'right' | 'bottom' | 'left';
};

// Notification types
export type NotificationType = 'success' | 'info' | 'warning' | 'error';

export type NotificationProps = {
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number;
  closable?: boolean;
  onClose?: () => void;
  action?: React.ReactNode;
  icon?: React.ReactNode;
};

// Tooltip types
export type TooltipProps = BaseComponentProps & {
  title: React.ReactNode;
  placement?: 'top' | 'right' | 'bottom' | 'left';
  trigger?: 'hover' | 'focus' | 'click' | 'manual';
  visible?: boolean;
  onVisibleChange?: (visible: boolean) => void;
  children: React.ReactElement;
};

// Popover types
export type PopoverProps = TooltipProps & {
  content: React.ReactNode;
  width?: string | number;
};

// Drawer types
export type DrawerProps = BaseComponentProps & {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  placement?: 'top' | 'right' | 'bottom' | 'left';
  size?: string | number;
  mask?: boolean;
  maskClosable?: boolean;
  closable?: boolean;
  extra?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
};

// Location-specific component types
export type LocationSelectorProps = BaseComponentProps & {
  value?: LatLng;
  onChange: (location: LatLng) => void;
  bounds?: MapBounds;
  disabled?: boolean;
  placeholder?: string;
  showCoordinates?: boolean;
  allowManualInput?: boolean;
};

export type CategorySelectorProps = BaseComponentProps & {
  value: BusinessCategory;
  onChange: (category: BusinessCategory) => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'select' | 'buttons' | 'cards';
  showIcons?: boolean;
  showDescriptions?: boolean;
};

export type AnalysisModeSelectorProps = BaseComponentProps & {
  value: AnalysisMode;
  onChange: (mode: AnalysisMode) => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'tabs' | 'buttons' | 'segmented';
  showIcons?: boolean;
  showDescriptions?: boolean;
};

export type ScoreDisplayProps = BaseComponentProps & {
  score: number;
  maxScore?: number;
  category?: string;
  color?: string;
  emoji?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'circular' | 'linear' | 'badge';
  showLabel?: boolean;
  animated?: boolean;
};

export type MapProps = BaseComponentProps & {
  center?: LatLng;
  zoom?: number;
  bounds?: MapBounds;
  markers?: Array<{
    id: string;
    position: LatLng;
    title?: string;
    icon?: string;
    onClick?: () => void;
  }>;
  heatmapData?: Array<[number, number, number]>;
  onMapClick?: (position: LatLng) => void;
  onBoundsChange?: (bounds: MapBounds) => void;
  onZoomChange?: (zoom: number) => void;
  interactive?: boolean;
  showControls?: boolean;
  showScale?: boolean;
  height?: string | number;
};

// Analysis result display types
export type AnalysisResultProps = BaseComponentProps & {
  data: any;
  loading?: boolean;
  error?: string;
  onRefresh?: () => void;
  onExport?: () => void;
  showMetrics?: boolean;
  showRecommendations?: boolean;
  compact?: boolean;
};

export type ScoreBreakdownProps = BaseComponentProps & {
  breakdown: Record<string, number | { score: number; distance?: number; count?: number }>;
  maxScore?: number;
  showDetails?: boolean;
  sortBy?: 'score' | 'name' | 'distance';
  sortOrder?: 'asc' | 'desc';
};

// Filter and search types
export type FilterOption<T = any> = {
  key: string;
  label: string;
  type: 'select' | 'range' | 'date' | 'boolean' | 'text';
  options?: SelectOption<T>[];
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
};

export type FilterProps<T = any> = BaseComponentProps & {
  filters: FilterOption<T>[];
  values: Record<string, any>;
  onChange: (values: Record<string, any>) => void;
  onReset?: () => void;
  layout?: 'horizontal' | 'vertical' | 'inline';
  collapsible?: boolean;
  defaultCollapsed?: boolean;
};

export type SearchProps = BaseComponentProps & {
  value: string;
  onChange: (value: string) => void;
  onSearch?: (value: string) => void;
  placeholder?: string;
  loading?: boolean;
  disabled?: boolean;
  allowClear?: boolean;
  size?: 'sm' | 'md' | 'lg';
  suggestions?: string[];
  onSuggestionSelect?: (suggestion: string) => void;
};

// Layout types
export type LayoutProps = BaseComponentProps & ComponentWithChildren<{
  header?: React.ReactNode;
  sidebar?: React.ReactNode;
  footer?: React.ReactNode;
  sidebarWidth?: string | number;
  sidebarCollapsed?: boolean;
  onSidebarToggle?: () => void;
}>;

export type GridProps = BaseComponentProps & ComponentWithChildren<{
  columns?: number | { xs?: number; sm?: number; md?: number; lg?: number; xl?: number };
  gap?: string | number;
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
}>;

export type FlexProps = BaseComponentProps & ComponentWithChildren<{
  direction?: 'row' | 'column';
  wrap?: boolean;
  align?: 'start' | 'center' | 'end' | 'stretch' | 'baseline';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  gap?: string | number;
}>;

// Theme and styling utility types
export type ResponsiveValue<T> = T | { xs?: T; sm?: T; md?: T; lg?: T; xl?: T };

export type SpacingValue = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12 | 16 | 20 | 24 | 32;

export type ColorValue = string | { 
  50?: string; 
  100?: string; 
  200?: string; 
  300?: string; 
  400?: string; 
  500?: string; 
  600?: string; 
  700?: string; 
  800?: string; 
  900?: string; 
};

// Animation and transition types
export type AnimationProps = {
  duration?: number;
  delay?: number;
  easing?: string;
  fillMode?: 'none' | 'forwards' | 'backwards' | 'both';
  iterationCount?: number | 'infinite';
  direction?: 'normal' | 'reverse' | 'alternate' | 'alternate-reverse';
};

export type TransitionProps = {
  property?: string;
  duration?: number;
  delay?: number;
  easing?: string;
};

// Accessibility utility types
export type AriaProps = {
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  'aria-expanded'?: boolean;
  'aria-hidden'?: boolean;
  'aria-disabled'?: boolean;
  'aria-pressed'?: boolean;
  'aria-selected'?: boolean;
  'aria-checked'?: boolean;
  'aria-current'?: boolean | 'page' | 'step' | 'location' | 'date' | 'time';
  'aria-live'?: 'off' | 'assertive' | 'polite';
  'aria-atomic'?: boolean;
  'aria-busy'?: boolean;
  'aria-controls'?: string;
  'aria-owns'?: string;
  role?: string;
  tabIndex?: number;
};

// Data attribute types
export type DataAttributes = {
  [key: `data-${string}`]: string | number | boolean;
};

// Combined prop types for common patterns
export type InteractiveProps = AriaProps & {
  disabled?: boolean;
  loading?: boolean;
  onClick?: ClickHandler | AsyncClickHandler;
  onKeyDown?: KeyboardHandler;
  onFocus?: FocusHandler;
  onBlur?: FocusHandler;
};

export type FormElementProps<T = string> = AriaProps & {
  name?: string;
  value: T;
  onChange: ChangeHandler<T>;
  onBlur?: FocusHandler;
  disabled?: boolean;
  required?: boolean;
  readOnly?: boolean;
  error?: string;
  helperText?: string;
};

// Higher-order component types
export type WithLoadingProps<T = {}> = T & {
  loading?: boolean;
  loadingComponent?: React.ComponentType;
};

export type WithErrorProps<T = {}> = T & {
  error?: Error | string;
  errorComponent?: React.ComponentType<{ error: Error | string }>;
  onRetry?: () => void;
};

export type WithDataProps<T, D = any> = T & {
  data?: D;
  loading?: boolean;
  error?: Error | string;
  onRefresh?: () => void;
};

// Render prop types
export type RenderProp<T> = (props: T) => React.ReactNode;
export type ChildrenRenderProp<T> = { children: RenderProp<T> };

// Ref types
export type ForwardedRef<T> = React.Ref<T>;
export type RefCallback<T> = (instance: T | null) => void;
export type MutableRef<T> = React.MutableRefObject<T>;

// Generic component factory types
export type ComponentFactory<P = {}> = (props: P) => React.ReactElement;
export type ComponentWithProps<P = {}> = React.ComponentType<P>;

// Polymorphic component types
export type AsProp<C extends React.ElementType> = {
  as?: C;
};

export type PropsToOmit<C extends React.ElementType, P> = keyof (AsProp<C> & P);

export type PolymorphicComponentProp<C extends React.ElementType, Props = {}> = 
  React.PropsWithChildren<Props & AsProp<C>> &
  Omit<React.ComponentPropsWithoutRef<C>, PropsToOmit<C, Props>>;

export type PolymorphicRef<C extends React.ElementType> = React.ComponentPropsWithRef<C>['ref'];