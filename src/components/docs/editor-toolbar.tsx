
'use client';

import { Editor } from '@tiptap/react';
import {
  Bold, Italic, Underline, Strikethrough, Heading1, Heading2, Heading3,
  List, ListOrdered, Link, Quote, Code, Table,
  AlignLeft, AlignCenter, AlignRight, AlignJustify, Type, Pilcrow, Highlighter, Palette,
  Undo, Redo, Superscript, Subscript, Image as ImageIcon, Minus, Upload, CaseSensitive,
  Trash2, ChevronsLeftRight, ChevronsUpDown, FlipVertical, FlipHorizontal, Square, Columns, Rows, PilcrowLeft
} from 'lucide-react';
import { Toggle } from '@/components/ui/toggle';
import { Separator } from '@/components/ui/separator';
import { useCallback, useRef } from 'react';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Button } from '../ui/button';
import { useAuth } from '@/hooks/use-auth';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { useToast } from '@/hooks/use-toast';

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
  name?: string;
  label: string;
  icon: React.ElementType;
  onClick?: () => void;
  level?: number;
  align?: string;
}) => {
  const isActive = name ? (align ? editor.isActive({ textAlign: align }) : (level ? editor.isActive(name, { level }) : editor.isActive(name))) : false;

  const action = onClick || (() => {
    if (!name) return;
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
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const addImage = useCallback(() => {
    const url = window.prompt('Image URL');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  }, [editor]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || !user) return;
    const file = event.target.files[0];
    
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast({ variant: 'destructive', title: 'File too large', description: 'Please upload images smaller than 5MB.' });
      return;
    }

    const storage = getStorage();
    const filePath = `users/${user.uid}/docs/images/${Date.now()}_${file.name}`;
    const fileRef = storageRef(storage, filePath);

    try {
      const snapshot = await uploadBytes(fileRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      editor.chain().focus().setImage({ src: downloadURL }).run();
      toast({ title: 'Image uploaded successfully!' });
    } catch (error) {
      console.error("Error uploading image:", error);
      toast({ variant: 'destructive', title: 'Image upload failed' });
    }
  };

  if (!editor) {
    return null;
  }
  
  const fontSizes = ['12px', '14px', '16px', '18px', '24px', '30px', '36px'];
  const fontFamilies = [
    { name: 'Inter', value: 'Inter, sans-serif' },
    { name: 'Arial', value: 'Arial, sans-serif' },
    { name: 'Georgia', value: 'Georgia, serif' },
    { name: 'Times New Roman', value: '\'Times New Roman\', serif' },
    { name: 'Courier New', value: '\'Courier New\', monospace' },
    { name: 'Verdana', value: 'Verdana, sans-serif' },
    { name: 'Poppins', value: 'Poppins, sans-serif' },
  ];

  return (
    <TooltipProvider>
      <div className="flex items-center gap-x-1 gap-y-2 p-2 border-t mt-2 flex-wrap">
        <ToolbarButton editor={editor} onClick={() => editor.chain().focus().undo().run()} label="Undo" icon={Undo} />
        <ToolbarButton editor={editor} onClick={() => editor.chain().focus().redo().run()} label="Redo" icon={Redo} />

        <Separator orientation="vertical" className="h-6 mx-1" />

        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="w-auto text-left justify-start">
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
                <Button variant="ghost" size="sm" className="w-auto text-left justify-start">
                    <CaseSensitive className="h-4 w-4 mr-2" />
                     {editor.getAttributes('textStyle').fontFamily?.split(',')[0].replace(/'/g, '') || 'Inter'}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                {fontFamilies.map(font => (
                    <DropdownMenuItem key={font.name} onSelect={() => editor.chain().focus().setFontFamily(font.value).run()} style={{fontFamily: font.value}}>
                        {font.name}
                    </DropdownMenuItem>
                ))}
                 <DropdownMenuItem onSelect={() => editor.chain().focus().unsetFontFamily().run()}>
                    Reset
                 </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="w-auto text-left justify-start">
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

        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="w-auto text-left justify-start">
                    <PilcrowLeft className="h-4 w-4 mr-2" />
                    Text Transform
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                <DropdownMenuItem onSelect={() => editor.commands.transform('uppercase')}>UPPERCASE</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => editor.commands.transform('lowercase')}>lowercase</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => editor.commands.transform('capitalize')}>Capitalize</DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>

        <Separator orientation="vertical" className="h-6 mx-1" />
        
        <Tooltip>
            <TooltipTrigger asChild>
                <Toggle size="sm" asChild>
                    <label style={{ color: editor.getAttributes('textStyle').color }} className="relative p-2 rounded-md hover:bg-muted cursor-pointer">
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
                     <label className="relative p-2 rounded-md hover:bg-muted cursor-pointer">
                        <Highlighter className="h-4 w-4" />
                        <input
                            type="color"
                            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                            onInput={(event) => editor.chain().focus().toggleHighlight({ color: (event.target as HTMLInputElement).value }).run()}
                            value={editor.getAttributes('highlight')?.color || '#ffffff'}
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
        <ToolbarButton editor={editor} name="superscript" label="Superscript" icon={Superscript} />
        <ToolbarButton editor={editor} name="subscript" label="Subscript" icon={Subscript} />


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
        <ToolbarButton editor={editor} label="Image from URL" icon={ImageIcon} onClick={addImage} />
        <ToolbarButton editor={editor} label="Horizontal Line" icon={Minus} onClick={() => editor.chain().focus().setHorizontalRule().run()} />
        
        <Tooltip>
            <TooltipTrigger asChild>
                <Toggle size="sm" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="h-4 w-4" />
                </Toggle>
            </TooltipTrigger>
            <TooltipContent>
                <p>Upload Image</p>
            </TooltipContent>
        </Tooltip>
        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
        
        <Separator orientation="vertical" className="h-6 mx-1" />
        
        <ToolbarButton editor={editor} name="table" label="Table" icon={Table} onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} />

        {editor.isActive('table') && (
            <>
                <ToolbarButton editor={editor} onClick={() => editor.chain().focus().addColumnBefore().run()} label="Add Column Before" icon={Columns} />
                <ToolbarButton editor={editor} onClick={() => editor.chain().focus().addColumnAfter().run()} label="Add Column After" icon={Columns} />
                <ToolbarButton editor={editor} onClick={() => editor.chain().focus().deleteColumn().run()} label="Delete Column" icon={Trash2} />
                <ToolbarButton editor={editor} onClick={() => editor.chain().focus().addRowBefore().run()} label="Add Row Before" icon={Rows} />
                <ToolbarButton editor={editor} onClick={() => editor.chain().focus().addRowAfter().run()} label="Add Row After" icon={Rows} />
                <ToolbarButton editor={editor} onClick={() => editor.chain().focus().deleteRow().run()} label="Delete Row" icon={Trash2} />
                <ToolbarButton editor={editor} onClick={() => editor.chain().focus().deleteTable().run()} label="Delete Table" icon={Trash2} />
                <ToolbarButton editor={editor} onClick={() => editor.chain().focus().mergeCells().run()} label="Merge Cells" icon={Square} />
                <ToolbarButton editor={editor} onClick={() => editor.chain().focus().splitCell().run()} label="Split Cell" icon={ChevronsLeftRight} />
                <ToolbarButton editor={editor} onClick={() => editor.chain().focus().toggleHeaderColumn().run()} label="Toggle Header Column" icon={FlipHorizontal} />
                <ToolbarButton editor={editor} onClick={() => editor.chain().focus().toggleHeaderRow().run()} label="Toggle Header Row" icon={FlipVertical} />
                <ToolbarButton editor={editor} onClick={() => editor.chain().focus().toggleHeaderCell().run()} label="Toggle Header Cell" icon={Square} />
            </>
        )}
      </div>
    </TooltipProvider>
  );
}
