/**
 * UI component type definitions.
 */

/**
 * Common props for all components
 */
export interface BaseComponentProps {
  className?: string;
  id?: string;
  testId?: string; // For testing purposes
}

/**
 * Button variants
 */
export type ButtonVariant = 
  | 'primary'
  | 'secondary'
  | 'success'
  | 'danger'
  | 'warning'
  | 'info'
  | 'link'
  | 'outline-primary'
  | 'outline-secondary'
  | 'outline-success'
  | 'outline-danger'
  | 'outline-warning'
  | 'outline-info';

/**
 * Button sizes
 */
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/**
 * Button component props
 */
export interface ButtonProps extends BaseComponentProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  type?: 'button' | 'submit' | 'reset';
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  children: React.ReactNode;
}

/**
 * Form field component props
 */
export interface FormFieldProps extends BaseComponentProps {
  label?: string;
  name: string;
  error?: string;
  required?: boolean;
  helperText?: string;
  children: React.ReactNode;
}

/**
 * Input component props
 */
export interface InputProps extends BaseComponentProps {
  name: string;
  type?: string;
  value?: string | number;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  autoComplete?: string;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
  error?: string;
  min?: number;
  max?: number;
  step?: number;
  pattern?: string;
} 