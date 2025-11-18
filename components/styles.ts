export interface Style {
  name: string;
  value: string; // The value to be used in the prompt
  imageUrl: string;
}

// Image URLs from Pexels, which provides royalty-free stock photos.
export const styles: Style[] = [
    { name: 'Cinematic', value: '4K cinematic, epic, high detail, dramatic lighting', imageUrl: 'https://images.pexels.com/photos/1525041/pexels-photo-1525041.jpeg?auto=compress&cs=tinysrgb&w=400' },
    { name: 'Anime', value: 'anime style, vibrant colors, detailed characters, dynamic action scenes', imageUrl: 'https://images.pexels.com/photos/3408744/pexels-photo-3408744.jpeg?auto=compress&cs=tinysrgb&w=400' },
    { name: '3D Cartoon', value: 'Pixar-like cinematic 3D, cute and expressive characters, detailed textures', imageUrl: 'https://images.pexels.com/photos/7848995/pexels-photo-7848995.jpeg?auto=compress&cs=tinysrgb&w=400' },
    { name: 'Ghibli', value: 'Ghibli studio style, hand-drawn aesthetic, lush natural landscapes, whimsical and heartwarming feel', imageUrl: 'https://images.pexels.com/photos/3762299/pexels-photo-3762299.jpeg?auto=compress&cs=tinysrgb&w=400' },
    { name: 'Simple Style', value: 'simple style, clean lines, flat colors, minimalist', imageUrl: 'https://images.pexels.com/photos/196644/pexels-photo-196644.jpeg?auto=compress&cs=tinysrgb&w=400' },
    { name: 'Realistic', value: 'photorealistic, hyperrealistic, high detail', imageUrl: 'https://images.pexels.com/photos/3227986/pexels-photo-3227986.jpeg?auto=compress&cs=tinysrgb&w=400' },
    { name: 'Pixel Art', value: 'pixel art style, 16-bit, retro video game aesthetic', imageUrl: 'https://images.pexels.com/photos/17753440/pexels-photo-17753440/free-photo-of-pixelated-dystopian-art.jpeg?auto=compress&cs=tinysrgb&w=400' },
    { name: 'Cyberpunk', value: 'cyberpunk style, neon-drenched cityscapes, futuristic technology, gritty and dystopian mood', imageUrl: 'https://images.pexels.com/photos/5794711/pexels-photo-5794711.jpeg?auto=compress&cs=tinysrgb&w=400' },
    { name: 'Watercolor', value: 'watercolor painting style, soft edges, blended colors, artistic', imageUrl: 'https://images.pexels.com/photos/1269968/pexels-photo-1269968.jpeg?auto=compress&cs=tinysrgb&w=400' },
    { name: 'Pencil Sketch', value: 'pencil sketch style, black and white, hand-drawn, artistic cross-hatching', imageUrl: 'https://images.pexels.com/photos/1261578/pexels-photo-1261578.jpeg?auto=compress&cs=tinysrgb&w=400'},
    { name: 'Claymation', value: 'claymation stop-motion style, handcrafted look, visible fingerprints and textures', imageUrl: 'https://images.pexels.com/photos/1037993/pexels-photo-1037993.jpeg?auto=compress&cs=tinysrgb&w=400' },
    { name: 'Vintage Film', value: 'vintage film look, grainy texture, faded colors, nostalgic feel, 1970s cinema', imageUrl: 'https://images.pexels.com/photos/789822/pexels-photo-789822.jpeg?auto=compress&cs=tinysrgb&w=400' },
    { name: 'Low-Poly', value: 'Low-poly 3D animation, simple geometric shapes, vibrant colors', imageUrl: 'https://images.pexels.com/photos/2387793/pexels-photo-2387793.jpeg?auto=compress&cs=tinysrgb&w=400'},
    { name: 'Children\'s Book', value: 'children\'s book illustration, whimsical, colorful, friendly characters', imageUrl: 'https://images.pexels.com/photos/163036/mario-luigi-yoschi-figures-163036.jpeg?auto=compress&cs=tinysrgb&w=400' },
    { name: 'Steampunk', value: 'steampunk aesthetic, gears, cogs, Victorian-era technology, brass and copper details', imageUrl: 'https://images.pexels.com/photos/89778/imoga-cog-wheel-indusrty-89778.jpeg?auto=compress&cs=tinysrgb&w=400' },
    { name: 'Fantasy Art', value: 'fantasy concept art, epic scale, magical elements, detailed environments', imageUrl: 'https://images.pexels.com/photos/207529/pexels-photo-207529.jpeg?auto=compress&cs=tinysrgb&w=400'},
];
