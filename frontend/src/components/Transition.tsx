import React, { useState, useEffect } from 'react';

type TransitionProps = {
  show: boolean;
  enter?: string;
  enterFrom?: string;
  enterTo?: string;
  leave?: string;
  leaveFrom?: string;
  leaveTo?: string;
  children: React.ReactNode;
  unmount?: boolean;
  className?: string;
  duration?: number;
  delay?: number;
};

/**
 * A simple transition component for animating elements entering and leaving the DOM.
 * This component is heavily inspired by HeadlessUI Transition component but simplified.
 */
export function Transition({
  show,
  enter = 'transition-opacity duration-300',
  enterFrom = 'opacity-0',
  enterTo = 'opacity-100',
  leave = 'transition-opacity duration-300',
  leaveFrom = 'opacity-100',
  leaveTo = 'opacity-0',
  children,
  unmount = true,
  className = '',
  duration = 300,
  delay = 0
}: TransitionProps) {
  const [mounted, setMounted] = useState(show);
  const [transitionClasses, setTransitionClasses] = useState('');

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    if (show) {
      setMounted(true);
      // Apply enter animation after mount
      timeoutId = setTimeout(() => {
        setTransitionClasses(`${enter} ${enterFrom}`);
        
        // Move to enterTo state after a frame
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setTransitionClasses(`${enter} ${enterTo}`);
          });
        });
      }, delay);
    } else {
      // Start leave animation
      setTransitionClasses(`${leave} ${leaveFrom}`);
      
      // Move to leaveTo state after a frame
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setTransitionClasses(`${leave} ${leaveTo}`);
        });
      });
      
      // Unmount after animation completes
      if (unmount) {
        timeoutId = setTimeout(() => {
          setMounted(false);
        }, duration + delay);
      }
    }
    
    return () => {
      clearTimeout(timeoutId);
    };
  }, [show, enter, enterFrom, enterTo, leave, leaveFrom, leaveTo, unmount, duration, delay]);

  if (!mounted && unmount) return null;
  
  // Wrap children in a div to apply transition classes if it's not a React element
  const child = React.isValidElement(children) ? 
    React.cloneElement(children as React.ReactElement<{className?: string}>, {
      className: `${(children as React.ReactElement<{className?: string}>).props.className || ''} ${transitionClasses} ${className}`.trim()
    }) : 
    <div className={`${transitionClasses} ${className}`.trim()}>{children}</div>;
  
  return <>{child}</>;
}

/**
 * Preset transitions for common use cases
 */
export function FadeTransition(props: Omit<TransitionProps, 'enter' | 'enterFrom' | 'enterTo' | 'leave' | 'leaveFrom' | 'leaveTo'>) {
  return (
    <Transition
      enter="transition-opacity duration-300"
      enterFrom="opacity-0"
      enterTo="opacity-100"
      leave="transition-opacity duration-300"
      leaveFrom="opacity-100"
      leaveTo="opacity-0"
      {...props}
    />
  );
}

export function SlideUpTransition(props: Omit<TransitionProps, 'enter' | 'enterFrom' | 'enterTo' | 'leave' | 'leaveFrom' | 'leaveTo'>) {
  return (
    <Transition
      enter="transform transition-all duration-300"
      enterFrom="opacity-0 translate-y-4"
      enterTo="opacity-100 translate-y-0"
      leave="transform transition-all duration-300"
      leaveFrom="opacity-100 translate-y-0"
      leaveTo="opacity-0 translate-y-4"
      {...props}
    />
  );
}

export function SlideDownTransition(props: Omit<TransitionProps, 'enter' | 'enterFrom' | 'enterTo' | 'leave' | 'leaveFrom' | 'leaveTo'>) {
  return (
    <Transition
      enter="transform transition-all duration-300"
      enterFrom="opacity-0 -translate-y-4"
      enterTo="opacity-100 translate-y-0"
      leave="transform transition-all duration-300"
      leaveFrom="opacity-100 translate-y-0"
      leaveTo="opacity-0 -translate-y-4"
      {...props}
    />
  );
}

export function ScaleTransition(props: Omit<TransitionProps, 'enter' | 'enterFrom' | 'enterTo' | 'leave' | 'leaveFrom' | 'leaveTo'>) {
  return (
    <Transition
      enter="transform transition-all duration-300"
      enterFrom="opacity-0 scale-95"
      enterTo="opacity-100 scale-100"
      leave="transform transition-all duration-300"
      leaveFrom="opacity-100 scale-100"
      leaveTo="opacity-0 scale-95"
      {...props}
    />
  );
}

export default Transition;
