import React from 'react';
import { CloseIcon } from './icons';

interface ModalProps {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  size?: 'md' | 'lg' | 'full';
  isOpaque?: boolean;
}

const Modal: React.FC<ModalProps> = ({ title, children, onClose, size = 'md', isOpaque = false }) => {
  const sizeClasses = {
    md: 'max-w-md w-11/12',
    lg: 'max-w-lg w-11/12',
    full: 'max-w-5xl w-11/12 h-5/6 flex flex-col',
  };
  
  const overlayClass = isOpaque 
    ? "fixed inset-0 bg-white z-40" 
    : "fixed inset-0 bg-black bg-opacity-75 z-40";

  return (
    <>
      <div className={overlayClass} onClick={onClose}></div>
      <div 
        className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-lg shadow-xl z-50 ${sizeClasses[size]}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-4xl font-bold text-gray-800 break-words">{title}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
            <CloseIcon className="w-8 h-8" />
          </button>
        </div>
        <div className={`text-gray-600 ${size === 'full' ? 'overflow-y-auto flex-grow' : ''}`}>
          {children}
        </div>
      </div>
    </>
  );
};

export default Modal;