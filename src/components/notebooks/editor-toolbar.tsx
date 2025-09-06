

'use client';

import { Editor } from '@tiptap/react';
import {
  Bold, Italic, Underline, Strikethrough, Heading1, Heading2, Heading3,
  List, ListOrdered, Link, Quote, Code, Table,
} from 'lucide-react';
import { Toggle } from '@/components/ui/toggle';
import { Separator } from '@/components/ui/separator';
import { useCallback } from 'react';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface EditorToolbarProps {
  editor: Editor;
}

const ToolbarButton = ({
  editor,
  name,
  label,
  icon: Icon,
  onClick,
  level,
}: {
  editor: Editor;
  name: string;
  label: string;
  icon: React.ElementType;
  onClick?: () => void;
  level?: number;
}) => {
  const isActive = level ? editor.isActive(name, { level }) : editor.isActive(name);
  const action = onClick || (() => {
    const chain = editor.chain().focus();
    const command = `toggle${name.charAt(0).toUpperCase() + name.slice(1)}`;
    if (typeof (chain as any)[command] === 'function') {
      if (level) {
        (chain as any)[command]({ level }).run();
      } else {
        (chain as any)[command]().run();
      }
    }
  });

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Toggle size="sm" pressed={isActive} onPressedChange={action}>
          <Icon className="h-4 w-4" />
        </Toggle>
      </TooltipTrigger>
      <TooltipContent>
        <p>{label}</p>
      </TooltipContent>
    </Tooltip>
  );
};


export function EditorToolbar({ editor }: EditorToolbarProps) {
  const setLink = useCallback(() => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);

    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  if (!editor) {
    return null;
  }

  return (
    <TooltipProvider>
      <div className="flex items-center gap-1 p-2 border-t mt-2">
        <ToolbarButton editor={editor} name="bold" label="Bold" icon={Bold} />
        <ToolbarButton editor={editor} name="italic" label="Italic" icon={Italic} />
        <ToolbarButton editor={editor} name="underline" label="Underline" icon={Underline} />
        <ToolbarButton editor={editor} name="strike" label="Strikethrough" icon={Strikethrough} />
        <Separator orientation="vertical" className="h-6 mx-1" />
        <ToolbarButton editor={editor} name="heading" label="Heading 1" icon={Heading1} level={1} />
        <ToolbarButton editor={editor} name="heading" label="Heading 2" icon={Heading2} level={2} />
        <ToolbarButton editor={editor} name="heading" label="Heading 3" icon={Heading3} level={3} />
        <Separator orientation="vertical" className="h-6 mx-1" />
        <ToolbarButton editor={editor} name="bulletList" label="Bullet List" icon={List} />
        <ToolbarButton editor={editor} name="orderedList" label="Numbered List" icon={ListOrdered} />
        <Separator orientation="vertical" className="h-6 mx-1" />
        <ToolbarButton editor={editor} name="link" label="Link" icon={Link} onClick={setLink} />
        <ToolbarButton editor={editor} name="blockquote" label="Blockquote" icon={Quote} />
        <ToolbarButton editor={editor} name="codeBlock" label="Code Block" icon={Code} />
        <ToolbarButton editor={editor} name="table" label="Table" icon={Table} onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} />
      </div>
    </TooltipProvider>
  );
}
