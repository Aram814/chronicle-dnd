import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { ChevronDown, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

// Renders a single message in an agent conversation, including tool-call cards.
export default function AgentMessage({ message }) {
  const isUser = message.role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-[85%] ${isUser ? 'order-2' : ''}`}>
        <div className={`flex items-center gap-2 mb-1 ${isUser ? 'justify-end' : ''}`}>
          <span className={`text-xs font-semibold ${isUser ? 'text-rose-400' : 'text-amber-600'}`}>
            {isUser ? '🗡 You' : '⚒ Character Forge'}
          </span>
        </div>
        <div className={`rounded-2xl px-4 py-3 ${
          isUser
            ? 'bg-gradient-to-br from-rose-950/60 to-card/80 border border-rose-900/40 text-rose-50'
            : 'bg-gradient-to-br from-card/90 to-background/90 border border-amber-900/30 text-foreground'
        }`}>
          {message.content ? (
            <div className="prose prose-sm prose-invert max-w-none prose-p:my-1 prose-p:leading-relaxed prose-strong:text-amber-300 prose-em:text-amber-200/80">
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
          ) : null}
          {message.tool_calls?.map((tc, i) => <FunctionDisplay key={i} toolCall={tc} />)}
        </div>
      </div>
    </div>
  );
}

function FunctionDisplay({ toolCall }) {
  const [expanded, setExpanded] = useState(false);
  const status = toolCall.status;
  const failed = status === 'failed' || status === 'error';
  const running = ['pending', 'running', 'in_progress'].includes(status);
  const proj = toolCall.display_projection || {};
  const hide = proj.hide_details && proj.details_redacted;
  const label = proj.label || toolCall.name;

  let args = toolCall.arguments_string;
  try { args = JSON.stringify(JSON.parse(toolCall.arguments_string), null, 2); } catch (e) { /* keep raw */ }
  let parsedResults = toolCall.results;
  if (typeof parsedResults === 'string') {
    try { parsedResults = JSON.parse(parsedResults); } catch (e) { /* keep raw */ }
  }

  return (
    <div className="mt-2 text-xs border border-border rounded-lg bg-background/60 p-2">
      <button onClick={() => setExpanded(!expanded)} className="flex items-center gap-1.5 w-full touch-target">
        {failed ? <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
          : running ? <Loader2 className="w-3.5 h-3.5 text-amber-400 animate-spin shrink-0" />
          : <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
        <span className="font-semibold text-foreground">{label}</span>
        <span className="text-muted-foreground">
          {failed ? (proj.error_label || 'failed') : running ? (proj.active_label || 'working…') : (proj.label || 'done')}
        </span>
        {!hide && <ChevronDown className={`w-3 h-3 ml-auto transition-transform ${expanded ? 'rotate-180' : ''}`} />}
      </button>
      {!hide && expanded && (
        <div className="mt-2 space-y-1">
          {args && args !== '{}' && (
            <div>
              <div className="text-muted-foreground">Parameters:</div>
              <pre className="whitespace-pre-wrap break-words text-foreground">{args}</pre>
            </div>
          )}
          {parsedResults != null && (
            <div>
              <div className="text-muted-foreground">Result:</div>
              <pre className="whitespace-pre-wrap break-words text-foreground">
                {typeof parsedResults === 'string' ? parsedResults : JSON.stringify(parsedResults, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}