// FIX: Removed `Dialog as ApiDialog` from import as it's not an exported member.
import { GoogleGenAI, Modality, GenerateContentResponse, Type } from "@google/genai";

// Store the key and the ai instance in a closure to act as a singleton
const state = {
    apiKey: null as string | null,
    ai: null as GoogleGenAI | null,
};

// New function to reset the singleton state
const resetServiceState = () => {
    state.apiKey = null;
    state.ai = null;
    console.log("Gemini service state has been reset.");
};

// New exported function to set the key
export const setApiKey = (key: string) => {
    if (key && key.trim()) {
        localStorage.setItem('gemini_api_key', key.trim());
    } else {
        localStorage.removeItem('gemini_api_key');
    }
    resetServiceState();
};

// New exported function to clear the key
export const clearApiKey = () => {
    localStorage.removeItem('gemini_api_key');
    resetServiceState();
};


async function getApiKey(): Promise<string> {
    if (state.apiKey) {
        return state.apiKey;
    }

    // Priority 1: Get key from local storage
    const storedApiKey = localStorage.getItem('gemini_api_key');
    if (storedApiKey) {
        console.log("Using API key from local storage.");
        state.apiKey = storedApiKey;
        return storedApiKey;
    }
    
    // Priority 2: Fetch from Netlify serverless function (for production)
    try {
        const response = await fetch('/.netlify/functions/getApiKey');
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to fetch API key from Netlify function: ${response.status} ${errorText}`);
        }
        const { apiKey } = await response.json();
        if (!apiKey) {
            throw new Error('API key is missing from serverless function response.');
        }
        state.apiKey = apiKey;
        return apiKey;
    } catch (e) {
        console.warn("Could not fetch API key from Netlify function. This is expected in a local development environment. Checking for fallback...", e);
        
        // Priority 3: Use hardcoded fallback key (for development)
        const fallbackApiKey = "AIzaSyBZmGQR12QhJ8cD4RSL1yOll9go2YHLxVg";
        
        if (!fallbackApiKey) {
            throw new Error("Could not retrieve an API key. Please set one manually using the 'API Key' button.");
        }

        console.warn("Using a hardcoded fallback API key. For best results, please set your own key.");
        state.apiKey = fallbackApiKey;
        return fallbackApiKey;
    }
}


async function getAi(): Promise<GoogleGenAI> {
    if (state.ai) {
        return state.ai;
    }
    const apiKey = await getApiKey();
    const ai = new GoogleGenAI({ apiKey });
    state.ai = ai;
    return ai;
}

const imageEditModel = 'gemini-2.5-flash-image';
const imageGenerateModel = 'imagen-4.0-generate-001';
const videoGenerateModel = 'veo-3.1-fast-generate-preview';
const textModel = 'gemini-2.5-flash';
const storyModel = 'gemini-2.5-pro';
const ttsModel = 'gemini-2.5-flash-preview-tts';


const handleImageResponse = (response: GenerateContentResponse): string => {
    const firstPart = response.candidates?.[0]?.content?.parts?.[0];

    if (firstPart && 'inlineData' in firstPart && firstPart.inlineData) {
        const generatedBase64 = firstPart.inlineData.data;
        const generatedMimeType = firstPart.inlineData.mimeType;
        return `data:${generatedMimeType};base64,${generatedBase64}`;
    } else {
        const textResponse = response.text?.trim();
        if (textResponse) {
            throw new Error(`Model returned a text response instead of an image: "${textResponse}"`);
        }
        throw new Error('No image data found in the API response.');
    }
};


export const editImage = async (base64ImageData: string, mimeType: string, prompt: string): Promise<string> => {
    try {
        const ai = await getAi();
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: imageEditModel,
            contents: {
                parts: [
                    {
                        inlineData: {
                            data: base64ImageData,
                            mimeType: mimeType,
                        },
                    },
                    {
                        text: prompt,
                    },
                ],
            },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });

        return handleImageResponse(response);

    } catch (error) {
        console.error('Error calling Gemini API for image editing:', error);
        throw new Error('Failed to edit image. Please check the console for more details.');
    }
};

export const mixImages = async (
    base64ImageA: string, mimeTypeA: string,
    base64ImageB: string, mimeTypeB: string,
    prompt: string
): Promise<string> => {
    try {
        const ai = await getAi();
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: imageEditModel, // 'gemini-2.5-flash-image'
            contents: {
                parts: [
                    {
                        inlineData: {
                            data: base64ImageA,
                            mimeType: mimeTypeA,
                        },
                    },
                    {
                        inlineData: {
                            data: base64ImageB,
                            mimeType: mimeTypeB,
                        },
                    },
                    {
                        text: prompt,
                    },
                ],
            },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });

        return handleImageResponse(response);

    } catch (error) {
        console.error('Error calling Gemini API for image mixing:', error);
        throw new Error('Failed to mix images. Please check the console for more details.');
    }
};

type ImageAspectRatio = '1:1' | '16:9' | '9:16' | '4:3' | '3:4';

export const generateImage = async (prompt: string, aspectRatio: ImageAspectRatio): Promise<string> => {
     try {
        const ai = await getAi();
        const response = await ai.models.generateImages({
            model: imageGenerateModel,
            prompt: prompt,
            config: {
                numberOfImages: 1,
                aspectRatio: aspectRatio,
                outputMimeType: 'image/png',
            },
        });

        const base64ImageBytes = response.generatedImages[0]?.image?.imageBytes;
        if (base64ImageBytes) {
            return `data:image/png;base64,${base64ImageBytes}`;
        } else {
            throw new Error('No image data found in the API response.');
        }

   } catch (error) {
       console.error('Error calling Gemini API for image generation:', error);
        if (error instanceof Error && error.message.includes('aspectRatio')) {
            throw new Error('Failed to generate image. The selected aspect ratio might not be supported by the model.');
       }
       throw new Error('Failed to generate image. Please check the console for more details.');
   }
};

export const generateImageForScene = async (prompt: string): Promise<string> => {
    // Default to 16:9 aspect ratio for story scenes, which is cinematic
    return generateImage(prompt, '16:9');
};


export const generatePromptFromImage = async (base64ImageData: string, mimeType: string): Promise<string> => {
    try {
        const ai = await getAi();
        const response = await ai.models.generateContent({
            model: textModel,
            contents: {
                parts: [
                    {
                        inlineData: {
                            data: base64ImageData,
                            mimeType: mimeType,
                        },
                    },
                    {
                        text: "Describe this image in detail. Create a descriptive prompt that could be used to generate a similar image with a text-to-image AI.",
                    },
                ],
            },
        });
        
        const text = response.text;
        if (text) {
            return text;
        } else {
            throw new Error('The model did not return a text response.');
        }

    } catch (error) {
        console.error('Error calling Gemini API for prompt generation:', error);
        throw new Error('Failed to generate prompt from image. Please check the console for more details.');
    }
};

export const generateVideoPromptFromImage = async (base64ImageData: string, mimeType: string): Promise<string> => {
    try {
        const ai = await getAi();
        const response = await ai.models.generateContent({
            model: textModel,
            contents: {
                parts: [
                    {
                        inlineData: {
                            data: base64ImageData,
                            mimeType: mimeType,
                        },
                    },
                    {
                        text: "Analyze this image and generate a descriptive prompt for a Text-to-Video AI generator. The prompt should capture the scene, characters, and mood, while also suggesting potential motion, camera movements, and actions to bring the static image to life as a short video clip.",
                    },
                ],
            },
        });
        
        const text = response.text;
        if (text) {
            return text;
        } else {
            throw new Error('The model did not return a text response.');
        }

    } catch (error) {
        console.error('Error calling Gemini API for video prompt generation:', error);
        throw new Error('Failed to generate video prompt from image. Please check the console for more details.');
    }
};

type VideoAspectRatio = '16:9' | '9:16';
type Resolution = '720p' | '1080p';

interface VideoGenerationOptions {
    prompt: string;
    aspectRatio: VideoAspectRatio;
    resolution: Resolution;
    image?: {
        base64: string;
        mimeType: string;
    };
}

export const generateVideo = async (options: VideoGenerationOptions): Promise<Blob> => {
    const API_KEY = await getApiKey();
    // Per guideline: Create a new instance right before making an API call
    const videoAI = new GoogleGenAI({ apiKey: API_KEY });

    try {
        const payload: any = {
            model: videoGenerateModel,
            prompt: options.prompt,
            config: {
                numberOfVideos: 1,
                resolution: options.resolution,
                aspectRatio: options.aspectRatio,
            },
        };

        if (options.image) {
            payload.image = {
                imageBytes: options.image.base64,
                mimeType: options.image.mimeType,
            };
        }
        
        let operation = await videoAI.models.generateVideos(payload);
        
        // Poll for the result
        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds between checks
            operation = await videoAI.operations.getVideosOperation({ operation: operation });
        }

        const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;

        if (!downloadLink) {
            throw new Error('Video generation completed, but no download link was provided.');
        }

        // The response.body contains the MP4 bytes. You must append an API key when fetching from the download link.
        const videoResponse = await fetch(`${downloadLink}&key=${API_KEY}`);
        
        if (!videoResponse.ok) {
            // This error check is important for the API key selection flow
            if (videoResponse.status === 404 || videoResponse.status === 400) {
                 throw new Error('Requested entity was not found. Your API key might be invalid or lack the necessary permissions. Please select a valid key.');
            }
            throw new Error(`Failed to download the generated video. Status: ${videoResponse.statusText}`);
        }

        return videoResponse.blob();

    } catch (error) {
        console.error('Error calling Gemini API for video generation:', error);
        // Propagate specific error messages for better UX
        if (error instanceof Error && error.message.includes('not found')) {
            throw new Error('Requested entity was not found. Your API key might be invalid or lack the necessary permissions. Please select a valid key.');
        }
        throw new Error('Failed to generate video. Please check the console for more details.');
    }
};


export interface VideoIdea {
    title: string;
    summary: string;
    sampleScriptLine: string;
}

export interface Dialog {
    character: string;
    line: string;
}

export interface StoryScene {
    scene_number: number;
    slug: string;
    title: string;
    prompt: string;
    camera: string;
    sfx: string[];
    bgm_track: string;
    bgm_timing: string;
    scene_description: {
        line: string;
        timing: string;
        tone: string;
    };
    dialog: Dialog[];
    metadata: {
        aspect_ratio: string;
        tone: string;
        characters: string[];
    };
}

export interface Character {
    name: string;
    gender: string;
    age: string;
    description: string;
}

interface StoryOptions {
    topic?: string;
    genderFocus?: string;
    pastedStory?: string;
    smartThinking?: boolean;
    style: string;
    sceneCount: number;
    characters: Character[];
}

export const generateStory = async (options: StoryOptions): Promise<StoryScene[]> => {
    const { topic, genderFocus, pastedStory, style, sceneCount, characters, smartThinking } = options;

    const mainCharacterName = characters.length > 0 ? characters[0].name : null;
    const mainCharacterInstruction = mainCharacterName ? `The main character is ${mainCharacterName}. Their name MUST be included in the visual 'prompt' for EVERY scene.` : '';

    const characterDetails = "The story must feature the following characters with these specific details:\n" +
        characters.map(c =>
            `- Name: ${c.name}\n  - Gender: ${c.gender}\n  - Age: ${c.age}\n  - Description: ${c.description}`
        ).join('\n\n');
        
    let genderFocusDetails = genderFocus ? ` The story should have a gender focus on: ${genderFocus}.` : '';

    if (genderFocus === 'Action Heroine') {
        genderFocusDetails = `The protagonist MUST be a strong female character (an 'Action Heroine'). She must be the primary actor in conflict and action scenes. Describe her fighting style and prowess in detail. Show her overcoming obstacles through both cleverness and physical combat. She is a clever problem-solver and may defy traditional gender expectations or roles (for example, by disguising herself or taking on a role typically reserved for men). Ensure she is the central figure driving the plot forward through her actions.`;
    }

    let systemInstruction = '';
    let userPrompt = '';

    const criticalRules = `
CRITICAL RULES:
1.  For EVERY single scene you generate, the "prompt" field MUST explicitly describe the visuals using the required artistic style: **${style}**. This is non-negotiable.
2.  You MUST strictly adhere to the gender specified for each character throughout the entire story. Do not change a character's gender under any circumstances.
3.  For any scenes involving action, fighting, or combat, describe the sequences with vivid detail. Focus on dynamic movements, specific actions (parrying, dodging, striking), the impact of blows, and the characters' expressions and determination during the fight. Make the combat exciting and clear.
4.  ${mainCharacterInstruction}
    `;

    if (pastedStory) {
        systemInstruction = `You are a creative scriptwriter who transforms a given story into a detailed scene-by-scene script for video generation.
        Your task is to take the user's provided story and break it down into exactly ${sceneCount} scenes.
        ${criticalRules}
        The final output MUST be a valid JSON array of objects, where each object represents a scene with a specific, detailed structure.
        Each scene object must contain the following keys: "scene_number", "slug", "title", "prompt", "camera", "sfx", "bgm_track", "bgm_timing", "scene_description", "dialog", and "metadata".
        - "sfx": An array of strings describing sound effects.
        - "scene_description": An object with "line", "timing", and "tone".
        - "metadata": An object with "aspect_ratio" (always "16:9"), "tone", and a list of "characters" in the scene.
        Do not include any introductory text, markdown formatting, or anything outside of the JSON array.`;
        userPrompt = `Here is the story to transform: """${pastedStory}"""\n\n${characterDetails}`;
    } else {
        systemInstruction = `You are a creative storyteller and scriptwriter for video generation. 
        Your task is to generate a story based on the user's request, formatted as a detailed scene-by-scene script.
        The story must be broken down into exactly ${sceneCount} scenes.
        ${criticalRules}
        The final output MUST be a valid JSON array of objects, where each object represents a scene with a specific, detailed structure.
        Each scene object must contain the following keys: "scene_number", "slug", "title", "prompt", "camera", "sfx", "bgm_track", "bgm_timing", "scene_description", "dialog", and "metadata".
        - "sfx": An array of strings describing sound effects.
        - "scene_description": An object with "line", "timing", and "tone".
        - "metadata": An object with "aspect_ratio" (always "16:9"), "tone", and a list of "characters" in the scene.
        Do not include any introductory text, markdown formatting, or anything outside of the JSON array.`;
        userPrompt = `Generate a story about: "${topic}".\n\n${characterDetails}\n\n${genderFocusDetails}`;
    }

    const modelConfig: any = {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    scene_number: { type: Type.NUMBER, description: "The scene number, starting from 1." },
                    slug: { type: Type.STRING, description: "A short, URL-friendly slug for the scene (e.g., 'playground')." },
                    title: { type: Type.STRING, description: "A short title for the scene." },
                    prompt: { type: Type.STRING, description: "A detailed visual prompt for an AI generator that MUST incorporate the overall artistic style." },
                    camera: { type: Type.STRING, description: "Camera direction (e.g., 'aerial; composition: thirds')." },
                    sfx: { type: Type.ARRAY, items: { type: Type.STRING }, description: "An array of sound effects for the scene." },
                    bgm_track: { type: Type.STRING, description: "Name of the background music track." },
                    bgm_timing: { type: Type.STRING, description: "Timing for the background music (e.g., '1s-7.5s')." },
                    scene_description: {
                        type: Type.OBJECT,
                        properties: {
                            line: { type: Type.STRING, description: "A descriptive line for the scene." },
                            timing: { type: Type.STRING, description: "Timing for this description line." },
                            tone: { type: Type.STRING, description: "The tone of the scene (e.g., 'cheerful, bright')." },
                        },
                        required: ['line', 'timing', 'tone']
                    },
                    dialog: {
                        type: Type.ARRAY,
                        description: "An array for dialog objects (can be empty).",
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                character: { type: Type.STRING, description: "The character speaking the line." },
                                line: { type: Type.STRING, description: "The content of the dialogue." },
                            },
                            required: ['character', 'line'],
                        },
                    },
                    metadata: {
                        type: Type.OBJECT,
                        properties: {
                            aspect_ratio: { type: Type.STRING, description: "The aspect ratio, should be '16:9'." },
                            tone: { type: Type.STRING, description: "The overall tone of the scene." },
                            characters: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of characters present in the scene." },
                        },
                        required: ['aspect_ratio', 'tone', 'characters']
                    }
                },
                required: ['scene_number', 'slug', 'title', 'prompt', 'camera', 'sfx', 'bgm_track', 'bgm_timing', 'scene_description', 'dialog', 'metadata'],
            },
        },
    };

    if (smartThinking) {
        modelConfig.thinkingConfig = { thinkingBudget: 32768 }; // Max budget for gemini-2.5-pro
    }

    try {
        const ai = await getAi();
        const response = await ai.models.generateContent({
            model: storyModel,
            contents: userPrompt,
            config: modelConfig,
        });

        const jsonStr = response.text.trim();
        const story = JSON.parse(jsonStr) as StoryScene[];
        
        // Ensure the story has the correct number of scenes
        if (story.length !== sceneCount) {
             console.warn(`Model returned ${story.length} scenes, but ${sceneCount} were requested. Returning what was generated.`);
        }

        return story;

    } catch (error) {
        console.error('Error calling Gemini API for story generation:', error);
        if (error instanceof Error && error.message.includes('JSON')) {
             throw new Error('Failed to generate story. The model returned an invalid JSON format. Please try again.');
        }
        throw new Error('Failed to generate story. Please check the console for more details.');
    }
};

export interface LyricsResponse {
    songTitle: string;
    songLyrics: string;
}

interface LyricsOptions {
    topic: string;
    characters: Character[];
    audience: 'kids' | 'adults';
}

export const generateLyrics = async (options: LyricsOptions): Promise<LyricsResponse> => {
    const { topic, characters, audience } = options;

    let characterDetails = '';
    if (characters && characters.length > 0) {
        characterDetails = "The song should be inspired by the following characters. Make the song lively and reflect their personalities:\n" +
            characters.map(c =>
                `- Name: ${c.name}\n  - Gender: ${c.gender}\n  - Age: ${c.age}\n  - Description: ${c.description}`
            ).join('\n\n');
    }

    const audiencePrompt = audience === 'kids'
        ? 'You are a creative songwriter for young children (ages 3-7). Your task is to generate a simple, positive song.'
        : 'You are a professional lyricist for an adult audience. Your task is to generate a song with more complex themes, deeper vocabulary, and emotional depth.';

    const systemInstruction = `${audiencePrompt}
    The final output MUST be a valid JSON object. This object must contain two keys: "songTitle" and "songLyrics".
    - "songTitle": A fun, catchy title for the song.
    - "songLyrics": The lyrics for the song. The lyrics MUST be structured with clear headings like [Verse 1], [Chorus], and [Outro]. You MUST also include a line for musical direction in parentheses, like (Upbeat pop tempo). Make it look like a real song sheet.
    Do not include any introductory text, markdown formatting, or anything outside of the JSON object.`;

    const userPrompt = `Generate a song about: "${topic}".\n\n${characterDetails}`;

    const schema = {
        type: Type.OBJECT,
        properties: {
            songTitle: { type: Type.STRING, description: "A catchy title for the song." },
            songLyrics: { type: Type.STRING, description: "Lyrics for the song, structured with headings like [Verse] and [Chorus]." },
        },
        required: ['songTitle', 'songLyrics']
    };

    try {
        const ai = await getAi();
        const response = await ai.models.generateContent({
            model: textModel,
            contents: userPrompt,
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: schema,
            },
        });

        const jsonStr = response.text.trim();
        const result = JSON.parse(jsonStr) as LyricsResponse;
        
        return result;

    } catch (error) {
        console.error('Error calling Gemini API for lyrics generation:', error);
        if (error instanceof Error && error.message.includes('JSON')) {
             throw new Error('Failed to generate song. The model returned an invalid JSON format. Please try again.');
        }
        throw new Error('Failed to generate lyrics. Please check the console for more details.');
    }
};

export interface LyricScene {
    scene_number: number;
    title: string;
    prompt: string;
}

export const generateScenesFromLyrics = async (lyrics: string, style: string): Promise<LyricScene[]> => {
    const systemInstruction = `You are a music video director. Your task is to analyze the provided song lyrics or story text and generate a series of visual scenes for an AI image/video generator.
The required visual style for EVERY scene is: **${style}**.
You MUST ensure that the 'prompt' for each and every scene explicitly incorporates and describes this style. Do not deviate from this style for any scene.
The output must be a valid JSON array of objects. Do not include any other text or markdown.`;

    const userPrompt = `Here are the lyrics/story:\n\n"""\n${lyrics}\n"""`;

    const schema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                scene_number: { type: Type.NUMBER, description: "The sequential number of the scene." },
                title: { type: Type.STRING, description: "A short, descriptive title for the scene." },
                prompt: { type: Type.STRING, description: "A detailed visual prompt for an AI generator for this scene." }
            },
            required: ['scene_number', 'title', 'prompt']
        }
    };
    
    try {
        const ai = await getAi();
        const response = await ai.models.generateContent({
            model: storyModel, // Use pro model for better creative interpretation
            contents: userPrompt,
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: schema,
            },
        });
        const jsonStr = response.text.trim();
        return JSON.parse(jsonStr) as LyricScene[];
    } catch (error) {
        console.error('Error calling Gemini API for scene generation from lyrics:', error);
        throw new Error('Failed to generate scenes from lyrics. The model may have returned an invalid format.');
    }
};

export interface SimpleStoryResponse {
    storyTitle: string;
    storyContent: string;
}

interface SimpleStoryOptions {
    topic: string;
    characters: Character[];
    image?: {
        base64: string;
        mimeType: string;
    };
}

export const generateSimpleStory = async (options: SimpleStoryOptions): Promise<SimpleStoryResponse> => {
    const { topic, characters, image } = options;

    let characterDetails = "The story should feature these characters:\n" +
        characters.map(c => `- Name: ${c.name}, Gender: ${c.gender}, Age: ${c.age}, Description: ${c.description}`).join('\n');

    const systemInstruction = `You are a creative storyteller for young children. Generate a simple, positive, short story.
    The final output MUST be a valid JSON object with "storyTitle" and "storyContent" keys.
    The story content should be a single block of text, using newline characters for paragraphs.
    Do not include any introductory text, markdown formatting, or anything outside of the JSON object.`;

    let userPrompt = `Generate a short story about: "${topic}".\n\n${characterDetails}`;
    
    const contents: { parts: any[] } = {
        parts: []
    };

    if (image) {
        userPrompt += "\n\nUse the provided image as the primary inspiration for the story's setting, characters, and events.";
        contents.parts.push({
            inlineData: {
                data: image.base64,
                mimeType: image.mimeType,
            },
        });
    }

    contents.parts.push({ text: userPrompt });

    const schema = {
        type: Type.OBJECT,
        properties: {
            storyTitle: { type: Type.STRING, description: "A catchy title for the story." },
            storyContent: { type: Type.STRING, description: "The content of the story, with paragraphs separated by newlines." },
        },
        required: ['storyTitle', 'storyContent']
    };

    try {
        const ai = await getAi();
        const response = await ai.models.generateContent({
            model: textModel,
            contents: { parts: contents.parts },
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: schema,
            },
        });

        const jsonStr = response.text.trim();
        return JSON.parse(jsonStr) as SimpleStoryResponse;
    } catch (error) {
        console.error('Error calling Gemini API for simple story generation:', error);
        if (error instanceof Error && error.message.includes('JSON')) {
             throw new Error('Failed to generate story. The model returned an invalid JSON format. Please try again.');
        }
        throw new Error('Failed to generate story. Please check the console for more details.');
    }
};



export interface TrailerScriptOptions {
    title?: string;
    genre: string;
    synopsis: string;
    tone: string;
    visualStyle: string;
    sceneCount: number;
    noVoiceover?: boolean;
    noSubtitle?: boolean;
    focusOnCharacters?: boolean;
}

export const generateTrailerScript = async (options: TrailerScriptOptions): Promise<StoryScene[]> => {
    const { title, genre, synopsis, tone, visualStyle, sceneCount, noVoiceover, noSubtitle, focusOnCharacters } = options;
    
    const additionalRules: string[] = [];
    if (noVoiceover) {
        additionalRules.push('- The "scene_description.line" property for the narrator\'s voice-over MUST be an empty string for all scenes.');
    }
    if (noSubtitle) {
        additionalRules.push('- The "dialog" array MUST NOT contain any objects where the "character" is "ON-SCREEN TEXT". Only include actual character dialogue if present.');
    }
    if (focusOnCharacters) {
        additionalRules.push('- CRITICAL RULE: Put a strong focus on the characters and their faces in every single shot to ensure they are clear and recognizable. The visual prompts ("prompt" property) MUST describe characters in a way that helps an AI retain their appearance across different scenes. Use close-ups and medium shots where appropriate.');
    }
    const rulesText = additionalRules.join('\n');

    const systemInstruction = `You are an expert movie trailer editor and scriptwriter. Your task is to create a script for a compelling movie trailer based on the user's input.
        The script must be broken down into exactly ${sceneCount} scenes.
        ${rulesText ? `\nFollow these additional rules precisely:\n${rulesText}\n` : ''}
        The final output MUST be a valid JSON array of objects, where each object represents a scene with the exact structure of the StoryScene interface.
        - "scene_number": The sequence number of the shot.
        - "slug": A short slug for the scene (e.g., 'reveal-of-hero').
        - "title": A short, impactful title for the scene (e.g., 'A Glimmer of Hope').
        - "prompt": A detailed visual prompt for an AI video generator. Describe the shot, characters, action, and setting with cinematic detail. The user will specify a visual style that you must adhere to for these prompts.
        - "camera": Suggested camera movement (e.g., 'Slow zoom in', 'fast-paced montage cuts').
        - "sfx": An array of key sound effects.
        - "bgm_track": A description of the background music for this scene (e.g., 'Tense, building orchestral score').
        - "bgm_timing": e.g., '0s-5s'.
        - "scene_description": This object should contain the voice-over narration. The "line" property is the narrator's line, and "tone" should describe the delivery (e.g., 'Gravelly, serious').
        - "dialog": Use this for on-screen text. For each text element, create an object with "character": "ON-SCREEN TEXT" and "line": "THE TEXT TO DISPLAY". If there is character dialog, include it normally.
        - "metadata": Should include "aspect_ratio": "16:9", the "tone" of the scene, and a list of "characters".
        Do not include any introductory text, markdown formatting, or anything outside of the JSON array.`;

    const userPrompt = `Generate a trailer script for a ${genre} movie with a ${tone} tone. The overall visual style for the trailer should be: **${visualStyle}**. Make sure the 'prompt' for each scene reflects this style.
    ${title ? `The movie is titled "${title}".` : ""}
    Synopsis: """${synopsis}"""`;
    
    const storySchema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                scene_number: { type: Type.NUMBER },
                slug: { type: Type.STRING },
                title: { type: Type.STRING },
                prompt: { type: Type.STRING },
                camera: { type: Type.STRING },
                sfx: { type: Type.ARRAY, items: { type: Type.STRING } },
                bgm_track: { type: Type.STRING },
                bgm_timing: { type: Type.STRING },
                scene_description: {
                    type: Type.OBJECT,
                    properties: {
                        line: { type: Type.STRING },
                        timing: { type: Type.STRING },
                        tone: { type: Type.STRING },
                    },
                    required: ['line', 'timing', 'tone']
                },
                dialog: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            character: { type: Type.STRING },
                            line: { type: Type.STRING },
                        },
                        required: ['character', 'line'],
                    },
                },
                metadata: {
                    type: Type.OBJECT,
                    properties: {
                        aspect_ratio: { type: Type.STRING },
                        tone: { type: Type.STRING },
                        characters: { type: Type.ARRAY, items: { type: Type.STRING } },
                    },
                    required: ['aspect_ratio', 'tone', 'characters']
                }
            },
            required: ['scene_number', 'slug', 'title', 'prompt', 'camera', 'sfx', 'bgm_track', 'bgm_timing', 'scene_description', 'dialog', 'metadata'],
        },
    };

    try {
        const ai = await getAi();
        const response = await ai.models.generateContent({
            model: storyModel, // Using gemini-2.5-pro for high quality creative writing
            contents: userPrompt,
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: storySchema,
                thinkingConfig: { thinkingBudget: 32768 }, // Use smart thinking for better structure
            },
        });

        const jsonStr = response.text.trim();
        const script = JSON.parse(jsonStr) as StoryScene[];
        
        if (script.length !== sceneCount) {
            console.warn(`Model returned ${script.length} scenes, but ${sceneCount} were requested. Returning what was generated.`);
        }

        return script;


    } catch (error) {
        console.error('Error calling Gemini API for trailer script generation:', error);
        if (error instanceof Error && error.message.includes('JSON')) {
             throw new Error('Failed to generate trailer script. The model returned an invalid JSON format. Please try again.');
        }
        throw new Error('Failed to generate trailer script. Please check the console for more details.');
    }
};


export interface AnalyzedCharacter {
    name: string;
    gender: string;
}

export const analyzeStoryForCharacters = async (storyText: string): Promise<AnalyzedCharacter[]> => {
    try {
        const ai = await getAi();
        const response = await ai.models.generateContent({
            model: textModel, // Use the faster model for analysis
            contents: `Analyze the following story text. Identify the main characters and infer their gender. Return the result as a JSON array of objects, where each object has a 'name' and a 'gender' key. For example: [{"name": "Alice", "gender": "Female"}]. Only return the JSON array. Story: """${storyText}"""`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            name: { type: Type.STRING, description: "The character's name." },
                            gender: { type: Type.STRING, description: "The inferred gender of the character." },
                        },
                        required: ['name', 'gender'],
                    },
                },
            },
        });

        const jsonStr = response.text.trim();
        return JSON.parse(jsonStr) as AnalyzedCharacter[];
    } catch (error) {
        console.error('Error calling Gemini API for character analysis:', error);
        throw new Error('Failed to analyze the story for characters. The format might be complex or the story too short.');
    }
};

export const generateCharacters = async (topic: string, characterCount: number): Promise<Character[]> => {
    const systemInstruction = `You are a creative character designer. Based on a story topic, you will generate a specified number of detailed characters. The output must be a valid JSON array of objects.`;
    const userPrompt = `Generate ${characterCount} unique and compelling characters for a story about: "${topic}". For each character, provide a name, gender, a descriptive age (e.g., "early 20s", "ancient"), and a detailed one-paragraph description of their personality, appearance, and motivations.`;
    
    const schema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                name: { type: Type.STRING, description: "The character's name." },
                gender: { type: Type.STRING, description: "The character's gender." },
                age: { type: Type.STRING, description: "A descriptive age for the character." },
                description: { type: Type.STRING, description: "A detailed description of the character." },
            },
            required: ['name', 'gender', 'age', 'description'],
        },
    };

    try {
        const ai = await getAi();
        const response = await ai.models.generateContent({
            model: storyModel, // Use gemini-2.5-pro for creativity
            contents: userPrompt,
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: schema,
                thinkingConfig: { thinkingBudget: 32768 },
            },
        });
        const jsonStr = response.text.trim();
        return JSON.parse(jsonStr) as Character[];
    } catch (error) {
        console.error('Error calling Gemini API for character generation:', error);
        throw new Error('Failed to generate characters. Please check the console for details.');
    }
};

export const generateKidsCharacters = async (topic: string): Promise<Character[]> => {
    const systemInstruction = `You are a creative character designer for children's songs. Based on a song topic, you will generate 2 cute and simple characters. The output must be a valid JSON array of objects.`;
    const userPrompt = `Generate 2 unique and simple characters for a kids' song about: "${topic}". For each character, provide a name, gender, a simple age (e.g., "a little boy", "a friendly bear"), and a one-sentence description of their personality.`;

    const schema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                name: { type: Type.STRING, description: "The character's name." },
                gender: { type: Type.STRING, description: "The character's gender (e.g., Male, Female, Animal)." },
                age: { type: Type.STRING, description: "A simple, descriptive age for the character." },
                description: { type: Type.STRING, description: "A one-sentence description of the character." },
            },
            required: ['name', 'gender', 'age', 'description'],
        },
    };

    try {
        const ai = await getAi();
        const response = await ai.models.generateContent({
            model: textModel, // Use flash model for speed
            contents: userPrompt,
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: schema,
            },
        });
        const jsonStr = response.text.trim();
        return JSON.parse(jsonStr) as Character[];
    } catch (error) {
        console.error('Error calling Gemini API for kids character generation:', error);
        throw new Error('Failed to generate characters for the song. Please try again.');
    }
};


