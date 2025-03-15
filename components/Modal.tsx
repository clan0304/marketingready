import React, { useEffect, useRef } from 'react';
import BusinessForm from './BusinessForm';
import CreatorForm from './CreatorForm';
import { Business } from '@/types';
import { Creator } from '@/types';

type FormType = 'business' | 'creator';

interface ModalProps<T extends Business | Creator> {
  isOpen: boolean;
  onClose: () => void;
  formType: FormType;
  initialData?: T;
  isEditing?: boolean;
  onSubmit: (data: T) => void;
  onDelete?: (id: string) => void;
}

function Modal<T extends Business | Creator>({
  isOpen,
  onClose,
  formType,
  initialData,
  isEditing = false,
  onSubmit,
  onDelete,
}: ModalProps<T>) {
  const modalRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside the modal
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Close on escape key press
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Render the correct form based on formType
  const renderForm = () => {
    if (formType === 'business') {
      return (
        <BusinessForm
          initialData={initialData as Business}
          onSubmit={(data) => {
            onSubmit(data as T);
            onClose();
          }}
          onDelete={onDelete}
          onCancel={onClose}
          isEditing={isEditing}
        />
      );
    } else if (formType === 'creator') {
      return (
        <CreatorForm
          initialData={initialData as Creator}
          onSubmit={(data) => {
            onSubmit(data as T);
            onClose();
          }}
          onDelete={onDelete}
          onCancel={onClose}
          isEditing={isEditing}
        />
      );
    }

    return null;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div
        ref={modalRef}
        className="relative w-full max-w-md mx-4 md:mx-auto bg-white rounded shadow-lg"
      >
        <button
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
          onClick={onClose}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        <div className="max-h-[80vh] overflow-y-auto">{renderForm()}</div>
      </div>
    </div>
  );
}

export default Modal;
