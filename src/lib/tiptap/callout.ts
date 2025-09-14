'use client';
import { Node, mergeAttributes } from '@tiptap/core';

export const Callout = Node.create({
  name: 'callout',
  group: 'block',
  content: 'inline*',

  addAttributes() {
    return {
      'data-type': {
        default: 'callout',
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="callout"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'callout', class: 'tiptap-callout' }), 0];
  },

  addCommands() {
    return {
      // explicit insert command
      insertCallout:
        () =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: { 'data-type': 'callout' },
            content: [{ type: 'text', text: 'New callout' }],
          });
        },

      // toggle for toolbar compatibility (if already in a callout -> convert to paragraph, else insert)
      toggleCallout:
        () =>
        ({ commands, editor }) => {
          if (editor.isActive(this.name)) {
            return commands.setParagraph();
          }
          return commands.insertContent({
            type: this.name,
            attrs: { 'data-type': 'callout' },
            content: [{ type: 'text', text: 'New callout' }],
          });
        },
    };
  },
});