export interface StoryIdea {
    title: string;
    summary: string;
}

export const generateStoryIdeas = async (storyType: string, smartThinking: boolean): Promise<StoryIdea[]> => {
    const modelToUse = smartThinking ? storyModel : textModel;
    const modelConfig: any = {
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING, description: "The title of the story idea." },
                    summary: { type: Type.STRING, description: "A one-paragraph summary of the story idea." },
                },
                required: ['title', 'summary'],
            },
        },
    };

    if (smartThinking) {
        modelConfig.thinkingConfig = { thinkingBudget: 32768 }; // Max budget for gemini-2.5-pro
    }
    
    try {
        const ai = await getAi();
        const response = await ai.models.generateContent({
            model: modelToUse,
            contents: `Generate 5 unique and creative short story ideas for children. The theme for the stories is "${storyType}". Each story idea should include a title and a one-paragraph summary. Return the result as a valid JSON array of objects, where each object has a "title" and a "summary" key. Do not include any other text or markdown.`,
            config: modelConfig,
        });

        const jsonStr = response.text.trim();
        return JSON.parse(jsonStr) as StoryIdea[];

    } catch (error) {
        console.error('Error calling Gemini API for story ideas:', error);
        throw new Error('Failed to generate story ideas. Please try a different theme.');
    }
};


