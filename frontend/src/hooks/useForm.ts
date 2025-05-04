import { useState, ChangeEvent, FormEvent } from 'react';

type ValidationRules<T> = {
  [K in keyof T]?: Array<{
    validator: (value: T[K], formValues: T) => boolean;
    message: string;
  }>;
};

type FormErrors<T> = {
  [K in keyof T]?: string[];
};

interface UseFormResult<T> {
  values: T;
  errors: FormErrors<T>;
  touched: Partial<Record<keyof T, boolean>>;
  isValid: boolean;
  isDirty: boolean;
  handleChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  handleBlur: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  handleSubmit: (onSubmit: (values: T, e: FormEvent) => void) => (e: FormEvent) => void;
  setFieldValue: (field: keyof T, value: any) => void;
  resetForm: () => void;
  validateField: (field: keyof T) => void;
  validateForm: () => boolean;
}

/**
 * Custom hook for managing form state and validation.
 * 
 * @param initialValues Initial form values
 * @param validationRules Rules for form validation
 * @returns Object with form state and handlers
 */
export function useForm<T extends Record<string, any>>(
  initialValues: T,
  validationRules?: ValidationRules<T>
): UseFormResult<T> {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<FormErrors<T>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
  const [isDirty, setIsDirty] = useState(false);

  // Validate a single field
  const validateField = (field: keyof T) => {
    if (!validationRules || !validationRules[field]) {
      return;
    }

    const fieldErrors: string[] = [];
    const rules = validationRules[field] || [];

    for (const rule of rules) {
      const isValid = rule.validator(values[field], values);
      if (!isValid) {
        fieldErrors.push(rule.message);
      }
    }

    setErrors(prev => ({
      ...prev,
      [field]: fieldErrors.length > 0 ? fieldErrors : undefined
    }));
  };

  // Validate the entire form
  const validateForm = () => {
    if (!validationRules) {
      return true;
    }

    const newErrors: FormErrors<T> = {};
    let isValid = true;

    // Validate each field with rules
    for (const field in validationRules) {
      const rules = validationRules[field as keyof T] || [];
      const fieldErrors: string[] = [];

      for (const rule of rules) {
        const isFieldValid = rule.validator(values[field as keyof T], values);
        if (!isFieldValid) {
          fieldErrors.push(rule.message);
          isValid = false;
        }
      }

      if (fieldErrors.length > 0) {
        newErrors[field as keyof T] = fieldErrors;
      }
    }

    setErrors(newErrors);
    return isValid;
  };

  // Handle input changes
  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    // Handle checkbox inputs specially
    const newValue = type === 'checkbox' 
      ? (e.target as HTMLInputElement).checked 
      : value;
    
    setValues(prev => ({
      ...prev,
      [name]: newValue
    }));
    
    setIsDirty(true);
    
    // Mark as touched
    if (!touched[name as keyof T]) {
      setTouched(prev => ({
        ...prev,
        [name]: true
      }));
    }
  };

  // Handle input blur for validation
  const handleBlur = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name } = e.target;
    
    // Mark as touched
    setTouched(prev => ({
      ...prev,
      [name]: true
    }));
    
    // Validate the field
    validateField(name as keyof T);
  };

  // Set a field value programmatically
  const setFieldValue = (field: keyof T, value: any) => {
    setValues(prev => ({
      ...prev,
      [field]: value
    }));
    
    setIsDirty(true);
    
    // Mark as touched if not already
    if (!touched[field]) {
      setTouched(prev => ({
        ...prev,
        [field]: true
      }));
      
      // Validate the field
      validateField(field);
    }
  };

  // Reset the form to initial values
  const resetForm = () => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsDirty(false);
  };

  // Handle form submission
  const handleSubmit = (onSubmit: (values: T, e: FormEvent) => void) => (e: FormEvent) => {
    e.preventDefault();
    
    // Mark all fields as touched
    const allTouched = Object.keys(values).reduce(
      (acc, key) => ({ ...acc, [key]: true }),
      {} as Record<keyof T, boolean>
    );
    
    setTouched(allTouched);
    
    // Validate all fields
    const isValid = validateForm();
    
    // If valid, call the onSubmit callback
    if (isValid) {
      onSubmit(values, e);
    }
  };

  // Check if the form is valid
  const isValid = Object.keys(errors).length === 0;

  return {
    values,
    errors,
    touched,
    isValid,
    isDirty,
    handleChange,
    handleBlur,
    handleSubmit,
    setFieldValue,
    resetForm,
    validateField,
    validateForm
  };
} 