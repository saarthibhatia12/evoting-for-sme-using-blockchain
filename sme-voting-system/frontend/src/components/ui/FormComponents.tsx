// =============================================================================
// FORM COMPONENTS - Task 4.7
// Reusable form inputs with validation
// =============================================================================

import React, { useState, useId } from 'react';

// Validation rules
export interface ValidationRule {
  type: 'required' | 'email' | 'minLength' | 'maxLength' | 'pattern' | 'custom';
  value?: number | string | RegExp;
  message: string;
  validator?: (value: string) => boolean;
}

export interface FieldError {
  message: string;
}

// Validate a value against rules
export const validateField = (value: string, rules: ValidationRule[]): string | null => {
  for (const rule of rules) {
    switch (rule.type) {
      case 'required':
        if (!value || value.trim() === '') {
          return rule.message;
        }
        break;
      case 'email':
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          return rule.message;
        }
        break;
      case 'minLength':
        if (value && value.length < (rule.value as number)) {
          return rule.message;
        }
        break;
      case 'maxLength':
        if (value && value.length > (rule.value as number)) {
          return rule.message;
        }
        break;
      case 'pattern':
        if (value && !(rule.value as RegExp).test(value)) {
          return rule.message;
        }
        break;
      case 'custom':
        if (rule.validator && !rule.validator(value)) {
          return rule.message;
        }
        break;
    }
  }
  return null;
};

// Common validation patterns
export const validationPatterns = {
  walletAddress: /^0x[a-fA-F0-9]{40}$/,
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  numeric: /^[0-9]+$/,
  alphanumeric: /^[a-zA-Z0-9]+$/,
};

// ============================================================================
// FORM INPUT COMPONENT
// ============================================================================

interface FormInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  error?: string | null;
  helperText?: string;
  rules?: ValidationRule[];
  showCharCount?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const FormInput: React.FC<FormInputProps> = ({
  label,
  name,
  value,
  onChange,
  error,
  helperText,
  rules = [],
  showCharCount = false,
  leftIcon,
  rightIcon,
  maxLength,
  required,
  disabled,
  className = '',
  ...props
}) => {
  const id = useId();
  const [touched, setTouched] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const displayError = error || (touched ? localError : null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    
    if (touched && rules.length > 0) {
      setLocalError(validateField(newValue, rules));
    }
  };

  const handleBlur = () => {
    setTouched(true);
    if (rules.length > 0) {
      setLocalError(validateField(value, rules));
    }
  };

  return (
    <div className={`form-field ${displayError ? 'has-error' : ''} ${disabled ? 'disabled' : ''} ${className}`}>
      <label htmlFor={id} className="form-label">
        {label}
        {required && <span className="required-star">*</span>}
      </label>
      
      <div className="input-wrapper">
        {leftIcon && <span className="input-icon left">{leftIcon}</span>}
        <input
          id={id}
          name={name}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          maxLength={maxLength}
          disabled={disabled}
          className={`form-input ${leftIcon ? 'has-left-icon' : ''} ${rightIcon ? 'has-right-icon' : ''}`}
          aria-invalid={!!displayError}
          aria-describedby={displayError ? `${id}-error` : helperText ? `${id}-helper` : undefined}
          {...props}
        />
        {rightIcon && <span className="input-icon right">{rightIcon}</span>}
      </div>

      <div className="form-field-footer">
        {displayError ? (
          <span id={`${id}-error`} className="field-error" role="alert">
            {displayError}
          </span>
        ) : helperText ? (
          <span id={`${id}-helper`} className="helper-text">
            {helperText}
          </span>
        ) : null}
        
        {showCharCount && maxLength && (
          <span className="char-count">
            {value.length}/{maxLength}
          </span>
        )}
      </div>

      <style>{`
        .form-field {
          margin-bottom: 1.25rem;
        }

        .form-field.disabled {
          opacity: 0.6;
        }

        .form-label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 500;
          font-size: 0.9rem;
          color: #374151;
        }

        .required-star {
          color: #ef4444;
          margin-left: 0.25rem;
        }

        .input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .input-icon {
          position: absolute;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 2.5rem;
          color: #9ca3af;
          pointer-events: none;
        }

        .input-icon.left {
          left: 0;
        }

        .input-icon.right {
          right: 0;
        }

        .form-input {
          width: 100%;
          padding: 0.75rem 1rem;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 1rem;
          transition: border-color 0.2s, box-shadow 0.2s;
          background: white;
        }

        .form-input.has-left-icon {
          padding-left: 2.5rem;
        }

        .form-input.has-right-icon {
          padding-right: 2.5rem;
        }

        .form-input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .form-input:disabled {
          background: #f3f4f6;
          cursor: not-allowed;
        }

        .form-field.has-error .form-input {
          border-color: #ef4444;
        }

        .form-field.has-error .form-input:focus {
          box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
        }

        .form-field-footer {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-top: 0.375rem;
          min-height: 1.25rem;
        }

        .field-error {
          color: #ef4444;
          font-size: 0.85rem;
        }

        .helper-text {
          color: #6b7280;
          font-size: 0.85rem;
        }

        .char-count {
          color: #9ca3af;
          font-size: 0.8rem;
          margin-left: auto;
        }
      `}</style>
    </div>
  );
};

// ============================================================================
// FORM TEXTAREA COMPONENT
// ============================================================================

interface FormTextareaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange'> {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  error?: string | null;
  helperText?: string;
  rules?: ValidationRule[];
  showCharCount?: boolean;
}

