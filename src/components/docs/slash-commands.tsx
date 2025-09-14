
import { Extension } from '@tiptap/core';
import Suggestion from '@tiptap/suggestion';
import { ReactRenderer } from '@tiptap/react';
import {
  Heading1, Heading2, Heading3, Heading4, Heading5, Heading6, List, ListOrdered, Code, Quote, Image, Table, Minus, MessageSquareQuote, Calendar, SigmaSquare, Columns
} from 'lucide-react';
import tippy, { Instance } from 'tippy.js';
import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { cn } from '@/lib/utils';


const commands = [
  { title: 'Heading 1', icon: Heading1, command: ({ editor, range }: any) => editor.chain().focus().deleteRange(range).setNode('heading', { level: 1 }).run() },
  { title: 'Heading 2', icon: Heading2, command: ({ editor, range }: any) => editor.chain().focus().deleteRange(range).setNode('heading', { level: 2 }).run() },
  { title: 'Heading 3', icon: Heading3, command: ({ editor, range }: any) => editor.chain().focus().deleteRange(range).setNode('heading', { level: 3 }).run() },
  { title: 'Heading 4', icon: Heading4, command: ({ editor, range }: any) => editor.chain().focus().deleteRange(range).setNode('heading', { level: 4 }).run() },
  { title: 'Heading 5', icon: Heading5, command: ({ editor, range }: any) => editor.chain().focus().deleteRange(range).setNode('heading', { level: 5 }).run() },
  { title: 'Heading 6', icon: Heading6, command: ({ editor, range }: any) => editor.chain().focus().deleteRange(range).setNode('heading', { level: 6 }).run() },
  { title: 'Bullet List', icon: List, command: ({ editor, range }: any) => editor.chain().focus().deleteRange(range).toggleBulletList().run() },
  { title: 'Numbered List', icon: ListOrdered, command: ({ editor, range }: any) => editor.chain().focus().deleteRange(range).toggleOrderedList().run() },
  { title: 'Callout', icon: MessageSquareQuote, command: ({ editor, range }: any) => editor.chain().focus().deleteRange(range).toggleCallout().run() },
  { title: 'Blockquote', icon: Quote, command: ({ editor, range }: any) => editor.chain().focus().deleteRange(range).toggleBlockquote().run() },
  { title: 'Code Block', icon: Code, command: ({ editor, range }: any) => editor.chain().focus().deleteRange(range).toggleCodeBlock().run() },
  { title: 'Equation', icon: SigmaSquare, command: ({ editor, range }: any) => editor.chain().focus().deleteRange(range).toggleEquation().run() },
  { title: 'Divider', icon: Minus, command: ({ editor, range }: any) => editor.chain().focus().deleteRange(range).setHorizontalRule().run() },
  { title: 'Date', icon: Calendar, command: ({ editor, range }: any) => editor.chain().focus().deleteRange(range).insertContent(new Date().toLocaleDateString()).run() },
  { title: 'Image', icon: Image, command: ({ editor, range }: any) => {
    const url = window.prompt('Image URL');
    if (url) {
      editor.chain().focus().deleteRange(range).setImage({ src: url }).run();
    }
  }},
  { title: 'Table', icon: Table, command: ({ editor, range }: any) => editor.chain().focus().deleteRange(range).insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run() },
  { title: 'Columns', icon: Columns, command: ({ editor, range }: any) => editor.chain().focus().deleteRange(range).insertTable({ rows: 1, cols: 2, withHeaderRow: false }).run() },
];

const CommandList = forwardRef((props: { items: any[], command: (item: any) => void }, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0);

    useEffect(() => setSelectedIndex(0), [props.items]);
    
    const selectItem = (index: number) => {
        const item = props.items[index];
        if (item) {
            props.command(item);
        }
    };
    
    const upHandler = () => {
        setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length);
    };

    const downHandler = () => {
        setSelectedIndex((selectedIndex + 1) % props.items.length);
    };

    const enterHandler = () => {
        selectItem(selectedIndex);
    };

    useImperativeHandle(ref, () => ({
        onKeyDown: ({ event }: { event: React.KeyboardEvent }) => {
            if (event.key === 'ArrowUp') {
                upHandler();
                return true;
            }
            if (event.key === 'ArrowDown') {
                downHandler();
                return true;
            }
            if (event.key === 'Enter') {
                enterHandler();
                return true;
            }
            return false;
        }
    }));


  return (
    <div className="bg-card border shadow-lg rounded-lg p-2">
      {props.items.length ? (
        props.items.map((item, index) => (
            <button
              key={index}
              onClick={() => selectItem(index)}
              className={cn("flex items-center gap-2 p-2 rounded-md hover:bg-accent w-full text-left",
                index === selectedIndex && "bg-accent"
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.title}
            </button>
        ))
      ) : (
        <div className="p-2">No results</div>
      )}
    </div>
  );
});

CommandList.displayName = "CommandList";


export const slashCommands = Extension.create({
  name: 'slashCommands',
  addOptions() {
    return {
      suggestion: {
        char: '/',
        command: ({ editor, range, props }: any) => {
          props.command({ editor, range });
        },
        items: ({ query }: { query: string }) => {
          return commands.filter(item => item.title.toLowerCase().startsWith(query.toLowerCase())).slice(0, 10);
        },
        appendTo: () => document.body,
      },
    };
  },
  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
        render: () => {
          let component: ReactRenderer;
          let popup: Instance[];

          return {
            onStart: (props: any) => {
              component = new ReactRenderer(CommandList, {
                props,
                editor: props.editor,
              });

              if (!props.clientRect) {
                  return;
              }

              popup = tippy('body', {
                getReferenceClientRect: props.clientRect,
                appendTo: this.options.suggestion.appendTo,
                content: component.element,
                showOnCreate: true,
                interactive: true,
                trigger: 'manual',
                placement: 'bottom-start',
              });
            },
            onUpdate(props: any) {
              component.updateProps(props);
              
               if (!props.clientRect) {
                  return;
              }

              popup[0].setProps({
                getReferenceClientRect: props.clientRect,
              });
            },
            onKeyDown(props: {event: React.KeyboardEvent}) {
              if (props.event.key === 'Escape') {
                popup[0].hide();
                return true;
              }
              const commandListRef = component.ref as any;
              return commandListRef?.onKeyDown(props);
            },
            onExit() {
              popup[0].destroy();
              component.destroy();
            },
          };
        },
      } as any),
    ];
  },
});