export const generateNarration = async (text: string): Promise<string> => {
    try {
        const ai = await getAi();
        const response = await ai.models.generateContent({
            model: ttsModel,
            contents: [{ parts: [{ text: `Say with a clear, narrative tone: ${text}` }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: 'Kore' }, // A neutral, pleasant voice for narration
                    },
                },
            },
        });
        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!base64Audio) {
            throw new Error('No audio data found in the API response.');
        }
        return base64Audio;
    } catch (error) {
        console.error('Error calling Gemini API for narration generation:', error);
        throw new Error('Failed to generate narration audio. Please check the console for details.');
    }
};

export type PrebuiltVoice = 'Kore' | 'Puck' | 'Charon' | 'Fenrir' | 'Zephyr';

export const generateVoiceover = async (text: string, language: string, voiceName: PrebuiltVoice = 'Kore', emotion: string = 'in a clear, narrative tone', characterDescription?: string): Promise<string> => {
    let instruction = '';

    if (characterDescription) {
        // e.g., "like a gentle, old grandmother"
        instruction += `speaking ${characterDescription} `;
    }

    // e.g., "in a sad tone"
    instruction += `${emotion} `;

    const prompt = `Say ${instruction.trim()} in ${language}: ${text}`;
    try {
        const ai = await getAi();
        const response = await ai.models.generateContent({
            model: ttsModel,
            contents: [{ parts: [{ text: prompt }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: voiceName },
                    },
                },
            },
        });
        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!base64Audio) {
            throw new Error('No audio data found in the API response.');
        }
        return base64Audio;
    } catch (error) {
        console.error('Error calling Gemini API for voiceover generation:', error);
        throw new Error('Failed to generate voiceover audio. Please check the console for details.');
    }
};

