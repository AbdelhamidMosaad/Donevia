
'use client';

import { Extension } from '@tiptap/core';
import '@tiptap/extension-text-style';

type FontFamilyOptions = {
  types: string[];
};

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    fontFamily: {
      /**
       * Set the font family
       */
      setFontFamily: (fontFamily: string) => ReturnType;
      /**
       * Unset the font family
       */
      unsetFontFamily: () => ReturnType;
      /**
       * Set the stored font family
       */
      setStoredFontFamily: (fontFamily: string) => ReturnType;
    };
  }
}

export const FontFamily = Extension.create<FontFamilyOptions>({
  name: 'fontFamily',

  addOptions() {
    return {
      types: ['textStyle'],
    };
  },
  
  addStorage() {
    return {
      fontFamily: null,
    }
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontFamily: {
            default: null,
            parseHTML: (element) => element.style.fontFamily?.replace(/['"]/g, ''),
            renderHTML: (attributes) => {
              if (!attributes.fontFamily) {
                return {};
              }

              return {
                style: `font-family: ${attributes.fontFamily}`,
              };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setFontFamily:
        (fontFamily) =>
        ({ chain }) => {
          this.storage.fontFamily = fontFamily;
          return chain().setMark('textStyle', { fontFamily }).run();
        },
      unsetFontFamily:
        () =>
        ({ chain }) => {
          this.storage.fontFamily = null;
          return chain().setMark('textStyle', { fontFamily: null }).removeEmptyTextStyle().run();
        },
       setStoredFontFamily:
        (fontFamily) =>
        ({ editor }) => {
          this.storage.fontFamily = fontFamily;
          return editor.commands.setFontFamily(fontFamily);
        },
    };
  },
  
  onTransaction() {
    if (this.storage.fontFamily) {
      this.editor.chain().setFontFamily(this.storage.fontFamily).run();
    }
  },
});
