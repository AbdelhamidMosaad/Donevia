
'use client';

import { Editor } from '@tiptap/react';
import {
  Bold, Italic, Underline, Strikethrough, Heading1, Heading2, Heading3,
  List, ListOrdered, Link, Quote, Code, Table,
  AlignLeft, AlignCenter, AlignRight, AlignJustify, Type, Pilcrow, Highlighter, Palette
} from 'lucide-react';
import { Toggle } from '@/components/ui/toggle';
import { Separator } from '@/components/ui/separator';
import { useCallback } from 'react';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Button } from '../ui/button';

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
  align
}: {
  editor: Editor;
  name: string;
  label: string;
  icon: React.ElementType;
  onClick?: () => void;
  level?: number;
  align?: string;
}) => {
  const isActive = align ? editor.isActive({ textAlign: align }) : (level ? editor.isActive(name, { level }) : editor.isActive(name));

  const action = onClick || (() => {
    const chain = editor.chain().focus();
    if (align) {
        (chain as any).setTextAlign(align).run();
        return;
    }
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
  
  const fontSizes = ['12px', '14px', '16px', '18px', '24px', '30px', '36px'];

  return (
    <TooltipProvider>
      <div className="flex items-center gap-1 p-2 border-t mt-2 flex-wrap">
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="w-24 text-left justify-start">
                    <Pilcrow className="h-4 w-4 mr-2" />
                    {
                        (editor.isActive('heading', {level: 1}) && 'Heading 1') ||
                        (editor.isActive('heading', {level: 2}) && 'Heading 2') ||
                        (editor.isActive('heading', {level: 3}) && 'Heading 3') ||
                        'Paragraph'
                    }
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                <DropdownMenuItem onSelect={() => editor.chain().focus().setParagraph().run()}>Paragraph</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => editor.chain().focus().toggleHeading({level: 1}).run()}>Heading 1</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => editor.chain().focus().toggleHeading({level: 2}).run()}>Heading 2</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => editor.chain().focus().toggleHeading({level: 3}).run()}>Heading 3</DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="w-24 text-left justify-start">
                    <Type className="h-4 w-4 mr-2" />
                     {editor.getAttributes('textStyle').fontSize || '16px'}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                {fontSizes.map(size => (
                    <DropdownMenuItem key={size} onSelect={() => editor.chain().focus().setFontSize(size).run()}>
                        {size}
                    </DropdownMenuItem>
                ))}
                 <DropdownMenuItem onSelect={() => editor.chain().focus().unsetFontSize().run()}>
                    Reset
                 </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>

        <Separator orientation="vertical" className="h-6 mx-1" />
        
        <Tooltip>
            <TooltipTrigger asChild>
                <Toggle size="sm" asChild>
                    <label style={{ color: editor.getAttributes('textStyle').color }} className="relative">
                        <Palette className="h-4 w-4" />
                        <input
                            type="color"
                            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                            onInput={(event) => editor.chain().focus().setColor((event.target as HTMLInputElement).value).run()}
                            value={editor.getAttributes('textStyle').color || '#000000'}
                        />
                    </label>
                </Toggle>
            </TooltipTrigger>
            <TooltipContent>
                <p>Text Color</p>
            </TooltipContent>
        </Tooltip>

        <Tooltip>
            <TooltipTrigger asChild>
                <Toggle size="sm" asChild>
                     <label className="relative">
                        <Highlighter className="h-4 w-4" />
                        <input
                            type="color"
                            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                            onInput={(event) => editor.chain().focus().toggleHighlight({ color: (event.target as HTMLInputElement).value }).run()}
                            value={editor.getAttributes('highlight').color || '#ffffff'}
                        />
                    </label>
                </Toggle>
            </TooltipTrigger>
            <TooltipContent>
                <p>Highlight Color</p>
            </TooltipContent>
        </Tooltip>


        <Separator orientation="vertical" className="h-6 mx-1" />

        <ToolbarButton editor={editor} name="bold" label="Bold" icon={Bold} />
        <ToolbarButton editor={editor} name="italic" label="Italic" icon={Italic} />
        <ToolbarButton editor={editor} name="underline" label="Underline" icon={Underline} />
        <ToolbarButton editor={editor} name="strike" label="Strikethrough" icon={Strikethrough} />

        <Separator orientation="vertical" className="h-6 mx-1" />

        <ToolbarButton editor={editor} name="alignLeft" label="Align Left" icon={AlignLeft} align="left" />
        <ToolbarButton editor={editor} name="alignCenter" label="Align Center" icon={AlignCenter} align="center" />
        <ToolbarButton editor={editor} name="alignRight" label="Align Right" icon={AlignRight} align="right" />
        <ToolbarButton editor={editor} name="alignJustify" label="Align Justify" icon={AlignJustify} align="justify" />

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
