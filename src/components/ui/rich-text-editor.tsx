"use client";
/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect */

import { useState, useEffect, forwardRef, useImperativeHandle, useCallback } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import Mention from "@tiptap/extension-mention";
import { ReactRenderer } from "@tiptap/react";
import tippy, { type Instance as TippyInstance } from "tippy.js";
import { supabase } from "@/lib/supabase";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  Quote,
  Heading1,
  Heading2,
  Link as LinkIcon,
  Unlink,
  Undo,
  Redo,
  Code,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { cn } from "@/lib/utils";

/* ────────────────────────────────────────────
   Types
   ──────────────────────────────────────────── */

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
  maxHeight?: number;
}

interface MentionItem {
  id: string;
  label: string;
}

interface MentionListProps {
  items: MentionItem[];
  command: (item: MentionItem) => void;
}

interface MentionListHandle {
  onKeyDown: (args: { event: KeyboardEvent }) => boolean;
}

/* ────────────────────────────────────────────
   Toolbar Primitives
   ──────────────────────────────────────────── */

function ToolbarButton({
  onClick,
  isActive = false,
  disabled = false,
  tooltip,
  shortcut,
  children,
}: {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  tooltip: string;
  shortcut?: string;
  children: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={tooltip}
          className={cn(
            "size-8 rounded-lg transition-all duration-150",
            isActive
              ? "bg-primary/15 text-primary shadow-sm ring-1 ring-primary/10"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
            disabled && "opacity-40 pointer-events-none"
          )}
          onClick={(e) => {
            e.preventDefault();
            onClick();
          }}
          disabled={disabled}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom" sideOffset={6} className="flex items-center gap-2 text-xs">
        <span>{tooltip}</span>
        {shortcut && (
          <kbd className="rounded border border-border/60 bg-muted/80 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
            {shortcut}
          </kbd>
        )}
      </TooltipContent>
    </Tooltip>
  );
}

function ToolbarDivider() {
  return <div className="mx-1 h-5 w-px shrink-0 bg-border/50" />;
}

/* ────────────────────────────────────────────
   Mention List (Dropdown)
   ──────────────────────────────────────────── */

const MentionList = forwardRef<MentionListHandle, MentionListProps>((props, ref) => {
  const { items, command } = props;
  const [selectedIndex, setSelectedIndex] = useState(0);

  const selectItem = useCallback(
    (index: number) => {
      const item = items[index];
      if (item) command(item);
    },
    [items, command]
  );

  useImperativeHandle(
    ref,
    () => ({
      onKeyDown: ({ event }: { event: KeyboardEvent }) => {
        if (event.key === "ArrowUp") {
          setSelectedIndex((i) => (i + props.items.length - 1) % props.items.length);
          return true;
        }
        if (event.key === "ArrowDown") {
          setSelectedIndex((i) => (i + 1) % props.items.length);
          return true;
        }
        if (event.key === "Enter") {
          selectItem(selectedIndex);
          return true;
        }
        return false;
      },
    }),
    [props.items.length, selectedIndex, selectItem]
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [items]);

  if (!props.items.length) {
    return (
      <div className="rounded-xl border border-border/50 bg-popover px-4 py-3 shadow-xl backdrop-blur-md">
        <p className="text-sm text-muted-foreground text-center">No users found</p>
      </div>
    );
  }

  return (
    <div className="z-50 min-w-[220px] max-h-[260px] overflow-y-auto rounded-xl border border-border/50 bg-popover p-1 shadow-xl backdrop-blur-md">
      {props.items.map((item, index) => (
        <button
          key={item.id}
          type="button"
          className={cn(
            "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm outline-none transition-colors",
            index === selectedIndex
              ? "bg-primary text-primary-foreground"
              : "text-foreground hover:bg-accent"
          )}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => selectItem(index)}
          onMouseEnter={() => setSelectedIndex(index)}
        >
          <span
            className={cn(
              "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold uppercase",
              index === selectedIndex
                ? "bg-primary-foreground/20 text-primary-foreground"
                : "bg-primary/10 text-primary"
            )}
          >
            {item.label.charAt(0)}
          </span>
          <span className="truncate font-medium">{item.label}</span>
          {index === selectedIndex && <kbd className="ml-auto text-[10px] opacity-60">↵</kbd>}
        </button>
      ))}
    </div>
  );
});

MentionList.displayName = "MentionList";

/* ────────────────────────────────────────────
   Mention Suggestion Config
   ──────────────────────────────────────────── */

