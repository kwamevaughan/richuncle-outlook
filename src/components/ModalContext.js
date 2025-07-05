import { createContext, useContext, useState } from 'react';

const ModalContext = createContext();

export function ModalProvider({ children }) {
  const [showCashRegister, setShowCashRegister] = useState(false);
  // Global confirm modal state
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState("");
  const [onConfirm, setOnConfirm] = useState(() => () => {});

  // Helper to show a global confirm modal
  function showGlobalConfirm(message, onConfirmCallback) {
    setConfirmMessage(message);
    setOnConfirm(() => onConfirmCallback);
    setShowConfirm(true);
  }

  return (
    <ModalContext.Provider value={{
      showCashRegister,
      setShowCashRegister,
      showConfirm,
      setShowConfirm,
      confirmMessage,
      setConfirmMessage,
      onConfirm,
      setOnConfirm,
      showGlobalConfirm
    }}>
      {children}
    </ModalContext.Provider>
  );
}

export function useModal() {
  return useContext(ModalContext);
}

// Helper for components to use global confirm
export function useGlobalConfirm() {
  const { showGlobalConfirm } = useModal();
  return showGlobalConfirm;
} 