export interface SpeakerConfig {
    speaker: string;
    voiceName: PrebuiltVoice;
}

// FIX: Changed `ApiDialog[]` to `Dialog[]` to use the local interface.
export const generateDialog = async (dialog: Dialog[], speakerConfigs: SpeakerConfig[]): Promise<string> => {
    // Per guidelines, multi-speaker TTS only supports exactly 2 speakers.
    if (speakerConfigs.length !== 2) {
        throw new Error("Multi-speaker TTS currently supports exactly 2 speakers.");
    }
    
    // FIX: Add check for empty dialog to prevent an invalid prompt.
    if (!dialog || dialog.length === 0) {
        throw new Error("Cannot generate dialog audio from an empty script. The AI may have failed to match character names.");
    }

    // FIX: Correctly generate the list of unique speakers for the prompt.
    const uniqueSpeakers = [...new Set(dialog.map(d => d.character))];
    const speakerList = uniqueSpeakers.join(' and ');

    const prompt = `TTS the following conversation between ${speakerList}:\n` +
                   dialog.map(d => `${d.character}: ${d.line}`).join('\n');
    
    try {
        const ai = await getAi();
        const response = await ai.models.generateContent({
            model: ttsModel,
            contents: [{ parts: [{ text: prompt }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    multiSpeakerVoiceConfig: {
                        speakerVoiceConfigs: speakerConfigs.map(sc => ({
                            speaker: sc.speaker,
                            voiceConfig: {
                                prebuiltVoiceConfig: { voiceName: sc.voiceName }
                            }
                        }))
                    }
                }
            }
        });

        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!base64Audio) {
            throw new Error('No audio data found in the API response.');
        }
        return base64Audio;
    } catch (error) {
        console.error('Error calling Gemini API for dialog generation:', error);
        throw new Error('Failed to generate dialog audio. Please check the console for details.');
    }
};

