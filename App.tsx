
import React, { useState, useEffect } from 'react';

// Import all components
import ImageEditor from './components/ImageEditor.tsx';
import ImageGenerator from './components/ImageGenerator.tsx';
// FIX: Corrected import to use named export for ImageMixer
import ImageMixer from './components/ImageMixer.tsx';
import ImageToPrompt from './components/ImageToPrompt.tsx';
import StoryGenerator from './components/StoryGenerator.tsx';
import MovieTrailerGenerator from './components/MovieTrailerGenerator.tsx';
import StoryWriter from './components/StoryWriter.tsx';
import KidsStoryGenerator from './components/KidsStoryGenerator.tsx';
import ScriptOutlineGenerator from './components/ScriptOutlineGenerator.tsx';
import PodcastGenerator from './components/PodcastGenerator.tsx';
import TranslatedScriptGenerator from './components/TranslatedScriptGenerator.tsx';
import QuotifyGenerator from './components/QuotifyGenerator.tsx';
import SpeakingVoiceover from './components/SpeakingVoiceover.tsx';
import WorkTimer from './components/WorkTimer.tsx';
import AnimatedTitle from './components/AnimatedTitle.tsx';
import FaceSwapper from './components/FaceSwapper.tsx';
import VoiceOverGenerator from './components/VoiceOverGenerator.tsx';
import { useAuth } from './components/AuthContext.tsx';
import LoginButton from './components/LoginButton.tsx';
import UserProfile from './components/UserProfile.tsx';
import LoginScreen from './components/LoginScreen.tsx';
import ApiKeyModal from './components/ApiKeyModal.tsx';
import { setApiKey, clearApiKey } from './services/geminiService.ts';
import TextToVideo from './components/TextToVideo.tsx';
import ImageToVideo from './components/ImageToVideo.tsx';
import AnimationGenerator from './components/AnimationGenerator.tsx';
import VideoTranslatedScript from './components/VideoTranslatedScript.tsx';
import ImageToVideoPrompt from './components/ImageToVideoPrompt.tsx';

// Define the structure of our tools
const tools = {
  writing: {
    'story-writer': { label: 'Tools+Ai បង្កើតរឿង', icon: '🖋️', component: StoryWriter },
    'kids-story-generator': { label: 'Story Studio', icon: '🎬', component: KidsStoryGenerator },
    'story-generator': { label: 'Story Generator', icon: '📖', component: StoryGenerator },
    'script-outline': { label: 'បង្កើតគ្រោងរឿង', icon: '📝', component: ScriptOutlineGenerator },
    'movie-trailer': { label: 'Movie Trailer', icon: '🎟️', component: MovieTrailerGenerator },
    'translated-script': { label: 'Translated Script', icon: '🌐', component: TranslatedScriptGenerator },
    'quotify': { label: 'Quotify', icon: '💬', component: QuotifyGenerator },
  },
  image: {
    'generate': { label: 'Generate Image', icon: '✨', component: ImageGenerator },
    'edit': { label: 'Edit Image', icon: '🎨', component: ImageEditor },
    'image-mixer': { label: 'Image Mixer', icon: '➕', component: ImageMixer },
    'image-to-prompt': { label: 'Image to Prompt', icon: '📝', component: ImageToPrompt },
    'face-swapper': { label: 'Face Swapper', icon: '😎', component: FaceSwapper },
    'image-to-video-prompt': { label: 'Image to Video Prompt', icon: '🖼️➡️🎬', component: ImageToVideoPrompt },
  },
  video: {
    'text-to-video': { label: 'Text to Video', icon: '📄➡️📹', component: TextToVideo },
    'image-to-video': { label: 'Image to Video', icon: '🖼️➡️📹', component: ImageToVideo },
    'animation-generator': { label: '3D Animation', icon: '🧊➡️📹', component: AnimationGenerator },
    'video-translated-script': { label: 'Video Translated Script', icon: '📹➡️🌐', component: VideoTranslatedScript },
  },
  audio: {
    'podcast': { label: 'Podcast', icon: '🎙️', component: PodcastGenerator },
    'speaking-voiceover': { label: 'Speaking Voiceover', icon: '🎤', component: SpeakingVoiceover },
    'voiceover-generator': { label: 'Voiceover Generator', icon: '🗣️', component: VoiceOverGenerator },
  },
};

// Define types for better code management
type MainCategory = keyof typeof tools;
type ToolKey<C extends MainCategory> = keyof typeof tools[C];

const mainCategories: { key: MainCategory, label: string, icon: string }[] = [
    { key: 'writing', label: 'Writing Tools', icon: '✍️' },
    { key: 'image', label: 'Image Tools', icon: '🎨' },
    { key: 'video', label: 'Video Tools', icon: '🎬' },
    { key: 'audio', label: 'Audio Tools', icon: '🎙️' },
];

