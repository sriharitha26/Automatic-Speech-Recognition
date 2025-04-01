
import React, { useState } from 'react';
import { Copy, CheckCheck, Trash } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export interface Transcription {
  id: string;
  text: string;
  createdAt: Date;
  isProcessing?: boolean;
}

interface TranscriptionItemProps {
  transcription: Transcription;
  onDelete: (id: string) => void;
}

const TranscriptionItem: React.FC<TranscriptionItemProps> = ({ 
  transcription, 
  onDelete 
}) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(transcription.text);
    setCopied(true);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const formattedDate = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true
  }).format(transcription.createdAt);

  return (
    <div className={cn(
      "p-4 rounded-lg mb-3 bg-secondary transition-opacity",
      transcription.isProcessing ? "opacity-60" : "opacity-100"
    )}>
      <div className="flex justify-between items-start gap-2 mb-1">
        <span className="text-xs text-muted-foreground">
          {formattedDate}
          {transcription.isProcessing && (
            <span className="ml-2 text-blue-400 animate-pulse">Processing...</span>
          )}
        </span>
        <div className="flex gap-1">
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={copyToClipboard}
            title="Copy to clipboard"
            disabled={transcription.isProcessing}
          >
            {copied ? <CheckCheck size={16} /> : <Copy size={16} />}
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 hover:text-destructive"
            onClick={() => onDelete(transcription.id)}
            title="Delete"
          >
            <Trash size={16} />
          </Button>
        </div>
      </div>
      <p className={transcription.isProcessing ? "text-muted-foreground" : "text-foreground"}>
        {transcription.text || "Processing transcription..."}
      </p>
    </div>
  );
};

export default TranscriptionItem;
