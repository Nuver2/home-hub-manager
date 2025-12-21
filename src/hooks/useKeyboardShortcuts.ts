import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

interface ShortcutConfig {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: () => void;
  description: string;
}

export function useKeyboardShortcuts(customShortcuts?: ShortcutConfig[]) {
  const navigate = useNavigate();

  const defaultShortcuts: ShortcutConfig[] = [
    { key: 'd', ctrl: true, action: () => navigate('/dashboard'), description: 'Go to Dashboard' },
    { key: 't', ctrl: true, action: () => navigate('/tasks'), description: 'Go to Tasks' },
    { key: 's', ctrl: true, shift: true, action: () => navigate('/shopping-lists'), description: 'Go to Shopping Lists' },
    { key: 'n', ctrl: true, action: () => navigate('/notifications'), description: 'Go to Notifications' },
    { key: 'p', ctrl: true, action: () => navigate('/projects'), description: 'Go to Projects' },
    { key: ',', ctrl: true, action: () => navigate('/settings'), description: 'Go to Settings' },
  ];

  const shortcuts = [...defaultShortcuts, ...(customShortcuts || [])];

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Ignore if user is typing in an input
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      return;
    }

    for (const shortcut of shortcuts) {
      const ctrlMatch = shortcut.ctrl ? (event.ctrlKey || event.metaKey) : !event.ctrlKey && !event.metaKey;
      const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
      const altMatch = shortcut.alt ? event.altKey : !event.altKey;
      
      if (
        event.key.toLowerCase() === shortcut.key.toLowerCase() &&
        ctrlMatch &&
        shiftMatch &&
        altMatch
      ) {
        event.preventDefault();
        shortcut.action();
        return;
      }
    }
  }, [shortcuts]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return shortcuts;
}

// Hook to show keyboard shortcut hints
export function useShowShortcuts() {
  const shortcuts = [
    { keys: ['Ctrl', 'D'], description: 'Dashboard' },
    { keys: ['Ctrl', 'T'], description: 'Tasks' },
    { keys: ['Ctrl', 'Shift', 'S'], description: 'Shopping Lists' },
    { keys: ['Ctrl', 'N'], description: 'Notifications' },
    { keys: ['Ctrl', 'P'], description: 'Projects' },
    { keys: ['Ctrl', ','], description: 'Settings' },
  ];
  
  return shortcuts;
}
