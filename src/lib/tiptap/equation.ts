
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
      toggleEquation: () => ({ commands, editor }) => {
        const { selection } = editor.state;
        const { $from, $to } = selection;
        const range = { from: $from.pos, to: $to.pos };
        
        let isSelectionInEquation = false;
        editor.state.doc.nodesBetween(range.from, range.to, (node) => {
            if (node.type.name === this.name) {
                isSelectionInEquation = true;
            }
        });

        if (isSelectionInEquation) {
            return commands.lift(this.name);
        }
        return commands.wrapIn(this.name);
      },
    };
  },
});
