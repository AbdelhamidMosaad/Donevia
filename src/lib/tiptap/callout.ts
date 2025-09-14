
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
      toggleCallout: () => ({ commands, state }) => {
        const { selection } = state;
        let isSelectionInCallout = false;
        if(selection.ranges[0]) {
            const fromNode = selection.ranges[0].$from;
            for(let i = fromNode.depth; i > 0; i--) {
                if(fromNode.node(i).type.name === this.name) {
                    isSelectionInCallout = true;
                    break;
                }
            }
        }
        
        if (isSelectionInCallout) {
            return commands.lift(this.name);
        }

        return commands.wrapIn(this.name);
      },
    };
  },
});
