/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, {useCallback, useState, useEffect} from 'react';
import ApiKeyModal from './components/ApiKeyModal';
import ImageResult from './components/ImageResult';
import LoadingIndicator from './components/LoadingIndicator';
import ReferenceImageUploader from './components/ReferenceImageUploader';
import {
  FileTextIcon,
  LoaderIcon,
  RectangleHorizontalIcon,
  RectangleStackIcon,
  RectangleVerticalIcon,
  SparklesIcon,
  SquareIcon,
} from './components/icons';
import {extractTextAndGeneratePlates} from './components/utils';
import {
  addQuotesToPrompt,
  engineerPrompt,
  generateImage,
} from './services/geminiService';
import {
  AppState,
  AspectRatio,
  ImageFile,
  TargetModel,
} from './types';

// Footer Component
const Footer: React.FC = () => {
  return (
    <footer className="w-full text-center py-4 px-8 shrink-0">
      <a
        href="https://t.me/shervini"
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm font-semibold bg-gradient-to-tr from-white via-gray-400 to-gray-700 bg-clip-text text-transparent"
        style={{fontFamily: 'Arimo, sans-serif'}}>
        Exclusive SHΞN™ made
      </a>
    </footer>
  );
};

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // API Key State
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [apiKeyError, setApiKeyError] = useState<string | undefined>(undefined);

  // User Inputs
  const [userPrompt, setUserPrompt] = useState('');
  const [referenceImages, setReferenceImages] = useState<ImageFile[]>([]);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(
    AspectRatio.SQUARE,
  );

  // Generation Results
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [lastConfig, setLastConfig] = useState<
    | {
        prompt: string;
        textPlates: ImageFile[];
        referenceImages: ImageFile[];
      }
    | null
  >(null);
  
  useEffect(() => {
    const storedApiKey = localStorage.getItem('gemini-api-key');
    if (storedApiKey) {
      setApiKey(storedApiKey);
      setIsApiKeyModalOpen(false);
    } else {
      setIsApiKeyModalOpen(true);
    }
  }, []);

  const handleSaveApiKey = (newApiKey: string) => {
    setApiKey(newApiKey);
    localStorage.setItem('gemini-api-key', newApiKey);
    setIsApiKeyModalOpen(false);
    setApiKeyError(undefined); // Clear any previous error
  };


  const handleError = (
    message: string,
    error?: unknown,
    state: AppState = AppState.ERROR,
  ) => {
    console.error(message, error);
    const errorDetails =
      error instanceof Error ? error.message : 'An unknown error occurred.';

    // Check for common API key errors
    if (errorDetails.includes('API key not valid') || errorDetails.includes('API_KEY_INVALID')) {
        localStorage.removeItem('gemini-api-key');
        setApiKey(null);
        setApiKeyError('Your API key is invalid. Please enter a valid key.');
        setIsApiKeyModalOpen(true);
        setAppState(AppState.IDLE); // Reset state to show form again
        return;
    }
      
    const userFriendlyMessage = `${message}: ${errorDetails}`;
    setErrorMessage(userFriendlyMessage);
    setAppState(state);
  };

  const handleGenerate = async (
    retryConfig?: typeof lastConfig | null,
  ) => {
    if (!apiKey) {
      setIsApiKeyModalOpen(true);
      setApiKeyError('An API key is required to generate images.');
      return;
    }

    const isRetry = !!retryConfig;
    const currentPrompt = isRetry ? '' : userPrompt;

    if (!isRetry && !currentPrompt.trim()) {
      handleError('Please enter a prompt to generate.');
      return;
    }

    setAppState(AppState.LOADING);
    setResultUrl(null);
    setErrorMessage(null);

    try {
      let promptToUse: string;
      let textPlatesToUse: ImageFile[];
      let referenceImagesToUse: ImageFile[];

      if (isRetry && retryConfig) {
        promptToUse = retryConfig.prompt;
        textPlatesToUse = retryConfig.textPlates;
        referenceImagesToUse = retryConfig.referenceImages;
      } else {
        const quotedPrompt = await addQuotesToPrompt(currentPrompt, apiKey);
        const textPlates = await extractTextAndGeneratePlates(quotedPrompt);
        const engineeredPrompt = await engineerPrompt(
          quotedPrompt,
          TargetModel.IMAGE,
          textPlates,
          referenceImages,
          aspectRatio,
          apiKey,
        );
        promptToUse = `${engineeredPrompt.professional_prompt}\n\n${engineeredPrompt.text_replication_instruction}\n\nNegative Prompt: ${engineeredPrompt.negative_prompt}`;
        textPlatesToUse = textPlates;
        referenceImagesToUse = referenceImages;
      }

      setLastConfig({
        prompt: promptToUse,
        textPlates: textPlatesToUse,
        referenceImages: referenceImagesToUse,
      });

      const {objectUrl} = await generateImage(
        promptToUse,
        textPlatesToUse,
        referenceImagesToUse,
        apiKey,
      );
      setResultUrl(objectUrl);
      setAppState(AppState.SUCCESS);
    } catch (error) {
      handleError('Generation failed', error);
    }
  };

  const handleStartOver = useCallback(() => {
    setAppState(AppState.IDLE);
    setResultUrl(null);
    setErrorMessage(null);
    setUserPrompt('');
    setReferenceImages([]);
    setLastConfig(null);
    setAspectRatio(AspectRatio.SQUARE);
  }, []);

  const renderError = (message: string) => (
    <div className="text-center bg-red-900/20 border border-red-500 p-8 rounded-lg mt-6">
      <h2 className="text-2xl font-bold text-red-400 mb-4">Error</h2>
      <p className="text-red-300">{message}</p>
      <button
        onClick={handleStartOver}
        className="mt-6 px-6 py-2 bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors">
        Start Over
      </button>
    </div>
  );

  const isLoading = appState === AppState.LOADING;

  return (
    <div className="min-h-screen bg-black text-gray-200 flex flex-col font-sans">
      {isApiKeyModalOpen && (
        <ApiKeyModal onSave={handleSaveApiKey} initialError={apiKeyError} />
      )}
      <header className="py-6 flex justify-center items-center px-8 relative z-10 shrink-0">
        <h1 className="inline-flex items-baseline text-5xl font-semibold tracking-wide bg-gradient-to-r from-yellow-400 via-gray-200 to-yellow-200 bg-clip-text">
          <span className="text-transparent">SHΞNano Banana&nbsp;</span>
          <span
            role="img"
            aria-label="banana"
            style={{textShadow: 'none', color: 'initial', WebkitTextFillColor: 'initial'}}>
            🍌
          </span>
          <span className="text-transparent">&nbsp;™</span>
        </h1>
      </header>

      <main className="w-full max-w-4xl mx-auto flex-grow flex flex-col items-center justify-center p-4">
        {isLoading && <LoadingIndicator />}
        {appState === AppState.ERROR &&
          errorMessage &&
          renderError(errorMessage)}

        {appState === AppState.SUCCESS && resultUrl && (
          <ImageResult
            imageUrl={resultUrl}
            onRetry={() => handleGenerate(lastConfig)}
            onNewImage={handleStartOver}
            modelName="gemini-2.5-flash-image"
          />
        )}

        {/* Show generation form only when not loading/successful */}
        {!isLoading && appState !== AppState.SUCCESS && (
          <div className="w-full space-y-4 bg-gray-900 p-6 rounded-2xl border border-yellow-500/50 shadow-lg">
            <div className="text-center mb-6">
              <h2 className="text-3xl text-gray-300">
                Describe Your Vision
              </h2>
              <p className="text-md text-gray-500 mt-2">
                Create stunning images with perfectly rendered Persian text.
                Just describe the scene and any text you want included.
              </p>
            </div>

            <div className="bg-gray-800 p-4 rounded-lg shadow-inner space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <RectangleStackIcon className="w-5 h-5 inline-block mr-2" />
                  Aspect Ratio
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setAspectRatio(AspectRatio.SQUARE)}
                    className={`flex flex-col items-center justify-center p-2 rounded-md transition-colors ${
                      aspectRatio === AspectRatio.SQUARE
                        ? 'bg-yellow-600 text-black'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}>
                    <SquareIcon className="w-6 h-6 mb-1" />
                    <span className="text-xs font-medium">Square (1:1)</span>
                  </button>
                  <button
                    onClick={() => setAspectRatio(AspectRatio.PORTRAIT)}
                    className={`flex flex-col items-center justify-center p-2 rounded-md transition-colors ${
                      aspectRatio === AspectRatio.PORTRAIT
                        ? 'bg-yellow-600 text-black'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}>
                    <RectangleVerticalIcon className="w-6 h-6 mb-1" />
                    <span className="text-xs font-medium">
                      Portrait (9:16)
                    </span>
                  </button>
                  <button
                    onClick={() => setAspectRatio(AspectRatio.LANDSCAPE)}
                    className={`flex flex-col items-center justify-center p-2 rounded-md transition-colors ${
                      aspectRatio === AspectRatio.LANDSCAPE
                        ? 'bg-yellow-600 text-black'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}>
                    <RectangleHorizontalIcon className="w-6 h-6 mb-1" />
                    <span className="text-xs font-medium">
                      Landscape (16:9)
                    </span>
                  </button>
                </div>
              </div>
              <div>
                <label
                  htmlFor="user_prompt"
                  className="block text-sm font-medium text-gray-300 mb-2">
                  <FileTextIcon className="w-5 h-5 inline-block mr-2" />
                  Your Prompt
                </label>
                <textarea
                  id="user_prompt"
                  rows={4}
                  className="w-full bg-gray-900 border border-gray-700 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500 text-lg"
                  placeholder={`e.g., A fruit shop sign says میوه تازه and is made of glowing neon.`}
                  value={userPrompt}
                  onChange={(e) => setUserPrompt(e.target.value)}
                />
              </div>

              <ReferenceImageUploader
                referenceImages={referenceImages}
                setReferenceImages={setReferenceImages}
              />
            </div>

            <button
              onClick={() => handleGenerate(null)}
              disabled={isLoading || !userPrompt}
              className="w-full bg-yellow-600 text-black px-4 py-4 rounded-md font-bold text-xl hover:bg-yellow-500 disabled:opacity-50 flex items-center justify-center gap-3 transition-all duration-300 transform hover:scale-105">
              {isLoading ? (
                <LoaderIcon className="w-7 h-7 animate-spin" />
              ) : (
                <SparklesIcon className="w-7 h-7" />
              )}
              {isLoading ? 'Generating...' : 'Generate Image'}
            </button>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default App;