export type WritingMode = 'continue' | 'refine';
    
export interface WritingAssistanceOptions {
    mode: WritingMode;
    story: string; // The full story for 'continue', or the selected text for 'refine'
    instruction: string;
    genre: string;
    tone: string;
    sceneCount?: number;
}

export const assistWriting = async (options: WritingAssistanceOptions): Promise<string> => {
    const { mode, story, instruction, genre, tone, sceneCount } = options;
    
    let systemInstruction = '';
    let userPrompt = '';

    if (mode === 'continue') {
        systemInstruction = 'You are a collaborative writing assistant. Your goal is to help the user write their story by continuing from where they left off. Write fluently and naturally, following all formatting instructions precisely.';
        
        let sceneInstruction = '';
        if (sceneCount && sceneCount > 0) {
            if (sceneCount === 1) {
                sceneInstruction = `Your response must be structured as a single scene, approximately 600 words long. Start the scene with a clear heading: "SCENE 1".`;
            } else {
                sceneInstruction = `Your response must be structured into exactly ${sceneCount} distinct scenes. Each scene must start with a clear heading on its own line, like "SCENE 1", "SCENE 2", and so on, up to "SCENE ${sceneCount}".`;
            }
        }

        userPrompt = `The story is a ${genre} with a ${tone} tone. Here is the story so far:\n\n"""\n${story}\n"""\n\nPlease continue writing the story based on this instruction: "${instruction}".\n\n${sceneInstruction}\n\nReturn only the new scene(s), without repeating the previous text or adding any commentary.`;
    } else { // 'refine' mode
        systemInstruction = 'You are a collaborative writing assistant and expert editor. Your goal is to help the user improve their writing by refining a selected piece of text.';
        userPrompt = `I am writing a ${genre} story with a ${tone} tone. Please refine the following selected text from my story:\n\n"""\n${story}\n"""\n\nPlease follow this instruction: "${instruction}".\n\nReturn only the refined text, without any extra commentary.`;
    }

    try {
        const ai = await getAi();
        const response = await ai.models.generateContent({
            model: textModel, // gemini-2.5-flash
            contents: userPrompt,
            config: {
                systemInstruction,
            },
        });

        const text = response.text;
        if (text) {
            return text.trim();
        } else {
            throw new Error('The model did not return a text response.');
        }
    } catch (error) {
        console.error('Error calling Gemini API for writing assistance:', error);
        throw new Error('Failed to get writing assistance. Please check the console for more details.');
    }
};

