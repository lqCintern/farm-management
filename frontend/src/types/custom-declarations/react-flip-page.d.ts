declare module 'react-flip-page' {
  import React from 'react';
  
  export interface FlipPageProps {
    orientation?: 'horizontal' | 'vertical';
    uncutPages?: boolean;
    animationDuration?: number;
    treshold?: number; // Threshold for swipe
    maxAngle?: number;
    maskOpacity?: number;
    perspective?: string;
    pageBackground?: string;
    firstComponent?: React.ReactNode;
    lastComponent?: React.ReactNode;
    showHint?: boolean;
    showSwipeHint?: boolean;
    showTouchHint?: boolean;
    style?: React.CSSProperties;
    height?: number | string;
    width?: number | string;
    responsive?: boolean;
    responsiveHeight?: boolean;
    className?: string;
    onPageChange?: (pageIndex: number) => void;
    onStartPageChange?: () => void;
    onEndPageChange?: () => void;
    disabled?: boolean;
    children?: React.ReactNode;
  }
  
  export default class FlipPage extends React.Component<FlipPageProps> {
    gotoPage(pageIndex: number): void;
    gotoNextPage(): void;
    gotoPreviousPage(): void;
    getCurrentPage(): number;
  }
}