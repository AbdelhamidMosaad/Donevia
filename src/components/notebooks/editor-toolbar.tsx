
'use client';

import { Editor } from '@tiptap/react';
import {
  Bold, Italic, Underline, Strikethrough, Heading1, Heading2, Heading3,
  List, ListOrdered, Link, Quote, Code, CaseSensitive, Check, Brush, Save, Loader2
} from 'lucide-react';
import { Toggle } from '@/components/ui/toggle';
import { Separator } from '@/components/ui/separator';
import { useCallback, useState } from 'react';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";


const fonts = [
    { name: 'Inter', value: 'Inter, sans-serif' },
    { name: 'Roboto', value: 'Roboto, sans-serif' },
    { name: 'Lato', value: 'Lato, sans-serif' },
    { name: 'Montserrat', value: 'Montserrat, sans-serif' },
    { name: 'Oswald', value: 'Oswald, sans-serif' },
    { name: 'Source Code Pro', value: 'Source Code Pro, monospace' },
    { name: 'Merriweather', value: 'Merriweather, serif' },
    { name: 'Playfair Display', value: 'Playfair Display, serif' },
    // Handwriting
    { name: 'Caveat', value: 'Caveat, cursive' },
    { name: 'Dancing Script', value: 'Dancing Script, cursive' },
    { name: 'Kalam', value: 'Kalam, cursive' },
    { name: 'Patrick Hand', value: 'Patrick Hand, cursive' },
    { name: 'Homemade Apple', value: 'Homemade Apple, cursive' },
    // More fonts
    { name: 'Alegreya', value: 'Alegreya, serif' },
    { name: 'EB Garamond', value: 'EB Garamond, serif' },
    { name: 'Fira Sans', value: 'Fira Sans, sans-serif' },
    { name: 'Nunito', value: 'Nunito, sans-serif' },
    { name: 'Poppins', value: 'Poppins, sans-serif' },
    { name: 'Raleway', value: 'Raleway, sans-serif' },
    { name: 'Rubik', value: 'Rubik, sans-serif' },
    { name: 'Ubuntu', value: 'Ubuntu, sans-serif' },
];

const canvasColors = [
    '#FFFFFF', '#F8F8F8', // Whites
    '#FFFACD', '#FFFFE0', // Light Yellows
    '#F0FFF0', '#F5FFFA', // Mint Greens
    '#F0F8FF', '#E6E6FA', // Light Blues & Lavenders
    '#FFF0F5', '#FFE4E1', // Pinks
    '#FAFAD2', '#FFEFD5', // Light Goldenrod & PapayaWhip
    '#F8FAB4', '#F7F4EA',
    '#F3F2EC', '#FFF5F2',
    '#FAF7F3', '#91C8E4',
    '#80D8C3'
];


interface EditorToolbarProps {
  editor: Editor;
  onColorChange: (color: string) => void;
  initialColor?: string;
  onManualSave: () => void;
  saveStatus: 'saved' | 'saving' | 'conflict' | 'error' | 'unsaved';
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


export function EditorToolbar({ editor, onColorChange, initialColor, onManualSave, saveStatus }: EditorToolbarProps) {
  const [currentColor, setCurrentColor] = useState(initialColor || '#FFFFFF');
  
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
  
  const handleFontChange = (fontFamily: string) => {
    if (fontFamily === 'default') {
        editor.chain().focus().unsetFontFamily().run();
    } else {
        editor.chain().focus().setFontFamily(fontFamily).run();
    }
  };

  const handleColorChange = (color: string) => {
    setCurrentColor(color);
    onColorChange(color);
  }

  if (!editor) {
    return null;
  }
  
  const activeFont = editor.getAttributes('textStyle').fontFamily?.replace(/['"]/g, '') || 'default';

  return (
    <TooltipProvider>
      <div className="flex items-center gap-1 p-2 border rounded-md bg-background sticky top-0 z-10 mb-4 flex-wrap">
        <Select value={activeFont} onValueChange={handleFontChange}>
            <Tooltip>
                 <TooltipTrigger asChild>
                    <SelectTrigger className="w-[140px] h-9">
                        <SelectValue placeholder="Font" />
                    </SelectTrigger>
                 </TooltipTrigger>
                 <TooltipContent>
                    <p>Font Family</p>
                </TooltipContent>
            </Tooltip>
            <SelectContent>
                <SelectItem value="default">Default</SelectItem>
                {fonts.map(font => (
                    <SelectItem key={font.name} value={font.value} style={{fontFamily: font.value}}>
                        {font.name}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>

        <Separator orientation="vertical" className="h-6 mx-1" />
        
        {/* Mark Group */}
        <ToolbarButton editor={editor} name="bold" label="Bold" icon={Bold} />
        <ToolbarButton editor={editor} name="italic" label="Italic" icon={Italic} />
        <ToolbarButton editor={editor} name="underline" label="Underline" icon={Underline} />
        <ToolbarButton editor={editor} name="strike" label="Strikethrough" icon={Strikethrough} />

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Heading Group */}
        <ToolbarButton editor={editor} name="heading" label="Heading 1" icon={Heading1} level={1} />
        <ToolbarButton editor={editor} name="heading" label="Heading 2" icon={Heading2} level={2} />
        <ToolbarButton editor={editor} name="heading" label="Heading 3" icon={Heading3} level={3} />
        
        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* List Group */}
        <ToolbarButton editor={editor} name="bulletList" label="Bullet List" icon={List} />
        <ToolbarButton editor={editor} name="orderedList" label="Numbered List" icon={ListOrdered} />
        
        <Separator orientation="vertical" className="h-6 mx-1" />
        
        {/* Block Group */}
        <ToolbarButton editor={editor} name="link" label="Link" icon={Link} onClick={setLink} />
        <ToolbarButton editor={editor} name="blockquote" label="Blockquote" icon={Quote} />
        <ToolbarButton editor={editor} name="codeBlock" label="Code Block" icon={Code} />
        
        <Separator orientation="vertical" className="h-6 mx-1" />
        
        {/* Canvas Color */}
         <Popover>
            <Tooltip>
                <TooltipTrigger asChild>
                    <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="h-9">
                        <Brush className="h-4 w-4 mr-2" />
                        Canvas Color
                        </Button>
                    </PopoverTrigger>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Change canvas background</p>
                </TooltipContent>
            </Tooltip>
            <PopoverContent className="w-auto p-2">
                <div className="grid grid-cols-6 gap-1">
                {canvasColors.map((c) => (
                    <button
                    key={c}
                    onClick={() => handleColorChange(c)}
                    className={cn(
                        'h-8 w-8 rounded-full border border-gray-300 flex items-center justify-center'
                    )}
                    style={{ backgroundColor: c }}
                    >
                    {currentColor === c && <Check className="h-4 w-4 text-black" />}
                    </button>
                ))}
                </div>
            </PopoverContent>
         </Popover>

         <div className="flex-grow" />

         <Tooltip>
            <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={onManualSave} disabled={saveStatus === 'saving' || saveStatus === 'saved'}>
                    {saveStatus === 'saving' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                </Button>
            </TooltipTrigger>
            <TooltipContent>
                <p>Save Progress</p>
            </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
