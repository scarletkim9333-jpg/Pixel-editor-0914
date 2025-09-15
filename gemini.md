# Gemini Project Analysis: Pixel Editor

## Project Overview

This project is a web-based pixel art editor that uses the Google Gemini API to generate and edit images. It is a single-page application built with React and TypeScript, using Vite for the development server and build process.

The application allows users to upload an image, provide a text prompt, and use various controls to generate new images based on the original. It also features a history panel to view past creations, a simple drawing canvas, and tracks API token usage.

## Key Technologies

- **Frontend Framework**: React
- **Language**: TypeScript
- **Build Tool**: Vite
- **AI Service**: Google Gemini API (`@google/genai`)
- **Styling**: The class names (e.g., `container`, `py-2`, `px-4`, `font-semibold`) suggest the use of a utility-first CSS framework like Tailwind CSS, although it's not explicitly listed as a dependency in `package.json`. It might be included via a CDN or a PostCSS setup.

## Core Components

- **`App.tsx`**: The main application component that manages the overall state and layout.
- **`components/`**:
    - **`DrawingCanvas.tsx`**: A modal component that provides a simple canvas for users to draw on. The drawing can be saved and used as an input image.
    - **`Controls.tsx`**: The main user interface for controlling the image generation process. It includes inputs for the text prompt, creativity level, number of outputs, model selection, and other parameters.
    - **`ImageUploader.tsx`**: A component for uploading the initial image(s) that will be edited. It supports both file selection and pasting from the clipboard.
    - **`OutputViewer.tsx`**: Displays the generated images from the Gemini API. It also shows loading indicators, error messages, and token usage statistics.
    - **`HistoryPanel.tsx`**: Shows a list of previous image generation sessions. Users can view, reload, or delete past results.
    - **`HelpModal.tsx`**: A modal that displays help and instructions for the user.
    - **`ApiKeyModal.tsx`**: A modal for users to enter their API key (inferred from name).
- **`services/`**:
    - **`geminiService.ts`**: Contains the core logic for making requests to the Gemini API. It handles image editing (`editImageWithGemini`) and prompt suggestions (`getPromptSuggestion`).
    - **`historyService.ts`**: Manages the persistence of the generation history, likely using browser storage like IndexedDB or localStorage.
- **`contexts/`**:
    - **`LanguageContext.tsx`**: Provides internationalization (i18n) for the application, allowing the UI to switch between languages (e.g., English and Korean).

## Application Flow

1.  The user uploads a primary image and optional reference images using the `ImageUploader`. They can also create a drawing using the `DrawingCanvas`.
2.  The user enters a text prompt and adjusts generation parameters in the `Controls` component.
3.  The user clicks the "Generate" button, which triggers the `handleGenerate` function in `App.tsx`.
4.  `handleGenerate` calls `editImageWithGemini` from `geminiService.ts`, sending the images and request parameters to the Gemini API.
5.  While the API call is in progress, `OutputViewer` displays a loading state.
6.  Upon receiving the response, the generated images are displayed in `OutputViewer`.
7.  The successful generation and its results are saved to the history via `historyService.ts` and displayed in the `HistoryPanel`.
8.  Errors during the process are caught and displayed to the user.

## How to Run

Based on `package.json`, the following scripts are available:

-   To start the development server: `npm run dev`
-   To create a production build: `npm run build`
-   To preview the production build: `npm run preview`
