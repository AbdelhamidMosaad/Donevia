
'use client';

import { Extension } from '@tiptap/core';
import { capitalCase, lowerCase, upperCase } from 'change-case-all';

type TransformType = 'uppercase' | 'lowercase' | 'capitalize';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    textTransform: {
      transform: (transformType: TransformType) => ReturnType;
    };
  }
}

export const TextTransform = Extension.create({
  name: 'textTransform',

  addCommands() {
    return {
      transform:
        (transformType: TransformType) =>
        ({ editor, dispatch }) => {
          const { selection } = editor.state;
          const { from, to } = selection;

          if (from === to) {
            return false;
          }

          let transformedText = '';
          editor.state.doc.nodesBetween(from, to, (node, pos) => {
            if (node.isText) {
              const text = node.textContent;
              const start = Math.max(pos, from);
              const end = Math.min(pos + text.length, to);
              const selectedText = text.substring(start - pos, end - pos);

              switch (transformType) {
                case 'uppercase':
                  transformedText += upperCase(selectedText);
                  break;
                case 'lowercase':
                  transformedText += lowerCase(selectedText);
                  break;
                case 'capitalize':
                  transformedText += capitalCase(selectedText);
                  break;
              }
            }
          });
          
           if (dispatch) {
            editor.chain().focus().deleteRange({ from, to }).insertContent(transformedText).run();
          }

          return true;
        },
    };
  },
});
