
'use client';
import { Node, mergeAttributes } from '@tiptap/core';

export const Callout = Node.create({
  name: 'callout',
  group: 'block',
  content: 'inline*',
  
  addAttributes() {
    return {
      'data-type': {
        default: 'info',
        // Here you could add more types like 'warning', 'danger', etc.
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
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'callout' }), 0];
  },

  addCommands() {
    return {
      toggleCallout: () => ({ commands, editor }) => {
        const { selection } = editor.state;
        const { $from, $to } = selection;
        const range = { from: $from.pos, to: $to.pos };
        
        let isSelectionInCallout = false;
        editor.state.doc.nodesBetween(range.from, range.to, (node) => {
            if (node.type.name === this.name) {
                isSelectionInCallout = true;
            }
        });

        if (isSelectionInCallout) {
          return commands.lift(this.name);
        }
        return commands.wrapIn(this.name);
      },
    };
  },
});
