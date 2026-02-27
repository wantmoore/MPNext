"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Copy, ExternalLink } from "lucide-react";
import { createMpSelection } from "./actions";
import { SelectionResult } from "@/lib/dto/selections";

export interface CreateMpSelectionProps {
  pageId: number;
  recordIds: number[];
  defaultSelectionName?: string;
  triggerLabel?: string;
  onSuccess?: (result: SelectionResult) => void;
  disabled?: boolean;
}

export function CreateMpSelection({
  pageId,
  recordIds,
  defaultSelectionName = "",
  triggerLabel = "Create MP Selection",
  onSuccess,
  disabled = false,
}: CreateMpSelectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectionName, setSelectionName] = useState(defaultSelectionName);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SelectionResult | null>(null);
  const [copied, setCopied] = useState(false);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setSelectionName(defaultSelectionName);
      setError(null);
      setResult(null);
      setCopied(false);
      setIsCreating(false);
    }
  };

  const handleCreate = async () => {
    if (!selectionName.trim()) return;

    try {
      setIsCreating(true);
      setError(null);
      const selectionResult = await createMpSelection({
        selectionName: selectionName.trim(),
        pageId,
        recordIds,
      });
      setResult(selectionResult);
      if (onSuccess) {
        onSuccess(selectionResult);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create MP selection";
      setError(message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopy = async () => {
    if (!result?.selectionUrl) return;
    try {
      await navigator.clipboard.writeText(result.selectionUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: do nothing silently
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" disabled={disabled || recordIds.length === 0}>
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Create MP Selection</DialogTitle>
          <DialogDescription>
            {result
              ? "Your selection has been created in Ministry Platform."
              : `Create a named selection from ${recordIds.length} record${recordIds.length !== 1 ? "s" : ""}.`}
          </DialogDescription>
        </DialogHeader>

        {!result ? (
          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label htmlFor="selection-name">Selection Name</Label>
              <Input
                id="selection-name"
                value={selectionName}
                onChange={(e) => setSelectionName(e.target.value)}
                placeholder="Enter a name for this selection"
                disabled={isCreating}
              />
            </div>

            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => handleOpenChange(false)}
                disabled={isCreating}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleCreate}
                disabled={isCreating || !selectionName.trim()}
              >
                {isCreating ? "Creating..." : "Create Selection"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label htmlFor="selection-url">Selection URL</Label>
              <div className="flex gap-2">
                <Input
                  id="selection-url"
                  value={result.selectionUrl}
                  readOnly
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopy}
                  title="Copy URL"
                >
                  <Copy className="h-4 w-4" />
                  <span className="sr-only">{copied ? "Copied!" : "Copy URL"}</span>
                </Button>
              </div>
              {copied && (
                <p className="text-sm text-muted-foreground">Copied to clipboard!</p>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => handleOpenChange(false)}
              >
                Close
              </Button>
              <Button asChild className="flex-1 flex items-center gap-2">
                <a href={result.selectionUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                  Open in MP
                </a>
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