const mentionSuggestion = {
  items: async ({ query }: { query: string }): Promise<MentionItem[]> => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("id, name")
        .ilike("name", `%${query}%`)
        .limit(30);

      if (error) throw error;

      return (data ?? []).map((u) => ({ id: u.id, label: u.name }));
    } catch {
      return [];
    }
  },

  render: () => {
    let component: ReactRenderer<MentionListHandle> | null = null;
    let popup: TippyInstance[] | null = null;

    return {
      // tiptap suggestion props are untyped — safe to use `any` here
      onStart: (props: any) => {
        component = new ReactRenderer(MentionList, {
          props,
          editor: props.editor,
        });

        if (!props.clientRect) return;

        popup = tippy("body", {
          getReferenceClientRect: props.clientRect,
          appendTo: () => document.body,
          content: component.element,
          showOnCreate: true,
          interactive: true,
          trigger: "manual",
          placement: "bottom-start",
          maxWidth: "none",
          zIndex: 9999,
        });
      },

      onUpdate: (props: any) => {
        component?.updateProps(props);
        if (props.clientRect && popup?.[0]) {
          popup[0].setProps({ getReferenceClientRect: props.clientRect });
        }
      },

      onKeyDown: (props: any) => {
        if (props.event.key === "Escape") {
          popup?.[0]?.hide();
          return true;
        }
        return component?.ref?.onKeyDown(props) ?? false;
      },

      onExit: () => {
        popup?.[0]?.destroy();
        component?.destroy();
        popup = null;
        component = null;
      },
    };
  },
};

/* ────────────────────────────────────────────
   Rich Text Editor
   ──────────────────────────────────────────── */

