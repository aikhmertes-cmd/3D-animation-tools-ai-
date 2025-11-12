import React, { useState, useCallback, useEffect } from 'react';
import { generateVideo } from '../services/geminiService.ts';
import ImagePanel from './ImagePanel.tsx';
import VideoPanel from './VideoPanel.tsx';
import VideoOptionsSelector, { VideoAspectRatio, Resolution } from './VideoOptionsSelector.tsx';

interface FileData {
  base64: string;
  mimeType: string;
}

const ClearProjectButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
    <div className="w-full flex justify-end mb-4">
        <button
            onClick={onClick}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-red-300 bg-red-900/40 border border-red-800 rounded-lg hover:bg-red-900/80 transition-colors duration-200"
            aria-label="Clear current project"
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            Clear Project
        </button>
    </div>
);


const ImageToVideo: React.FC = () => {
    const [sourceFile, setSourceFile] = useState<FileData | null>(null);
    const [prompt, setPrompt] = useState('');
    const [videoBlobUrl, setVideoBlobUrl] = useState<string | null>(null);
    const [aspectRatio, setAspectRatio] = useState<VideoAspectRatio>('16:9');
    const [resolution, setResolution] = useState<Resolution>('720p');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isKeySelected, setIsKeySelected] = useState(false);

    useEffect(() => {
        window.aistudio?.hasSelectedApiKey().then(setIsKeySelected);
    }, []);
    
    useEffect(() => {
        return () => { if (videoBlobUrl) URL.revokeObjectURL(videoBlobUrl); };
    }, [videoBlobUrl]);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                setSourceFile({ base64: base64String.split(',')[1], mimeType: file.type });
                if (videoBlobUrl) URL.revokeObjectURL(videoBlobUrl);
                setVideoBlobUrl(null);
                setError(null);
            };
            reader.onerror = () => setError('Failed to read the image file.');
            reader.readAsDataURL(file);
        }
    };

    const handleSelectKey = async () => {
        if(window.aistudio) {
            await window.aistudio.openSelectKey();
            setIsKeySelected(true);
            setError(null);
        }
    };

    const handleSubmit = useCallback(async () => {
        if (!sourceFile) {
            setError('Please upload an image to generate a video.');
            return;
        }
        setIsLoading(true);
        setError(null);
        if (videoBlobUrl) URL.revokeObjectURL(videoBlobUrl);
        setVideoBlobUrl(null);

        try {
            const blob = await generateVideo({ prompt, aspectRatio, resolution, image: sourceFile });
            setVideoBlobUrl(URL.createObjectURL(blob));
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            setError(errorMessage);
            if (errorMessage.includes('not found') || errorMessage.includes('API key')) {
                setIsKeySelected(false);
            }
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [prompt, aspectRatio, resolution, sourceFile, videoBlobUrl]);

    const handleClear = () => {
        setSourceFile(null);
        setPrompt('');
        if (videoBlobUrl) {
            URL.revokeObjectURL(videoBlobUrl);
        }
        setVideoBlobUrl(null);
        setError(null);
        setAspectRatio('16:9');
        setResolution('720p');
    };

    if (!isKeySelected) {
        return (
             <div className="w-full max-w-2xl mx-auto text-center bg-gray-800/50 p-8 rounded-lg border border-gray-700">
                <h2 className="text-2xl font-bold text-cyan-400 mb-4">API Key Required</h2>
                <p className="text-gray-300 mb-6">Video generation with Veo requires a dedicated API key. Please select one to proceed. This is a mandatory step before accessing this feature.</p>
                <button
                    onClick={handleSelectKey}
                    className="inline-flex items-center justify-center px-6 py-3 font-semibold text-white bg-gradient-to-r from-purple-500 to-cyan-500 rounded-lg shadow-lg border-b-4 border-purple-700 hover:from-purple-600 hover:to-cyan-600 transform transition-all duration-200 active:translate-y-0.5 active:border-b-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-cyan-500"
                >
                    <span className="text-xl mr-2">🔑</span>
                    Select API Key
                </button>
                 {error && <p className="text-red-400 mt-4">{error}</p>}
                 <p className="text-sm text-gray-500 mt-4">
                    For more information on billing, please visit the{' '}
                    <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">
                        official documentation
                    </a>.
                </p>
            </div>
        );
    }
    
    return (
        <div className="w-full max-w-7xl mx-auto flex flex-col h-full">
             <ClearProjectButton onClick={handleClear} />
            <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 mb-4">
                <ImagePanel
                    title="Source Image"
                    imageDataUrl={sourceFile ? `data:${sourceFile.mimeType};base64,${sourceFile.base64}` : null}
                    onFileChange={handleFileChange}
                />
                <VideoPanel title="Generated Video" videoUrl={videoBlobUrl} isLoading={isLoading} />
            </div>
            {error && (
                <div className="my-2 p-3 text-center bg-red-900/50 border border-red-700 text-red-300 rounded-lg">
                    {error}
                </div>
            )}
             <div className="sticky bottom-0 left-0 right-0 w-full bg-gray-800/80 backdrop-blur-lg border-t border-gray-700 p-4 rounded-t-lg">
                 <div className="flex flex-col md:flex-row items-center gap-4 max-w-5xl mx-auto">
                    <input
                        type="text"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Optional prompt, e.g., 'make the clouds move'"
                        className="w-full bg-gray-700 text-gray-200 placeholder-gray-400 border border-gray-600 rounded-md py-3 px-4 focus:ring-2 focus:ring-cyan-500 focus:outline-none transition duration-200"
                        disabled={isLoading}
                    />
                    <div className="flex items-center gap-4">
                        <VideoOptionsSelector
                            aspectRatio={aspectRatio}
                            setAspectRatio={setAspectRatio}
                            resolution={resolution}
                            setResolution={setResolution}
                            isDisabled={isLoading}
                        />
                        <button
                            onClick={handleSubmit}
                            disabled={isLoading || !sourceFile}
                            className="flex items-center justify-center px-6 py-3 font-semibold text-white bg-gradient-to-r from-purple-500 to-cyan-500 rounded-lg shadow-lg border-b-4 border-purple-700 hover:from-purple-600 hover:to-cyan-600 transform transition-all duration-200 active:translate-y-0.5 active:border-b-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Generating...' : (<><span className="text-xl mr-2">🚀</span><span>Generate</span></>)}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ImageToVideo;