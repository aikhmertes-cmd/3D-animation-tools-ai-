import React, { useState, useCallback } from 'react';
import { generateTrailerScript } from '../services/geminiService.ts';
import type { StoryScene } from '../services/geminiService.ts';
import StoryPanel from './StoryPanel.tsx';

type TrailerGenre = 'Action' | 'Comedy' | 'Drama' | 'Sci-Fi' | 'Horror' | 'Thriller' | 'Romance' | 'Fantasy';
type TrailerTone = 'Epic' | 'Humorous' | 'Tense' | 'Emotional' | 'Mysterious' | 'Inspiring';
type TrailerVisualStyle = 'Cinematic' | 'Gritty Realism' | 'Stylized & Vibrant' | 'Vintage Film' | 'Found Footage' | '80s Retro';

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

const MovieTrailerGenerator: React.FC = () => {
    const [title, setTitle] = useState('');
    const [synopsis, setSynopsis] = useState('');
    const [genre, setGenre] = useState<TrailerGenre>('Action');
    const [tone, setTone] = useState<TrailerTone>('Epic');
    const [visualStyle, setVisualStyle] = useState<TrailerVisualStyle>('Cinematic');
    const [sceneCount, setSceneCount] = useState(12);
    const [trailerScript, setTrailerScript] = useState<StoryScene[] | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const inputFieldClasses = "bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block w-full p-2.5 placeholder-gray-400";

    const handleSceneCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const count = parseInt(e.target.value, 10);
        if (isNaN(count)) {
             setSceneCount(1);
        } else if (count < 1) {
            setSceneCount(1);
        } else if (count > 100) {
            setSceneCount(100);
        } else {
            setSceneCount(count);
        }
    };

    const handleSubmit = useCallback(async () => {
        if (!synopsis.trim()) {
            setError('Please enter a synopsis for the trailer.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setTrailerScript(null);

        try {
            const result = await generateTrailerScript({
                title,
                synopsis,
                genre,
                tone,
                visualStyle,
                sceneCount,
            });
            setTrailerScript(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [title, synopsis, genre, tone, visualStyle, sceneCount]);
    
    const handleClear = () => {
        setTitle('');
        setSynopsis('');
        setGenre('Action');
        setTone('Epic');
        setVisualStyle('Cinematic');
        setSceneCount(12);
        setTrailerScript(null);
        setError(null);
    };

    const renderSelector = <T extends string>(
        label: string, 
        options: T[], 
        currentValue: T, 
        setter: (value: T) => void
    ) => (
         <div>
            <label className="block text-sm font-semibold mb-2 text-gray-300">{label}</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {options.map(option => (
                    <button 
                        key={option} 
                        onClick={() => setter(option)} 
                        disabled={isLoading}
                        className={`px-3 py-2 text-sm font-semibold rounded-md transition w-full disabled:opacity-50 ${currentValue === option ? 'bg-purple-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>
                        {option}
                    </button>
                ))}
            </div>
        </div>
    );

    return (
        <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700 space-y-6 h-fit">
                <ClearProjectButton onClick={handleClear} />
                <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">Movie Trailer Generator</h2>
                
                 <div>
                    <label htmlFor="title" className="block text-sm font-semibold mb-2 text-gray-300">Movie Title (Optional)</label>
                    <input
                        type="text"
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g., The Last Starlight"
                        className={inputFieldClasses}
                        disabled={isLoading}
                    />
                </div>
                
                 <div>
                    <label htmlFor="synopsis" className="block text-sm font-semibold mb-2 text-gray-300">Synopsis</label>
                    <textarea
                        id="synopsis"
                        value={synopsis}
                        onChange={(e) => setSynopsis(e.target.value)}
                        placeholder="Describe the plot of your movie. What is it about? Who are the main characters? What is the central conflict?"
                        className={`${inputFieldClasses} h-32 resize-y`}
                        disabled={isLoading}
                    />
                </div>
                
                 <div>
                    <label htmlFor="scenes" className="block text-sm font-semibold mb-2 text-gray-300">Number of Scenes</label>
                    <input
                        type="number"
                        id="scenes"
                        value={sceneCount}
                        onChange={handleSceneCountChange}
                        className={inputFieldClasses}
                        min="1"
                        max="100"
                        disabled={isLoading}
                    />
                     <p className="mt-2 text-xs text-gray-400">The trailer will be broken down into this many scenes. Max 100.</p>
                </div>

                {renderSelector<TrailerGenre>('Genre', ['Action', 'Comedy', 'Drama', 'Sci-Fi', 'Horror', 'Thriller', 'Romance', 'Fantasy'], genre, setGenre)}
                {renderSelector<TrailerTone>('Tone', ['Epic', 'Humorous', 'Tense', 'Emotional', 'Mysterious', 'Inspiring'], tone, setTone)}
                {renderSelector<TrailerVisualStyle>('Visual Style', ['Cinematic', 'Gritty Realism', 'Stylized & Vibrant', 'Vintage Film', 'Found Footage', '80s Retro'], visualStyle, setVisualStyle)}


                <button
                    onClick={handleSubmit}
                    disabled={isLoading || !synopsis.trim()}
                    className="w-full flex items-center justify-center px-6 py-3 font-semibold text-white bg-gradient-to-r from-purple-500 to-cyan-500 rounded-lg shadow-lg border-b-4 border-purple-700 hover:from-purple-600 hover:to-cyan-600 transform transition-all duration-200 active:translate-y-0.5 active:border-b-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? 'Generating Script...' : <><span className="text-xl mr-2">📜</span><span>Generate Trailer Script</span></>}
                </button>
            </div>
             <div className="w-full">
                {error && (
                    <div className="mb-4 p-3 w-full text-center bg-red-900/50 border border-red-700 text-red-300 rounded-lg">
                        {error}
                    </div>
                )}
                <StoryPanel
                    story={trailerScript}
                    isLoading={isLoading}
                />
            </div>
        </div>
    );
};

export default MovieTrailerGenerator;