export function RichTextEditor({
  content,
  onChange,
  placeholder = "Start writing your content…",
  className,
  maxHeight = 500,
}: RichTextEditorProps) {
  const [linkUrl, setLinkUrl] = useState("");
  const [linkOpen, setLinkOpen] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2] } }),
      Underline,
      Placeholder.configure({ placeholder }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class:
            "text-primary underline decoration-primary/30 underline-offset-2 transition-colors hover:decoration-primary cursor-pointer",
        },
      }),
      Mention.configure({
        HTMLAttributes: {
          class:
            "mention font-semibold text-primary bg-primary/10 rounded px-1 py-0.5 cursor-default",
        },
        suggestion: mentionSuggestion,
      }),
    ],
    content,
    onUpdate: ({ editor: e }) => onChange(e.getHTML()),
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: cn(
          "prose prose-sm dark:prose-invert max-w-none min-h-[160px] focus:outline-none px-5 py-4",
          "prose-headings:font-bold prose-headings:tracking-tight",
          "prose-p:leading-relaxed prose-p:text-foreground/80",
          "prose-a:text-primary prose-a:no-underline hover:prose-a:underline",
          "prose-blockquote:border-l-primary/40 prose-blockquote:text-muted-foreground",
          "prose-code:bg-muted prose-code:rounded-md prose-code:px-1.5 prose-code:py-0.5 prose-code:text-[13px] prose-code:font-medium prose-code:before:content-none prose-code:after:content-none",
          className
        ),
      },
    },
  });

  /* Link helpers */
  const handleLinkSubmit = useCallback(() => {
    if (!editor) return;

    if (!linkUrl.trim()) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
    } else {
      const href = /^https?:\/\//i.test(linkUrl) ? linkUrl : `https://${linkUrl}`;
      editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
    }

    setLinkOpen(false);
    setLinkUrl("");
  }, [editor, linkUrl]);

  const removeLink = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().extendMarkRange("link").unsetLink().run();
    setLinkOpen(false);
    setLinkUrl("");
  }, [editor]);

  if (!editor) return null;

  const wordCount = editor.getText().split(/\s+/).filter(Boolean).length;

  return (
    <TooltipProvider delayDuration={300}>
      <div
        className={cn(
          "rounded-xl border border-input bg-background overflow-hidden",
          "transition-all duration-200",
          "focus-within:ring-2 focus-within:ring-ring/20 focus-within:border-ring/50"
        )}
      >
        {/* ── Toolbar ── */}
        <div className="flex flex-wrap items-center gap-0.5 border-b bg-muted/30 px-2 py-1.5">
          {/* Headings */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            isActive={editor.isActive("heading", { level: 1 })}
            tooltip="Heading 1"
            shortcut="⌘⇧1"
          >
            <Heading1 className="size-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            isActive={editor.isActive("heading", { level: 2 })}
            tooltip="Heading 2"
            shortcut="⌘⇧2"
          >
            <Heading2 className="size-4" />
          </ToolbarButton>

          <ToolbarDivider />

          {/* Inline Formatting */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive("bold")}
            tooltip="Bold"
            shortcut="⌘B"
          >
            <Bold className="size-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive("italic")}
            tooltip="Italic"
            shortcut="⌘I"
          >
            <Italic className="size-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            isActive={editor.isActive("underline")}
            tooltip="Underline"
            shortcut="⌘U"
          >
            <UnderlineIcon className="size-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleCode().run()}
            isActive={editor.isActive("code")}
            tooltip="Inline Code"
            shortcut="⌘E"
          >
            <Code className="size-4" />
          </ToolbarButton>

          <ToolbarDivider />

          {/* Lists & Quote */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={editor.isActive("bulletList")}
            tooltip="Bullet List"
            shortcut="⌘⇧8"
          >
            <List className="size-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            isActive={editor.isActive("orderedList")}
            tooltip="Numbered List"
            shortcut="⌘⇧7"
          >
            <ListOrdered className="size-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            isActive={editor.isActive("blockquote")}
            tooltip="Blockquote"
            shortcut="⌘⇧B"
          >
            <Quote className="size-4" />
          </ToolbarButton>

          <ToolbarDivider />

          {/* Link Popover */}
          <Popover
            open={linkOpen}
            onOpenChange={(open: boolean) => {
              if (open && editor) {
                setLinkUrl(editor.getAttributes("link").href ?? "");
              }
              if (!open) setLinkUrl("");
              setLinkOpen(open);
            }}
          >
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                title="Insert Link (⌘K)"
                aria-label="Insert Link"
                className={cn(
                  "size-8 rounded-lg transition-all duration-150",
                  editor.isActive("link")
                    ? "bg-primary/15 text-primary shadow-sm ring-1 ring-primary/10"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <LinkIcon className="size-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              side="bottom"
              align="start"
              sideOffset={8}
              className="w-80 rounded-xl p-3 space-y-3"
            >
              <p className="text-sm font-semibold">Insert Link</p>
              <div className="flex gap-2">
                <Input
                  placeholder="https://example.com"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleLinkSubmit();
                    }
                  }}
                  className="h-8 rounded-lg text-sm"
                  autoFocus
                />
                <Button
                  size="sm"
                  className="h-8 shrink-0 rounded-lg px-3"
                  onClick={handleLinkSubmit}
                >
                  Apply
                </Button>
              </div>
              {editor.isActive("link") && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-full justify-start gap-1.5 rounded-lg text-xs text-destructive hover:text-destructive"
                  onClick={removeLink}
                >
                  <Unlink className="size-3" />
                  Remove link
                </Button>
              )}
            </PopoverContent>
          </Popover>

          {/* Undo / Redo */}
          <div className="ml-auto flex items-center gap-0.5">
            <ToolbarButton
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
              tooltip="Undo"
              shortcut="⌘Z"
            >
              <Undo className="size-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
              tooltip="Redo"
              shortcut="⌘⇧Z"
            >
              <Redo className="size-4" />
            </ToolbarButton>
          </div>
        </div>

        {/* ── Editor Area ── */}
        <ScrollArea style={{ maxHeight }}>
          <EditorContent editor={editor} />
        </ScrollArea>

        {/* ── Footer ── */}
        <div className="flex items-center justify-between border-t bg-muted/20 px-4 py-1.5">
          <span className="text-[11px] tabular-nums text-muted-foreground">
            {wordCount} {wordCount === 1 ? "word" : "words"}
          </span>
          <span className="text-[11px] text-muted-foreground">
            Type{" "}
            <kbd className="rounded border border-border/60 bg-muted/80 px-1 py-0.5 font-mono text-[10px]">
              @
            </kbd>{" "}
            to mention
          </span>
        </div>
      </div>
    </TooltipProvider>
  );
}

/* ────────────────────────────────────────────
   Rich Text Display (Read-only render)
   ──────────────────────────────────────────── */

export function RichTextDisplay({ content, className }: { content: string; className?: string }) {
  return (
    <div
      className={cn(
        "prose prose-sm dark:prose-invert max-w-none",
        "prose-p:leading-relaxed prose-headings:font-bold prose-headings:tracking-tight",
        "prose-a:text-primary prose-a:no-underline hover:prose-a:underline",
        "prose-blockquote:border-l-primary/40 prose-blockquote:text-muted-foreground",
        "prose-code:bg-muted prose-code:rounded-md prose-code:px-1.5 prose-code:py-0.5 prose-code:text-[13px] prose-code:font-medium prose-code:before:content-none prose-code:after:content-none",
        "prose-img:rounded-xl prose-img:shadow-sm prose-img:border prose-img:border-border/30",
        className
      )}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}
