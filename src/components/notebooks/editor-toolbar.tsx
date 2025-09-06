

'use client';

import { Editor } from '@tiptap/react';
import {
  Bold, Italic, Underline, Strikethrough, Heading1, Heading2, Heading3,
  List, ListOrdered, Link, Quote, Code, CaseSensitive, Check, Brush, Save, Loader2, ChevronDown, Palette, Pilcrow, Type
} from 'lucide-react';
import { Toggle } from '@/components/ui/toggle';
import { Separator } from '@/components/ui/separator';
import { useCallback, useState } from 'react';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent } from '../ui/dropdown-menu';
import { ToolbarTabs, Tab } from './toolbar-tabs';

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

const fontSizes = ['12px', '14px', '16px', '18px', '20px', '24px', '30px', '36px', '48px'];


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

const textColors = [
    { name: 'Black', value: '#000000' },
    { name: 'White', value: '#FFFFFF' },
    { name: 'Dark Gray', value: '#333333' },
    { name: 'Gray', value: '#6B7280' },
    { name: 'Light Gray', value: '#D1D5DB' },
    { name: 'Red', value: '#EF4444' },
    { name: 'Pink', value: '#EC4899' },
    { name: 'Grape', value: '#D946EF' },
    { name: 'Violet', value: '#8B5CF6' },
    { name: 'Indigo', value: '#6366F1' },
    { name: 'Blue', value: '#3B82F6' },
    { name: 'Cyan', value: '#22D3EE' },
    { name: 'Teal', value: '#2DD4BF' },
    { name: 'Green', value: '#22C55E' },
    { name: 'Lime', value: '#84CC16' },
    { name: 'Yellow', value: '#FACC15' },
    { name: 'Orange', value: '#F97316' },
    { name: 'Brown', value: '#854D0E' },
];


interface EditorToolbarProps {
  editor: Editor;
  onColorChange: (color: string) => void;
  initialColor?: string;
  onManualSave: () => void;
  saveStatus: 'saved' | 'saving' | 'conflict' | 'error' | 'unsaved';
  container?: HTMLElement | null;
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
        <Toggle size="sm" pressed={isActive} onPressedChange={action} className="text-black">
          <Icon className="h-4 w-4" />
        </Toggle>
      </TooltipTrigger>
      <TooltipContent>
        <p>{label}</p>
      </TooltipContent>
    </Tooltip>
  );
};


export function EditorToolbar({ editor, onColorChange, initialColor, onManualSave, saveStatus, container }: EditorToolbarProps) {
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

  const handleFontSizeChange = (fontSize: string) => {
    if (fontSize === 'default') {
      editor.chain().focus().unsetFontSize().run();
    } else {
      editor.chain().focus().setFontSize(fontSize).run();
    }
  };

  
  const handleTextColorChange = (color: string) => {
    editor.chain().focus().setColor(color).run();
  };


  const handleColorChange = (color: string) => {
    setCurrentColor(color);
    onColorChange(color);
  }

  if (!editor) {
    return null;
  }
  
  const activeFont = editor.getAttributes('textStyle').fontFamily?.replace(/['"]/g, '') || 'default';
  const activeFontSize = editor.getAttributes('textStyle').fontSize || 'default';
  const activeColor = editor.getAttributes('textStyle').color || '#000000';

  return (
    <TooltipProvider>
      <ToolbarTabs>
        <Tab name="File">
             <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={onManualSave} disabled={saveStatus === 'saving' || saveStatus === 'saved'} className="text-black">
                        {saveStatus === 'saving' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Save Progress</p>
                </TooltipContent>
            </Tooltip>
        </Tab>
        <Tab name="Home">
            <Select value={activeFont} onValueChange={handleFontChange}>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <SelectTrigger className="w-[140px] h-9 text-black">
                            <SelectValue placeholder="Font" />
                        </SelectTrigger>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Font Family</p>
                    </TooltipContent>
                </Tooltip>
                <SelectContent container={container}>
                    <SelectItem value="default">Default</SelectItem>
                    {fonts.map(font => (
                        <SelectItem key={font.name} value={font.value} style={{fontFamily: font.value}}>
                            {font.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <Select value={activeFontSize} onValueChange={handleFontSizeChange}>
                <Tooltip>
                    <TooltipTrigger asChild>
                    <SelectTrigger className="w-[80px] h-9 text-black">
                        <SelectValue placeholder="Size" />
                    </SelectTrigger>
                    </TooltipTrigger>
                    <TooltipContent>
                    <p>Font Size</p>
                    </TooltipContent>
                </Tooltip>
                <SelectContent container={container}>
                    <SelectItem value="default">Default</SelectItem>
                    {fontSizes.map((size) => (
                    <SelectItem key={size} value={size}>
                        {size}
                    </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            
            <DropdownMenu>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="icon" className="h-9 w-9">
                                <Palette className="h-4 w-4" style={{ color: activeColor }} />
                            </Button>
                        </DropdownMenuTrigger>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Text Color</p>
                    </TooltipContent>
                </Tooltip>
                <DropdownMenuContent className="grid grid-cols-4 gap-1 p-2" align="start" container={container}>
                    {textColors.map((color) => (
                        <DropdownMenuItem
                            key={color.name}
                            onSelect={() => handleTextColorChange(color.value)}
                            className="flex justify-center items-center p-1"
                        >
                            <div
                                className="h-6 w-6 rounded-full border"
                                style={{ backgroundColor: color.value }}
                            />
                            {activeColor === color.value && <Check className="h-4 w-4 absolute" style={{color: color.value === '#FFFFFF' ? '#000000' : '#FFFFFF'}}/>}
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>

            <Separator orientation="vertical" className="h-6 mx-1" />
            
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
        </Tab>
        <Tab name="Insert">
            <ToolbarButton editor={editor} name="link" label="Link" icon={Link} onClick={setLink} />
            <ToolbarButton editor={editor} name="blockquote" label="Blockquote" icon={Quote} />
            <ToolbarButton editor={editor} name="codeBlock" label="Code Block" icon={Code} />
        </Tab>
        <Tab name="View">
            <DropdownMenu>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="h-9 text-black">
                                <Brush className="h-4 w-4 mr-2" />
                                Canvas Color
                                <ChevronDown className="h-4 w-4 ml-2" />
                            </Button>
                        </DropdownMenuTrigger>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Change canvas background</p>
                    </TooltipContent>
                </Tooltip>
                <DropdownMenuContent container={container}>
                    {canvasColors.map((c) => (
                        <DropdownMenuItem key={c} onSelect={() => handleColorChange(c)}>
                            <div className="flex items-center gap-2">
                            <div className="h-4 w-4 rounded-full border" style={{ backgroundColor: c }} />
                            <span>{c}</span>
                            </div>
                            {currentColor === c && <Check className="h-4 w-4 ml-auto" />}
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
        </Tab>
      </ToolbarTabs>
    </TooltipProvider>
  );
}