const App: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<MainCategory>('writing');
  const [activeTool, setActiveTool] = useState<string>('story-writer');
  const { user } = useAuth();
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);

  useEffect(() => {
    const handleOpenModal = () => setIsApiKeyModalOpen(true);
    window.addEventListener('openApiKeyModal', handleOpenModal);
    return () => {
        window.removeEventListener('openApiKeyModal', handleOpenModal);
    };
  }, []);
  
  const handleCategoryChange = (category: MainCategory) => {
    if (!user) return;
    setActiveCategory(category);
    // When category changes, set active tool to the first tool in that category
    setActiveTool(Object.keys(tools[category])[0]);
  };

  const handleSaveApiKey = (key: string) => {
    setApiKey(key);
    setIsApiKeyModalOpen(false);
  };

  const handleClearApiKey = () => {
      clearApiKey();
  };

  // Style for main category tabs
  const getCategoryTabClass = (categoryKey: MainCategory) => {
    const isDisabled = !user;
    const baseClasses = "flex items-center justify-center font-bold px-6 py-3 rounded-lg cursor-pointer transition-all duration-300 transform active:scale-[0.97] text-base shadow-md border-b-4";
     if (isDisabled) {
        return `${baseClasses} bg-gray-800 text-gray-500 border-gray-900 cursor-not-allowed opacity-60`;
    }
    if (activeCategory === categoryKey) {
      return `${baseClasses} bg-gradient-to-r from-purple-600 to-cyan-500 text-white border-purple-800 scale-105 shadow-xl`;
    }
    return `${baseClasses} bg-gray-700 text-gray-300 hover:bg-gray-600 border-gray-800`;
  };

  // Style for tool/sub-tabs
  const getToolTabClass = (toolKey: string) => {
    const baseClasses = "flex items-center justify-center font-bold px-4 py-2 rounded-md cursor-pointer transition-all duration-200 transform active:scale-[0.98] text-sm";
    if (activeTool === toolKey) {
      return `${baseClasses} bg-gray-600 text-cyan-300 shadow-inner`;
    }
    return `${baseClasses} bg-gray-800/50 text-gray-400 hover:bg-gray-700/70`;
  };
  
  const telegramButtonClasses = "flex items-center gap-2 px-3 py-2 text-sm font-semibold text-cyan-300 bg-gray-700/50 border border-gray-600 rounded-lg hover:bg-gray-700 transition-colors duration-200 transform active:scale-95";

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans flex flex-col">
      <header className="p-4 bg-gray-800/50 backdrop-blur-sm border-b border-gray-700 w-full flex justify-between items-center flex-wrap gap-4">
        <div className="text-center sm:text-left">
            <AnimatedTitle title="Sal tools mmo : media Ai Pro V.1" />
            <p className="text-sm text-gray-400 mt-1">Create images, videos, and entire stories with the power of AI.</p>
        </div>
         <div className="flex items-center gap-6 flex-wrap justify-center sm:justify-end">
            <div className="flex items-center gap-2">
                <a
                    href="https://t.me/SEYPISAL"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={telegramButtonClasses}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.428A1 1 0 009.894 15V11a1 1 0 112 0v4a1 1 0 00.789 1.106l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                    </svg>
                    <span>Chat to Admin</span>
                </a>
                <a
                    href="https://t.me/salmmo2023"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={telegramButtonClasses}
                >
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.428A1 1 0 009.894 15V11a1 1 0 112 0v4a1 1 0 00.789 1.106l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                    </svg>
                    <span>Channel Telegram</span>
                </a>
            </div>
            <WorkTimer />
            <div className="h-8 w-px bg-gray-600 hidden sm:block"></div>
            {user && (
              <button
                onClick={() => setIsApiKeyModalOpen(true)}
                className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-yellow-300 bg-gray-700/50 border border-gray-600 rounded-lg hover:bg-gray-700 transition-colors duration-200"
                aria-label="Manage API Key"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v-2l1-1 1-1-1.257-1.257A6 6 0 1118 8zm-6-4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 5.257L8 16.146V18h1.854l2.89-2.89A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
                <span>API Key</span>
            </button>
            )}
            {user ? <UserProfile /> : <LoginButton />}
        </div>
      </header>
      <main className="flex-grow flex flex-col items-center p-4 w-full">
        {user ? (
          <>
            {/* Main Category Tabs */}
            <div className="mb-6 flex flex-wrap justify-center gap-4 p-2" role="tablist" aria-label="Tool Categories">
                {mainCategories.map(({ key, label, icon }) => (
                     <button 
                        key={key}
                        role="tab" 
                        aria-selected={activeCategory === key}
                        onClick={() => handleCategoryChange(key)} 
                        className={getCategoryTabClass(key)}
                        disabled={!user}
                     >
                        <span className="text-2xl mr-3">{icon}</span>
                        {label}
                     </button>
                ))}
            </div>

            {/* Secondary Tool Tabs */}
            <div className="mb-6 w-full max-w-7xl flex flex-wrap justify-center gap-3 p-2 bg-gray-800 rounded-lg border border-gray-700" role="tablist" aria-label="AI Media Tools">
                {Object.entries(tools[activeCategory] as Record<string, { label: string; icon: string; component: React.FC; }>).map(([toolKey, toolDetails]) => (
                    <button
                        key={toolKey}
                        role="tab"
                        aria-selected={activeTool === toolKey}
                        onClick={() => setActiveTool(toolKey)}
                        className={getToolTabClass(toolKey)}
                    >
                        <span className="text-xl mr-2">{toolDetails.icon}</span>
                        {toolDetails.label}
                    </button>
                ))}
            </div>
            
            <div className="w-full flex-grow">
              {Object.entries(tools[activeCategory] as Record<string, { component: React.FC }>).map(([toolKey, toolDetails]) => {
                  const Component = toolDetails.component;
                  if (!Component) return null;
                  return (
                      <div key={toolKey} className="h-full" style={{ display: activeTool === toolKey ? 'block' : 'none' }}>
                          <Component />
                      </div>
                  );
              })}
            </div>
          </>
        ) : (
          <LoginScreen />
        )}
      </main>
      <footer className="w-full p-4 bg-gray-800/50 border-t border-gray-700 text-center text-sm text-gray-400">
        Copyright © 2026   អេតមីន - សាល  | Admin: SAI (@SEYPISAL)
      </footer>

       <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        onSave={handleSaveApiKey}
        onClear={handleClearApiKey}
      />
    </div>
  );
};

export default App;