export const extendStoryWithImage = async (storyContext: string, imageBase64: string, imageMimeType: string): Promise<string> => {
    const userPrompt = `Given the story so far and this image which vividly depicts the most recent scene, continue writing the story. The image should heavily influence the next events.
    
    Story so far:
    """
    ${storyContext}
    """
    
    Your response should start directly with the new scene(s), formatted with "SCENE X" headers. Continue the narrative flow.`;

    try {
        const ai = await getAi();
        const response = await ai.models.generateContent({
            model: textModel, // gemini-2.5-flash
            contents: {
                parts: [
                    {
                        text: userPrompt,
                    },
                    {
                        inlineData: {
                            data: imageBase64,
                            mimeType: imageMimeType,
                        },
                    },
                ],
            },
        });

        const text = response.text;
        if (text) {
            return text.trim();
        } else {
            throw new Error('The model did not return a text response.');
        }
    } catch (error) {
        console.error('Error calling Gemini API for story extension with image:', error);
        throw new Error('Failed to extend story with image. Please check the console for more details.');
    }
};


export interface OutlineChapter {
    chapter: number;
    title: string;
    summary: string;
}

export interface ScriptOutline {
    outline: OutlineChapter[];
}

export const generateScriptOutline = async (story: string, prompt: string, language: 'en' | 'km'): Promise<ScriptOutline> => {
    const langInstruction = language === 'km' 
        ? 'You MUST provide the entire response in Khmer (Cambodian language). All chapter titles and summaries must be in Khmer.'
        : 'You MUST provide the entire response in English.';
    
    const systemInstruction = `You are a professional script editor and story analyst. Your task is to read a full story provided by the user and generate a structured script outline based on their specific prompt. The outline must be broken down into chapters. You must adhere to the JSON schema provided and respond ONLY with the valid JSON object. ${langInstruction}`;

    const userPrompt = `Here is the full story: """${story}"""\n\nHere is my request for the outline: "${prompt}"`;

    const schema = {
        type: Type.OBJECT,
        properties: {
            outline: {
                type: Type.ARRAY,
                description: 'An array of chapter objects that form the script outline.',
                items: {
                    type: Type.OBJECT,
                    properties: {
                        chapter: { type: Type.NUMBER, description: 'The chapter number, starting from 1.' },
                        title: { type: Type.STRING, description: 'The title of the chapter.' },
                        summary: { type: Type.STRING, description: 'A detailed summary of the events, characters, and plot points in this chapter.' },
                    },
                    required: ['chapter', 'title', 'summary'],
                },
            },
        },
        required: ['outline'],
    };

    try {
        const ai = await getAi();
        const response = await ai.models.generateContent({
            model: storyModel, // gemini-2.5-pro for better structure and understanding
            contents: userPrompt,
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: schema,
                thinkingConfig: { thinkingBudget: 32768 },
            },
        });

        const jsonStr = response.text.trim();
        return JSON.parse(jsonStr) as ScriptOutline;
    } catch (error) {
        console.error('Error calling Gemini API for script outline generation:', error);
        if (error instanceof Error && error.message.includes('JSON')) {
             throw new Error('Failed to generate outline. The model returned an invalid format. Please try again.');
        }
        throw new Error('Failed to generate script outline. Please check the console for more details.');
    }
};