export const FormTextarea: React.FC<FormTextareaProps> = ({
  label,
  name,
  value,
  onChange,
  error,
  helperText,
  rules = [],
  showCharCount = false,
  maxLength,
  required,
  disabled,
  rows = 4,
  className = '',
  ...props
}) => {
  const id = useId();
  const [touched, setTouched] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const displayError = error || (touched ? localError : null);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    
    if (touched && rules.length > 0) {
      setLocalError(validateField(newValue, rules));
    }
  };

  const handleBlur = () => {
    setTouched(true);
    if (rules.length > 0) {
      setLocalError(validateField(value, rules));
    }
  };

  return (
    <div className={`form-field ${displayError ? 'has-error' : ''} ${disabled ? 'disabled' : ''} ${className}`}>
      <label htmlFor={id} className="form-label">
        {label}
        {required && <span className="required-star">*</span>}
      </label>
      
      <textarea
        id={id}
        name={name}
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        maxLength={maxLength}
        disabled={disabled}
        rows={rows}
        className="form-textarea"
        aria-invalid={!!displayError}
        {...props}
      />

      <div className="form-field-footer">
        {displayError ? (
          <span className="field-error" role="alert">{displayError}</span>
        ) : helperText ? (
          <span className="helper-text">{helperText}</span>
        ) : null}
        
        {showCharCount && maxLength && (
          <span className="char-count">{value.length}/{maxLength}</span>
        )}
      </div>

      <style>{`
        .form-textarea {
          width: 100%;
          padding: 0.75rem 1rem;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 1rem;
          font-family: inherit;
          resize: vertical;
          min-height: 100px;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .form-textarea:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .form-textarea:disabled {
          background: #f3f4f6;
          cursor: not-allowed;
        }

        .form-field.has-error .form-textarea {
          border-color: #ef4444;
        }
      `}</style>
    </div>
  );
};

// ============================================================================
// FORM SELECT COMPONENT
// ============================================================================

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface FormSelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  error?: string | null;
  helperText?: string;
}

export const FormSelect: React.FC<FormSelectProps> = ({
  label,
  name,
  value,
  onChange,
  options,
  placeholder = 'Select an option',
  error,
  helperText,
  required,
  disabled,
  className = '',
  ...props
}) => {
  const id = useId();

  return (
    <div className={`form-field ${error ? 'has-error' : ''} ${disabled ? 'disabled' : ''} ${className}`}>
      <label htmlFor={id} className="form-label">
        {label}
        {required && <span className="required-star">*</span>}
      </label>
      
      <div className="select-wrapper">
        <select
          id={id}
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="form-select"
          aria-invalid={!!error}
          {...props}
        >
          <option value="" disabled>{placeholder}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
        </select>
        <span className="select-arrow">▼</span>
      </div>

      {(error || helperText) && (
        <div className="form-field-footer">
          {error ? (
            <span className="field-error" role="alert">{error}</span>
          ) : (
            <span className="helper-text">{helperText}</span>
          )}
        </div>
      )}

      <style>{`
        .select-wrapper {
          position: relative;
        }

        .form-select {
          width: 100%;
          padding: 0.75rem 2.5rem 0.75rem 1rem;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 1rem;
          background: white;
          cursor: pointer;
          appearance: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .form-select:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .form-select:disabled {
          background: #f3f4f6;
          cursor: not-allowed;
        }

        .form-field.has-error .form-select {
          border-color: #ef4444;
        }

        .select-arrow {
          position: absolute;
          right: 1rem;
          top: 50%;
          transform: translateY(-50%);
          font-size: 0.7rem;
          color: #6b7280;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
};

// ============================================================================
// FORM CHECKBOX COMPONENT
// ============================================================================

interface FormCheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label: string;
  name: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  error?: string | null;
  helperText?: string;
}

export const FormCheckbox: React.FC<FormCheckboxProps> = ({
  label,
  name,
  checked,
  onChange,
  error,
  helperText,
  disabled,
  className = '',
  ...props
}) => {
  const id = useId();

  return (
    <div className={`form-checkbox-field ${error ? 'has-error' : ''} ${disabled ? 'disabled' : ''} ${className}`}>
      <label htmlFor={id} className="checkbox-label">
        <input
          type="checkbox"
          id={id}
          name={name}
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className="checkbox-input"
          {...props}
        />
        <span className="checkbox-custom"></span>
        <span className="checkbox-text">{label}</span>
      </label>

      {(error || helperText) && (
        <div className="checkbox-footer">
          {error ? (
            <span className="field-error">{error}</span>
          ) : (
            <span className="helper-text">{helperText}</span>
          )}
        </div>
      )}

      <style>{`
        .form-checkbox-field {
          margin-bottom: 1rem;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
          user-select: none;
        }

        .form-checkbox-field.disabled .checkbox-label {
          cursor: not-allowed;
          opacity: 0.6;
        }

        .checkbox-input {
          position: absolute;
          opacity: 0;
          width: 0;
          height: 0;
        }

        .checkbox-custom {
          width: 20px;
          height: 20px;
          border: 2px solid #d1d5db;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          flex-shrink: 0;
        }

        .checkbox-input:checked + .checkbox-custom {
          background: #3b82f6;
          border-color: #3b82f6;
        }

        .checkbox-input:checked + .checkbox-custom::after {
          content: '✓';
          color: white;
          font-size: 0.75rem;
          font-weight: bold;
        }

        .checkbox-input:focus + .checkbox-custom {
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .checkbox-text {
          font-size: 0.95rem;
          color: #374151;
        }

        .checkbox-footer {
          margin-top: 0.25rem;
          margin-left: 1.75rem;
        }
      `}</style>
    </div>
  );
};

export default FormInput;
