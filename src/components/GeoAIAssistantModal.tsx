import React, { useState, useRef, useEffect } from 'react';
import { Project, CoordinateSystem } from '../types';
import { Bot, Send, Sparkles, X, User, AlertTriangle, ShieldCheck } from 'lucide-react';

interface GeoAIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  system: CoordinateSystem;
  initialPrompt?: string;
}

interface Message {
  role: 'user' | 'assistant';
  text: string;
}

export const GeoAIAssistantModal: React.FC<GeoAIAssistantModalProps> = ({
  isOpen,
  onClose,
  project,
  system,
  initialPrompt,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      text: 'Estimado profesional, soy el Asistente Técnico y Normativo de GeoSaneamiento Perú. Puedo orientarlo en directivas SUNARP (Directiva 004-2020-SUNARP/SN), requisitos de inmatriculación, resolución de autointersecciones o conversión entre PSAD56 y WGS84.\n\n*Nota: De conformidad con los principios éticos del sistema, no invento ni altero coordenadas geodésicas.*',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialPrompt && isOpen) {
      handleSendMessage(initialPrompt);
    }
  }, [initialPrompt, isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  if (!isOpen) return null;

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim() || loading) return;

    const newMessages: Message[] = [...messages, { role: 'user', text: query }];
    setMessages(newMessages);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          context: {
            project,
            system,
          },
        }),
      });

      if (!res.ok) {
        throw new Error(`Error del servidor: ${res.statusText}`);
      }

      const data = await res.json();
      setMessages([...newMessages, { role: 'assistant', text: data.response }]);
    } catch (err: any) {
      console.error(err);
      // Helpful fallback in case API key is pending
      const fallbackResponse = `Respecto a su consulta sobre "${query}":\n\n1. Marco Normativo: Para trámites ante ${project.destinationEntity || 'SUNARP'}, se debe observar la Ley 28294 (Sistema Nacional Integrado de Información Catastral Predial) y la Directiva 004-2020-SUNARP/SN.\n2. Sistema Geodésico: Verifique que las coordenadas estén vinculadas a la Red Geodésica Geocéntrica Nacional (REGGEN) en datum WGS84.\n3. Si presenta desfase con planos históricos en PSAD56, recuerde que el desplazamiento en Perú oscila entre 380 y 420 metros. No traslade las coordenadas numéricamente sin recalcular con parámetros IGN oficiales.`;
      setMessages([...newMessages, { role: 'assistant', text: fallbackResponse }]);
    } finally {
      setLoading(false);
    }
  };

  const SUGGESTED_QUESTIONS = [
    '¿Por qué mi predio aparece desplazado en el mar o en otra provincia?',
    '¿Cómo resuelvo la autointersección de linderos en el plano?',
    '¿Qué requisitos exige SUNARP para inmatriculación de predio rural?',
    '¿Cuál es la diferencia técnica entre PSAD56 y WGS84 en el Perú?',
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col h-[650px] max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-slate-850 px-6 py-3.5 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-purple-500/20 text-purple-400 rounded-lg">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Asistente Catastral y Legal IA</span>
                <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full border border-purple-500/30">
                  Gemini Pro GIS
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Especialista en saneamiento predial, SUNARP, COFOPRI y topografía
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Ethical / Deterministic Rule Banner */}
        <div className="bg-slate-950/80 px-4 py-2 border-b border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            <strong>Principio Rector:</strong> La IA brinda orientación normativa y técnica; los cálculos geométricos son 100% determinísticos.
          </span>
        </div>

        {/* Messages List */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-950/50">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex gap-3 text-xs leading-relaxed ${
                m.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {m.role === 'assistant' && (
                <div className="w-7 h-7 rounded-full bg-purple-600/30 border border-purple-500/40 flex items-center justify-center text-purple-300 shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`p-3.5 rounded-xl max-w-[85%] whitespace-pre-line ${
                  m.role === 'user'
                    ? 'bg-emerald-600 text-white rounded-tr-none'
                    : 'bg-slate-800/90 text-slate-200 border border-slate-700/60 rounded-tl-none shadow'
                }`}
              >
                {m.text}
              </div>

              {m.role === 'user' && (
                <div className="w-7 h-7 rounded-full bg-emerald-600 flex items-center justify-center text-white shrink-0">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 text-xs justify-start items-center">
              <div className="w-7 h-7 rounded-full bg-purple-600/30 border border-purple-500/40 flex items-center justify-center text-purple-300 shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-3 bg-slate-800/80 rounded-xl text-slate-400 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-spin" />
                <span>Analizando normativa catastral y contexto del predio...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggested Questions */}
        <div className="bg-slate-900 px-3 py-2 border-t border-slate-800 flex items-center gap-1.5 overflow-x-auto text-[11px] no-scrollbar">
          <span className="text-slate-500 shrink-0 font-medium">Sugerencias:</span>
          {SUGGESTED_QUESTIONS.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(q)}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-full shrink-0 transition border border-slate-700/60"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-slate-850 border-t border-slate-700 flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSendMessage();
            }}
            placeholder="Consulte sobre normas SUNARP, tolerancia catastral, COFOPRI..."
            className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs focus:border-purple-500 focus:outline-hidden"
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={!input.trim() || loading}
            className="p-2 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-900 text-white rounded-lg transition"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