export interface PodcastCharacter {
    name: string;
    voice: PrebuiltVoice;
}

export interface PodcastOptions {
    topic: string;
    language: 'en' | 'km';
    podcastType: 'solo' | 'team';
    characters: Omit<PodcastCharacter, 'voice'>[];
    durationInMinutes: number;
    speakingStyle: string;
    interviewTemplate?: string;
}

export const generatePodcastScript = async (options: PodcastOptions): Promise<string | Dialog[]> => {
    const { topic, language, podcastType, characters, durationInMinutes, speakingStyle, interviewTemplate } = options;
    const langPrompt = language === 'km' ? 'The entire response must be in Khmer language.' : 'The entire response must be in English.';
    const durationPrompt = `The podcast script should be approximately ${durationInMinutes} minutes long when spoken.`;
    const stylePrompt = `The speaking style for the podcast should be: "${speakingStyle}".`;

    if (podcastType === 'solo') {
        const userPrompt = `Generate a short, conversational solo podcast script for a host named "${characters[0].name}" about the topic: "${topic}". The script should be natural and engaging. Do not include character names or headings, just the narration text. ${langPrompt} ${durationPrompt} ${stylePrompt}`;
        const ai = await getAi();
        const response = await ai.models.generateContent({
            model: storyModel,
            contents: userPrompt,
            config: {
                thinkingConfig: { thinkingBudget: 32768 },
            }
        });
        const text = response.text;
        if (!text) {
             throw new Error('Failed to generate podcast script. The model returned no text.');
        }
        return text.trim();
    } else { // team
        const characterNames = characters.map(c => c.name).join(' and ');
        const systemInstruction = `You are a podcast script writer. You generate conversational scripts between characters. The output MUST be a valid JSON array of objects, where each object has "character" and "line" keys. The "character" key must exactly match one of the provided character names. ${langPrompt}`;
        
        let userPrompt: string;
        if (interviewTemplate) {
            userPrompt = `You are writing an interview script between ${characterNames}. The main topic of discussion is: "${topic}".
            
            Please generate a full, conversational script that follows the structure and spirit of this template. Fill in the interviewee's answers and create relevant follow-up questions from the interviewer. Make the dialogue sound natural and engaging.
            
            Here is the template to follow:
            """
            ${interviewTemplate}
            """
            
            ${durationPrompt} ${stylePrompt}`;
        } else {
            userPrompt = `Generate a short podcast conversation script between ${characterNames} about the topic: "${topic}". ${durationPrompt} ${stylePrompt}`;
        }
        
        const ai = await getAi();
        const response = await ai.models.generateContent({
            model: storyModel,
            contents: userPrompt,
            config: {
                systemInstruction,
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            character: { type: Type.STRING },
                            line: { type: Type.STRING },
                        },
                        required: ['character', 'line']
                    }
                },
                thinkingConfig: { thinkingBudget: 32768 },
            }
        });
        const jsonStr = response.text.trim();
        return JSON.parse(jsonStr) as Dialog[];
    }
};

export const translateText = async (text: string, sourceLang: string, targetLang: string): Promise<string> => {
    const systemInstruction = `You are an expert translator. Your task is to translate the user's text accurately from ${sourceLang} to ${targetLang}. Return only the translated text, without any additional comments, introductions, or explanations.`;
    const userPrompt = `Translate the following text from ${sourceLang} to ${targetLang}:\n\n"""\n${text}\n"""`;

    try {
        const ai = await getAi();
        const response = await ai.models.generateContent({
            model: textModel, // gemini-2.5-flash
            contents: userPrompt,
            config: {
                systemInstruction,
            },
        });
        
        const translated = response.text;
        if (translated) {
            return translated.trim();
        } else {
            throw new Error('The model did not return a translation.');
        }

    } catch (error) {
        console.error(`Error calling Gemini API for translation from ${sourceLang} to ${targetLang}:`, error);
        throw new Error('Failed to translate text. Please check the console for more details.');
    }
};

