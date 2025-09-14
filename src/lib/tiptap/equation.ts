
'use client';
import { Node, mergeAttributes } from '@tiptap/core';

export const Equation = Node.create({
  name: 'equation',
  group: 'block',
  content: 'text*',
  
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
      toggleEquation: () => ({ commands, state }) => {
        const { selection } = state;
        const isSelectionInEquation = selection.$from.findParent(this.name);
        
        if (isSelectionInEquation) {
            return commands.lift(this.name);
        }

        return commands.wrapIn(this.name);
      },
    };
  },
});
