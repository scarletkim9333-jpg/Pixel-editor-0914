
import React from 'react';

type IconProps = React.SVGProps<SVGSVGElement>;

export const UploadIcon: React.FC<IconProps> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
  </svg>
);

export const TrashIcon: React.FC<IconProps> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.134-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.067-2.09 1.02-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
  </svg>
);

export const ImageIcon: React.FC<IconProps> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
  </svg>
);

export const LogoIcon: React.FC<IconProps> = (props) => (
    <svg {...props} width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ imageRendering: 'pixelated' }}>
        <path fillRule="evenodd" clipRule="evenodd" d="M0 8H4V4H10V0H22V4H28V8H32V28H0V8ZM20 4H12V8H20V4Z" fill="#212121"/>
        <path d="M24 12H8V24H24V12Z" fill="#FDF6E3"/>
        <path d="M22 14H10V22H22V14Z" fill="#2E7D73"/>
        <path d="M18 16H14V20H18V16Z" fill="#FDF6E3"/>
    </svg>
);

export const SparklesIcon: React.FC<IconProps> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.898 20.572L16.5 21.75l-.398-1.178a3.375 3.375 0 00-2.455-2.456L12.75 18l1.178-.398a3.375 3.375 0 002.455-2.456L16.5 14.25l.398 1.178a3.375 3.375 0 002.456 2.456L20.25 18l-1.178.398a3.375 3.375 0 00-2.456 2.456z" />
  </svg>
);

export const DownloadIcon: React.FC<IconProps> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
  </svg>
);

export const ChevronDownIcon: React.FC<IconProps> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
    </svg>
);

export const PaintBrushIcon: React.FC<IconProps> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    {/* FIX: The path data was truncated and contained a syntax error, causing parsing issues. Replaced with the full, correct path and self-closed the tag. */}
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.998 15.998 0 01-3.388-1.62m5.043.025a15.998 15.998 0 013.388 1.62m0-11.943a15.998 15.998 0 00-3.388-1.62m-5.043-.025a15.998 15.998 0 01-3.388-1.62m5.043.025a15.998 15.998 0 013.388 1.62M3 7.5l-1.5-1.5m1.5 1.5L1.5 6m0 1.5v3.75m3-3.75L4.5 6m0 1.5v3.75m3-3.75L7.5 6m0 1.5v3.75m3-3.75l-1.5-1.5m1.5 1.5L13.5 6m0 1.5v3.75m3-3.75l-1.5-1.5m1.5 1.5L16.5 6m0 1.5v3.75m3-3.75l-1.5-1.5m1.5 1.5L19.5 6m0 1.5v3.75" />
  </svg>
);

export const CogIcon: React.FC<IconProps> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-1.007 1.11-1.226l.44-1.637a2.25 2.25 0 012.22 0l.442 1.637c.55.219 1.02.684 1.11 1.226l1.638.442a2.25 2.25 0 010 2.22l-1.637.442c-.09.542-.56 1.007-1.11 1.226l-.442 1.637a2.25 2.25 0 01-2.22 0l-.442-1.637c-.55-.219-1.02-.684-1.11-1.226L3.94 8.563a2.25 2.25 0 010-2.22l1.637-.442zM12 15.75a3.75 3.75 0 100-7.5 3.75 3.75 0 000 7.5z" />
    </svg>
);

export const QuestionMarkCircleIcon: React.FC<IconProps> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
  </svg>
);

export const PixelBrushIcon: React.FC<IconProps> = (props) => (
  <svg {...props} width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" style={{ imageRendering: 'pixelated' }}>
    <path d="M7 20H17V19H7V20Z" />
    <path fillRule="evenodd" clipRule="evenodd" d="M18 4H17V3H9V4H8V5H7V6H6V7L12 13H13L19 7V6H20V5H19V4H18ZM18 6L12.5 11.5L7 6H8V7H9V8L12 11H13L16 8V7H17V6H18Z" />
    <path d="M6 8L12 14V15L8 11H7V10H6V8Z" />
  </svg>
);

export const PixelEraserIcon: React.FC<IconProps> = (props) => (
  <svg {...props} width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" style={{ imageRendering: 'pixelated' }}>
    <path fillRule="evenodd" clipRule="evenodd" d="M9 3H17V4H18V5H19V6H20V8H21V10H20V12H19V13H17V14H15V15H13V16H8V15H7V14H6V13H5V11H4V9H5V7H6V5H7V4H9V3ZM10 5H17V6H18V8H19V10H18V11H17V12H15V13H12V14H10V13H9V12H8V10H7V8H8V6H10V5Z" />
    <path d="M8 17H13V19H8V17Z" />
  </svg>
);

export const UndoIcon: React.FC<IconProps> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" />
  </svg>
);
