import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Camera, 
  Upload, 
  Settings, 
  Image as ImageIcon, 
  Loader2, 
  Download, 
  Trash2, 
  Plus,
  ChevronRight,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { generateFoodPhoto, PhotoStyle, ImageSize, Dish } from './services/geminiService';
import { ErrorBoundary } from './components/ErrorBoundary';

// Extend Window interface for AI Studio API key selection
declare global {
  interface Window {
    aistudio: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

export default function App() {
  const [menuText, setMenuText] = useState('');
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [style, setStyle] = useState<PhotoStyle>('modern');
  const [size, setSize] = useState<ImageSize>('1K');
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseMenu = () => {
    if (!menuText.trim()) return;
    
    const lines = menuText.split('\n').filter(line => line.trim().length > 0);
    const newDishes: Dish[] = lines.map(line => ({
      id: Math.random().toString(36).substr(2, 9),
      name: line.trim(),
      status: 'idle'
    }));
    
    setDishes(prev => [...prev, ...newDishes]);
    setMenuText('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setMenuText(text);
    };
    reader.readAsText(file);
  };

  const generateAll = async () => {
    if (dishes.length === 0) return;
    setIsProcessing(true);

    const dishesToProcess = dishes.filter(d => d.status !== 'completed');
    
    for (const dish of dishesToProcess) {
      setDishes(prev => prev.map(d => d.id === dish.id ? { ...d, status: 'generating' } : d));
      
      try {
        const imageUrl = await generateFoodPhoto(dish.name, style, size);
        setDishes(prev => prev.map(d => d.id === dish.id ? { ...d, imageUrl, status: 'completed' } : d));
      } catch (error) {
        console.error(`Failed to generate photo for ${dish.name}`, error);
        setDishes(prev => prev.map(d => d.id === dish.id ? { ...d, status: 'error' } : d));
      }
    }
    
    setIsProcessing(false);
  };

  const removeDish = (id: string) => {
    setDishes(prev => prev.filter(d => d.id !== id));
  };

  const downloadImage = (url: string, name: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `${name.replace(/\s+/g, '_').toLowerCase()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-[#050505] text-zinc-100 font-sans selection:bg-orange-500/30">
        {/* Header */}
        <header className="border-b border-zinc-800/50 bg-black/50 backdrop-blur-xl sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center">
                <Camera className="w-6 h-6 text-black" />
              </div>
              <div>
                <h1 className="text-lg font-semibold tracking-tight">Virtual Food Photographer</h1>
                <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-medium">AI-Powered Studio</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <button 
                onClick={generateAll}
                disabled={isProcessing || dishes.length === 0}
                className="px-6 py-2.5 bg-white text-black text-sm font-semibold rounded-full hover:bg-zinc-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                Generate All
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Left Column: Controls */}
          <div className="lg:col-span-4 space-y-10">
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-500">1. Menu Input</h2>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs text-orange-500 hover:text-orange-400 transition-colors flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Upload File
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                  className="hidden" 
                  accept=".txt"
                />
              </div>
              <div className="relative group">
                <textarea
                  value={menuText}
                  onChange={(e) => setMenuText(e.target.value)}
                  placeholder="Paste your menu items here...&#10;e.g. Grilled Salmon with Asparagus&#10;Classic Beef Burger"
                  className="w-full h-48 bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 text-sm focus:outline-none focus:border-orange-500/50 transition-all resize-none placeholder:text-zinc-600"
                />
                <button
                  onClick={parseMenu}
                  disabled={!menuText.trim()}
                  className="absolute bottom-4 right-4 p-2 bg-orange-500 text-black rounded-lg hover:bg-orange-400 transition-all disabled:opacity-0"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </section>

            <section className="space-y-6">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-500">2. Photography Style</h2>
              <div className="grid grid-cols-1 gap-3">
                {(['rustic', 'modern', 'social'] as PhotoStyle[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => setStyle(s)}
                    className={`p-4 rounded-2xl border text-left transition-all ${
                      style === s 
                        ? 'bg-orange-500/10 border-orange-500 text-white' 
                        : 'bg-zinc-900/30 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="capitalize font-medium">{s === 'social' ? 'Social Media (Top-down)' : s}</span>
                      {style === s && <div className="w-2 h-2 bg-orange-500 rounded-full" />}
                    </div>
                    <p className="text-[11px] opacity-60 leading-relaxed">
                      {s === 'rustic' && 'Moody lighting with natural wood and artisanal textures.'}
                      {s === 'modern' && 'Clean, bright aesthetic with minimalist backgrounds.'}
                      {s === 'social' && 'Trendy flat-lay perspective perfect for Instagram feeds.'}
                    </p>
                  </button>
                ))}
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-500">3. Output Quality</h2>
              <div className="flex gap-2">
                {(['1K', '2K', '4K'] as ImageSize[]).map((sz) => (
                  <button
                    key={sz}
                    onClick={() => setSize(sz)}
                    className={`flex-1 py-3 rounded-xl border text-xs font-bold transition-all ${
                      size === sz 
                        ? 'bg-white text-black border-white' 
                        : 'bg-zinc-900/30 border-zinc-800 text-zinc-500 hover:border-zinc-700'
                    }`}
                  >
                    {sz}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-zinc-600 text-center italic">
                Higher resolutions take longer to generate but provide professional print quality.
              </p>
            </section>
          </div>

          {/* Right Column: Gallery */}
          <div className="lg:col-span-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-light tracking-tight">Your Studio Gallery</h2>
              <span className="text-xs text-zinc-500 font-mono">{dishes.length} Items</span>
            </div>

            {dishes.length === 0 ? (
              <div className="h-[600px] border-2 border-dashed border-zinc-800 rounded-3xl flex flex-col items-center justify-center text-zinc-600 space-y-4">
                <ImageIcon className="w-12 h-12 opacity-20" />
                <p className="text-sm font-medium">No dishes added yet. Enter your menu to begin.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <AnimatePresence mode="popLayout">
                  {dishes.map((dish) => (
                    <motion.div
                      key={dish.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="group relative bg-zinc-900/30 border border-zinc-800 rounded-3xl overflow-hidden"
                    >
                      <div className="aspect-square relative bg-zinc-950 flex items-center justify-center">
                        {dish.imageUrl ? (
                          <>
                            <img 
                              src={dish.imageUrl} 
                              alt={dish.name} 
                              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                              <button 
                                onClick={() => downloadImage(dish.imageUrl!, dish.name)}
                                className="p-3 bg-white text-black rounded-full hover:bg-orange-500 transition-colors"
                              >
                                <Download className="w-5 h-5" />
                              </button>
                              <button 
                                onClick={() => removeDish(dish.id)}
                                className="p-3 bg-white/10 text-white backdrop-blur-md rounded-full hover:bg-red-500 transition-colors"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </div>
                          </>
                        ) : (
                          <div className="flex flex-col items-center gap-4">
                            {dish.status === 'generating' ? (
                              <>
                                <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
                                <p className="text-xs text-zinc-500 animate-pulse">Capturing the perfect shot...</p>
                              </>
                            ) : dish.status === 'error' ? (
                              <>
                                <AlertCircle className="w-8 h-8 text-red-500" />
                                <p className="text-xs text-red-500">Generation failed</p>
                              </>
                            ) : (
                              <ImageIcon className="w-8 h-8 text-zinc-800" />
                            )}
                          </div>
                        )}
                      </div>
                      
                      <div className="p-5 flex items-center justify-between">
                        <div className="min-w-0">
                          <h3 className="text-sm font-medium truncate pr-4">{dish.name}</h3>
                          <p className="text-[10px] text-zinc-500 uppercase tracking-wider mt-1">
                            {dish.status === 'completed' ? 'Ready' : 'Pending'}
                          </p>
                        </div>
                        {dish.status === 'idle' && (
                          <button 
                            onClick={() => removeDish(dish.id)}
                            className="p-2 text-zinc-600 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-zinc-900 py-12 px-6">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
            <p className="text-xs text-zinc-600">
              © 2026 Virtual Food Photographer. Powered by Gemini 2.5 Flash.
            </p>
            <div className="flex items-center gap-8">
              <span className="text-[10px] uppercase tracking-widest text-zinc-700 font-bold">High-End Quality</span>
              <span className="text-[10px] uppercase tracking-widest text-zinc-700 font-bold">Instant Studio</span>
              <span className="text-[10px] uppercase tracking-widest text-zinc-700 font-bold">Commercial License</span>
            </div>
          </div>
        </footer>
      </div>
    </ErrorBoundary>
  );
}