export const generateQuotifyPrompts = async (speaker: string, numPrompts: number, style?: string, focusOnCharacters?: boolean): Promise<string[]> => {
    const systemInstruction = `You are a prompt engineering expert specializing in creating high-quality, tailored prompts for text-to-image AI generators. Your goal is to generate unique, vivid, and inspiring prompts.`;
    
    const styleInstruction = style 
        ? `5. The artistic style for the image must be **${style}**. You must include this style description in the generated prompt text.`
        : '';

    const focusInstruction = focusOnCharacters
        ? `6. CRITICAL RULE: Put a strong focus on the characters and their faces in every shot to ensure they are clear and recognizable. The visual prompts ("prompt" property) MUST describe characters in a way that helps an AI retain their appearance across different scenes.`
        : '';

    const userPrompt = `Generate exactly ${numPrompts} unique prompts based on the motivational themes of ${speaker}.

    Each prompt must follow these rules:
    1.  Describe a dynamic and passionate shot of a motivational speaker. This speaker should embody the qualities (determined expression, commanding stage presence) of a figure like ${speaker}, but MUST NOT be a direct likeness or named depiction of them. Use generic but descriptive features (e.g., "a woman with curly hair speaking passionately," "a man in a sharp suit gesturing towards the audience").
    2.  The setting should be a serene or motivational background, possibly slightly blurred to emphasize the speaker.
    3.  Include a powerful, short motivational quote, in the style of ${speaker}, that is clearly overlaid or emblazoned on the image in a bold font.
    4.  The prompt must be a single paragraph of descriptive text.
    ${styleInstruction}
    ${focusInstruction}

    Return the result as a valid JSON array of strings. Do not include any other text, markdown, or commentary.`;

    const schema = {
        type: Type.ARRAY,
        items: {
            type: Type.STRING,
            description: "A detailed prompt for a text-to-image AI generator."
        }
    };

    try {
        const ai = await getAi();
        const response = await ai.models.generateContent({
            model: storyModel, // gemini-2.5-pro for creativity
            contents: userPrompt,
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: schema,
                thinkingConfig: { thinkingBudget: 32768 },
            },
        });

        const jsonStr = response.text.trim();
        const prompts = JSON.parse(jsonStr) as string[];
        if (prompts.length !== numPrompts) {
            console.warn(`Model returned ${prompts.length} prompts, but ${numPrompts} were requested.`);
        }
        return prompts;
    } catch (error) {
        console.error('Error calling Gemini API for Quotify prompt generation:', error);
        throw new Error('Failed to generate prompts. The model may have returned an invalid format.');
    }
};

export const enhanceQuotifyPrompts = async (prompts: string[]): Promise<string[]> => {
    const systemInstruction = `You are a world-class prompt engineer and a creative writer. Your task is to take a list of good image prompts and make them exceptional. Enhance each prompt by adding more sensory details, specific cinematic language (like camera shots, lighting styles), and deeper emotional context. Do not change the core quote within the prompt. Return the enhanced prompts as a valid JSON array of strings, maintaining the same number of prompts as the input.`;
    
    const userPrompt = `Here is a list of prompts to enhance:\n\n${JSON.stringify(prompts)}\n\nPlease provide the enhanced versions. Make them more vivid, descriptive, and emotionally resonant.`;

    const schema = {
        type: Type.ARRAY,
        items: {
            type: Type.STRING,
            description: "An enhanced, detailed prompt for a text-to-image AI generator."
        }
    };

    try {
        const ai = await getAi();
        const response = await ai.models.generateContent({
            model: storyModel, // gemini-2.5-pro for high creativity
            contents: userPrompt,
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: schema,
                thinkingConfig: { thinkingBudget: 32768 },
            },
        });

        const jsonStr = response.text.trim();
        const enhancedPrompts = JSON.parse(jsonStr) as string[];
        if (enhancedPrompts.length !== prompts.length) {
            console.warn(`Model returned ${enhancedPrompts.length} prompts, but ${prompts.length} were expected.`);
        }
        return enhancedPrompts;
    } catch (error) {
        console.error('Error calling Gemini API for Quotify prompt enhancement:', error);
        throw new Error('Failed to enhance prompts. The model may have returned an invalid format.');
    }
};

export const generateVideoIdeas = async (options: {
    videoType: string;
    language: string;
    characterStyle: string;
    customTopic: string;
    ideaCount: number;
}): Promise<VideoIdea[]> => {
    const { videoType, language, characterStyle, customTopic, ideaCount } = options;

    const systemInstruction = `You are a creative idea generator for short animated videos. Your task is to provide a list of video concepts based on user specifications. The output must be a valid JSON array of objects.`;

    const userPrompt = `Generate ${ideaCount} video ideas for a ${videoType} video in ${language}. 
    The video will feature a simple ${characterStyle} character. 
    The main theme is: "${customTopic}".
    For each idea, provide a unique 'title' in ${language}, a short 'summary' in ${language} describing the story or message, and a single 'sampleScriptLine' in ${language} that could be used in the voiceover.`;

    const schema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                title: { type: Type.STRING, description: `The title of the video idea in ${language}.` },
                summary: { type: Type.STRING, description: `A short summary of the video idea in ${language}.` },
                sampleScriptLine: { type: Type.STRING, description: `A sample line of script for the voiceover in ${language}.` },
            },
            required: ['title', 'summary', 'sampleScriptLine'],
        },
    };

    try {
        const ai = await getAi();
        const response = await ai.models.generateContent({
            model: storyModel, // gemini-2.5-pro for creativity
            contents: userPrompt,
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: schema,
                thinkingConfig: { thinkingBudget: 32768 },
            },
        });
        const jsonStr = response.text.trim();
        return JSON.parse(jsonStr) as VideoIdea[];
    } catch (error) {
        console.error('Error calling Gemini API for video idea generation:', error);
        throw new Error('Failed to generate video ideas. Please check the console for details.');
    }
};

export interface VlogScriptResponse {
    youtubeTitle: string;
    youtubeDescription: string;
    vlogScript: string;
}

export const generateVlogScript = async (topic: string, style: string): Promise<VlogScriptResponse> => {
    const systemInstruction = `You are a professional YouTube scriptwriter. Your task is to generate a complete vlog package based on a user's topic and chosen style.
    The final output MUST be a valid JSON object. This object must contain three keys: "youtubeTitle", "youtubeDescription", and "vlogScript".
    - "youtubeTitle": A catchy, SEO-friendly title for the YouTube video.
    - "youtubeDescription": A well-written YouTube description, including a brief summary, timestamps (if applicable), and relevant hashtags.
    - "vlogScript": A detailed, engaging script for the vlog. The script MUST be structured with clear headings like [INTRO], [MAIN CONTENT], [B-ROLL SUGGESTION], [CALL TO ACTION], and [OUTRO]. The script should be conversational and natural-sounding. Include suggestions for camera angles and shots where appropriate.
    Do not include any introductory text, markdown formatting, or anything outside of the JSON object.`;

    const userPrompt = `Generate a vlog script about the topic: "${topic}". The required style for this vlog is: **${style}**.`;

    const schema = {
        type: Type.OBJECT,
        properties: {
            youtubeTitle: { type: Type.STRING, description: "A catchy, SEO-friendly title for the vlog." },
            youtubeDescription: { type: Type.STRING, description: "A detailed YouTube description with summary and hashtags." },
            vlogScript: { type: Type.STRING, description: "The full vlog script with structural headings like [INTRO]." },
        },
        required: ['youtubeTitle', 'youtubeDescription', 'vlogScript']
    };

    try {
        const ai = await getAi();
        const response = await ai.models.generateContent({
            model: storyModel, // gemini-2.5-pro for high quality creative writing
            contents: userPrompt,
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: schema,
                thinkingConfig: { thinkingBudget: 32768 },
            },
        });

        const jsonStr = response.text.trim();
        return JSON.parse(jsonStr) as VlogScriptResponse;
    } catch (error) {
        console.error('Error calling Gemini API for vlog script generation:', error);
        if (error instanceof Error && error.message.includes('JSON')) {
             throw new Error('Failed to generate vlog script. The model returned an invalid JSON format. Please try again.');
        }
        throw new Error('Failed to generate vlog script. Please check the console for more details.');
    }
};