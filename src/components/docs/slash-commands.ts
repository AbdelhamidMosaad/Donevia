
import { Extension } from '@tiptap/core';
import Suggestion from '@tiptap/suggestion';
import { ReactRenderer } from '@tiptap/react';
import {
  Heading1, Heading2, Heading3, List, ListOrdered, Code, Quote, Image, Table
} from 'lucide-react';
import tippy from 'tippy.js';

const commands = [
  { title: 'Heading 1', icon: Heading1, command: ({ editor, range }: any) => editor.chain().focus().deleteRange(range).setNode('heading', { level: 1 }).run() },
  { title: 'Heading 2', icon: Heading2, command: ({ editor, range }: any) => editor.chain().focus().deleteRange(range).setNode('heading', { level: 2 }).run() },
  { title: 'Heading 3', icon: Heading3, command: ({ editor, range }: any) => editor.chain().focus().deleteRange(range).setNode('heading', { level: 3 }).run() },
  { title: 'Bullet List', icon: List, command: ({ editor, range }: any) => editor.chain().focus().deleteRange(range).toggleBulletList().run() },
  { title: 'Numbered List', icon: ListOrdered, command: ({ editor, range }: any) => editor.chain().focus().deleteRange(range).toggleOrderedList().run() },
  { title: 'Code Block', icon: Code, command: ({ editor, range }: any) => editor.chain().focus().deleteRange(range).toggleCodeBlock().run() },
  { title: 'Blockquote', icon: Quote, command: ({ editor, range }: any) => editor.chain().focus().deleteRange(range).toggleBlockquote().run() },
  { title: 'Image', icon: Image, command: ({ editor, range }: any) => {
    const url = window.prompt('Image URL');
    if (url) {
      editor.chain().focus().deleteRange(range).setImage({ src: url }).run();
    }
  }},
  { title: 'Table', icon: Table, command: ({ editor, range }: any) => editor.chain().focus().deleteRange(range).insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run() },
];

const CommandList = ({ items, command }: { items: any[], command: (item: any) => void }) => {
  return (
    <div className="bg-card border shadow-lg rounded-lg p-2">
      {items.map((item, index) => (
        <button
          key={index}
          onClick={() => command(item)}
          className="flex items-center gap-2 p-2 rounded-md hover:bg-accent w-full text-left"
        >
          <item.icon className="w-5 h-5" />
          {item.title}
        </button>
      ))}
    </div>
  );
};

export const slashCommands = Extension.create({
  name: 'slashCommands',
  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        char: '/',
        command: ({ editor, range, props }) => {
          props.command({ editor, range });
        },
        items: ({ query }) => {
          return commands.filter(item => item.title.toLowerCase().startsWith(query.toLowerCase()));
        },
        render: () => {
          let component: any;
          let popup: any;

          return {
            onStart: props => {
              component = new ReactRenderer(CommandList, {
                props,
                editor: props.editor,
              });

              popup = tippy('body', {
                getReferenceClientRect: props.clientRect,
                appendTo: () => document.body,
                content: component.element,
                showOnCreate: true,
                interactive: true,
                trigger: 'manual',
                placement: 'bottom-start',
              });
            },
            onUpdate(props) {
              component.updateProps(props);
              popup[0].setProps({
                getReferenceClientRect: props.clientRect,
              });
            },
            onKeyDown(props) {
              if (props.event.key === 'Escape') {
                popup[0].hide();
                return true;
              }
              // This is a type error in tiptap's suggestion plugin, component.ref does not exist.
              // but the type says it does. So we cast to any to avoid the error.
              return (component as any).onKeyDown(props);
            },
            onExit() {
              popup[0].destroy();
              component.destroy();
            },
          };
        },
      }),
    ];
  },
});
