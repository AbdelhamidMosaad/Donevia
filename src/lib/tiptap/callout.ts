
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
      toggleCallout: () => ({ commands }) => {
        return commands.toggleWrap(this.name)
      },
    };
  },
});
