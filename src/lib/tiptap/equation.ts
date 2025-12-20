
'use client';
import { Node, mergeAttributes } from '@tiptap/core';

export const Equation = Node.create({
  name: 'equation',
  group: 'block',
  content: 'text*', // allow editing inside the block (remove `atom: true` if previously set)

  addAttributes() {
    return {
      'data-type': {
        default: 'equation',
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="equation"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'equation' }), 0];
  },

  addCommands() {
    return {
      // explicit insert command
      insertEquation:
        () =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: { 'data-type': 'equation' },
            content: [{ type: 'text', text: 'New equation' }],
          });
        },

      // toggle (if selection already in equation -> set paragraph, else insert)
      toggleEquation:
        () =>
        ({ commands, editor }) => {
          if (editor.isActive(this.name)) {
            return commands.setParagraph();
          }
          return commands.insertContent({
            type: this.name,
            attrs: { 'data-type': 'equation' },
            content: [{ type: 'text', text: 'New equation' }],
          });
        },
    };
  },
});
