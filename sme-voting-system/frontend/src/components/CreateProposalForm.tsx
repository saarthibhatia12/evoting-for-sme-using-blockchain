import React, { useState } from 'react';
import { proposalService } from '../services';
import { CreateProposalRequest } from '../services/proposalService';
import { useToast, LoadingSpinner } from './ui';

interface CreateProposalFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const CreateProposalForm: React.FC<CreateProposalFormProps> = ({ onSuccess, onCancel }) => {
  const { showToast } = useToast();
  const [formData, setFormData] = useState<CreateProposalRequest>({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Get minimum date/time (allow current time for testing)
  const getMinDateTime = () => {
    const now = new Date();
    // No offset - allow current time
    return now.toISOString().slice(0, 16);
  };

  // Validate form
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!formData.title.trim()) {
      errors.title = 'Title is required';
    } else if (formData.title.length < 5) {
      errors.title = 'Title must be at least 5 characters';
    }
    
    if (!formData.startTime) {
      errors.startTime = 'Start time is required';
    } else {
      const startDate = new Date(formData.startTime);
      const now = new Date();
      // Allow current time or future (removed future-only restriction for testing)
      if (startDate < new Date(now.getTime() - 5 * 60 * 1000)) {
        errors.startTime = 'Start time cannot be more than 5 minutes in the past';
      }
    }
    
    if (!formData.endTime) {
      errors.endTime = 'End time is required';
    } else if (formData.startTime) {
      const startDate = new Date(formData.startTime);
      const endDate = new Date(formData.endTime);
      
      if (endDate <= startDate) {
        errors.endTime = 'End time must be after start time';
      } else {
        const duration = endDate.getTime() - startDate.getTime();
        const minDuration = 4 * 60 * 1000; // 4 minutes (for testing)
        if (duration < minDuration) {
          errors.endTime = 'Voting period must be at least 4 minutes';
        }
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null);
    // Clear specific field error on change
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      showToast('Please fix the validation errors', 'warning');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await proposalService.createProposal({
        title: formData.title.trim(),
        description: formData.description?.trim() || undefined,
        startTime: new Date(formData.startTime).toISOString(),
        endTime: new Date(formData.endTime).toISOString(),
      });

      if (response.success) {
        showToast(`Proposal created successfully! TX: ${response.data.blockchainTx.slice(0, 10)}...`, 'success');
        setTimeout(() => {
          onSuccess();
        }, 1500);
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to create proposal';
      setError(errorMessage);
      showToast(errorMessage, 'error');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="create-proposal-form">
      <div className="form-header">
        <h2>Create New Proposal</h2>
        <p>Create a new voting proposal for shareholders</p>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
          <button onClick={() => setError(null)} className="alert-close">×</button>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="title">Proposal Title *</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Enter proposal title"
            maxLength={200}
            disabled={isSubmitting}
            className={fieldErrors.title ? 'input-error' : ''}
          />
          <div className="field-footer">
            {fieldErrors.title && <span className="field-error">{fieldErrors.title}</span>}
            <span className="char-count">{formData.title.length}/200</span>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Provide details about this proposal..."
            rows={4}
            maxLength={2000}
            disabled={isSubmitting}
          />
          <div className="field-footer">
            <span></span>
            <span className="char-count">{formData.description?.length || 0}/2000</span>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="startTime">Start Time *</label>
            <input
              type="datetime-local"
              id="startTime"
              name="startTime"
              value={formData.startTime}
              onChange={handleChange}
              min={getMinDateTime()}
              disabled={isSubmitting}
              className={fieldErrors.startTime ? 'input-error' : ''}
            />
            {fieldErrors.startTime && <span className="field-error">{fieldErrors.startTime}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="endTime">End Time *</label>
            <input
              type="datetime-local"
              id="endTime"
              name="endTime"
              value={formData.endTime}
              onChange={handleChange}
              min={formData.startTime || getMinDateTime()}
              disabled={isSubmitting}
              className={fieldErrors.endTime ? 'input-error' : ''}
            />
            {fieldErrors.endTime && <span className="field-error">{fieldErrors.endTime}</span>}
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="btn btn-outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <LoadingSpinner size="sm" color="white" />
                Creating...
              </>
            ) : (
              '📝 Create Proposal'
            )}
          </button>
        </div>
      </form>

      <style>{`
        .create-proposal-form {
          background: white;
          border-radius: 20px;
          padding: 2rem;
          border: 1px solid rgba(0, 0, 0, 0.05);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
        }

        .form-header {
          margin-bottom: 1.75rem;
        }

        .form-header h2 {
          margin: 0 0 0.5rem 0;
          font-size: 1.35rem;
          font-weight: 700;
          color: #1f2937;
        }

        .form-header p {
          margin: 0;
          color: #6b7280;
          font-size: 0.95rem;
          line-height: 1.5;
        }

        .alert {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 1.25rem;
          border-radius: 12px;
          margin-bottom: 1.25rem;
          animation: slideDown 0.3s ease;
        }

        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .alert-error { 
          background: linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(239, 68, 68, 0.05)); 
          color: #991b1b; 
          border: 1px solid rgba(239, 68, 68, 0.2);
        }
        .alert-success { 
          background: linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(34, 197, 94, 0.05)); 
          color: #166534; 
          border: 1px solid rgba(34, 197, 94, 0.2);
        }

        .alert-close {
          background: none;
          border: none;
          font-size: 1.25rem;
          cursor: pointer;
          color: inherit;
          opacity: 0.6;
          transition: opacity 0.2s;
        }

        .alert-close:hover {
          opacity: 1;
        }

        .form-group {
          margin-bottom: 1.5rem;
          position: relative;
        }

        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 500;
          color: #374151;
          font-size: 0.9rem;
        }

        .form-group input,
        .form-group textarea {
          width: 100%;
          padding: 0.875rem 1.125rem;
          border: 1.5px solid #d1d5db;
          border-radius: 12px;
          font-size: 1rem;
          transition: all 0.25s ease;
          box-sizing: border-box;
        }

        .form-group input:hover:not(:focus):not(:disabled),
        .form-group textarea:hover:not(:focus):not(:disabled) {
          border-color: #9ca3af;
        }

        .form-group input:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.12);
        }

        .form-group input.input-error,
        .form-group textarea.input-error {
          border-color: #ef4444;
          background: rgba(239, 68, 68, 0.02);
        }

        .form-group input.input-error:focus,
        .form-group textarea.input-error:focus {
          box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.1);
        }

        .form-group input:disabled,
        .form-group textarea:disabled {
          background: #f3f4f6;
          cursor: not-allowed;
          opacity: 0.7;
        }

        .form-group textarea {
          resize: vertical;
          min-height: 120px;
          line-height: 1.6;
        }

        .field-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 0.35rem;
          min-height: 1.25rem;
        }

        .field-error {
          font-size: 0.8rem;
          color: #ef4444;
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .field-error::before {
          content: '⚠';
          font-size: 0.9em;
        }

        .char-count {
          font-size: 0.75rem;
          color: #9ca3af;
          margin-left: auto;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.25rem;
        }

        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 0.875rem;
          margin-top: 1.75rem;
          padding-top: 1.75rem;
          border-top: 1px solid #f3f4f6;
        }

        .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.875rem 1.75rem;
          border-radius: 12px;
          font-size: 0.95rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.25s ease;
          border: none;
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn:hover:not(:disabled) {
          transform: translateY(-2px);
        }

        .btn-primary {
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          color: white;
          box-shadow: 0 4px 14px rgba(59, 130, 246, 0.3);
        }

        .btn-primary:hover:not(:disabled) {
          box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
        }

        .btn-outline {
          background: white;
          border: 1.5px solid #d1d5db;
          color: #374151;
        }

        .btn-outline:hover:not(:disabled) {
          background: #f3f4f6;
          border-color: #9ca3af;
        }

        @media (max-width: 640px) {
          .form-row {
            grid-template-columns: 1fr;
          }

          .form-actions {
            flex-direction: column-reverse;
          }

          .form-actions .btn {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default CreateProposalForm;
