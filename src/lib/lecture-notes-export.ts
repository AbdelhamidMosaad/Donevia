import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';
import { marked } from 'marked';

export const exportLectureNotesToDocx = async (title: string, markdownContent: string, font: string = 'Calibri') => {
  const children: Paragraph[] = [
    new Paragraph({ text: title, heading: HeadingLevel.TITLE, alignment: AlignmentType.CENTER }),
  ];

  // A very basic markdown to docx converter
  const lines = markdownContent.split('\n');
  lines.forEach(line => {
    if (line.startsWith('###')) {
      children.push(new Paragraph({ text: line.replace('###', '').trim(), heading: HeadingLevel.HEADING_3 }));
    } else if (line.startsWith('##')) {
      children.push(new Paragraph({ text: line.replace('##', '').trim(), heading: HeadingLevel.HEADING_2 }));
    } else if (line.startsWith('#')) {
      children.push(new Paragraph({ text: line.replace('#', '').trim(), heading: HeadingLevel.HEADING_1 }));
    } else if (line.startsWith('* ') || line.startsWith('- ')) {
      children.push(new Paragraph({ text: line.substring(2), bullet: { level: 0 } }));
    } else if (line.trim() !== '') {
      // Handle bold text **text**
      const parts = line.split(/(\*\*.*?\*\*)/g);
      const textRuns = parts.map(part => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return new TextRun({ text: part.slice(2, -2), bold: true });
        }
        return new TextRun(part);
      });
      children.push(new Paragraph({ children: textRuns }));
    } else {
      children.push(new Paragraph('')); // empty line
    }
  });


  const doc = new Document({
    styles: {
        default: {
            document: {
                run: {
                    font: font,
                }
            }
        }
    },
    sections: [{
      children,
    }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${title.replace(/ /g, '_')}_Notes.docx`);
};
