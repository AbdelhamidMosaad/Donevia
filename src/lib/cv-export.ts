import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { jsPDF } from 'jspdf';
import { saveAs } from 'file-saver';
import type { CVData } from './types/cv-builder';

export const exportCvToDocx = async (cvData: CVData) => {
  const doc = new Document({
    sections: [{
      children: [
        new Paragraph({ text: cvData.personalDetails.fullName, heading: HeadingLevel.TITLE, alignment: AlignmentType.CENTER }),
        new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
                new TextRun(cvData.personalDetails.email),
                new TextRun(" | "),
                new TextRun(cvData.personalDetails.phone),
                new TextRun(" | "),
                new TextRun(cvData.personalDetails.address),
            ]
        }),
        cvData.personalDetails.linkedIn ? new Paragraph({ text: `LinkedIn: ${cvData.personalDetails.linkedIn}`, alignment: AlignmentType.CENTER }) : new Paragraph(""),
        cvData.personalDetails.website ? new Paragraph({ text: `Website: ${cvData.personalDetails.website}`, alignment: AlignmentType.CENTER }) : new Paragraph(""),
        
        new Paragraph({ text: 'Summary', heading: HeadingLevel.HEADING_1, border: { bottom: { color: "auto", space: 1, value: "single", size: 6 } } }),
        new Paragraph(cvData.summary),

        new Paragraph({ text: 'Work Experience', heading: HeadingLevel.HEADING_1, border: { bottom: { color: "auto", space: 1, value: "single", size: 6 } } }),
        ...cvData.experience.flatMap(exp => [
            new Paragraph({
                children: [
                    new TextRun({ text: exp.jobTitle, bold: true }),
                    new TextRun(` | ${exp.company}`).bold(),
                ]
            }),
            new Paragraph({ text: `${exp.startDate} | ${exp.location}` }),
            ...exp.description.split('\n').map(desc => new Paragraph({ text: desc, bullet: { level: 0 } })),
            new Paragraph(""), // spacing
        ]),

        new Paragraph({ text: 'Education', heading: HeadingLevel.HEADING_1, border: { bottom: { color: "auto", space: 1, value: "single", size: 6 } } }),
         ...cvData.education.flatMap(edu => [
            new Paragraph({ children: [new TextRun({ text: edu.degree, bold: true })] }),
            new Paragraph({ text: `${edu.school} | ${edu.location} | Graduated: ${edu.graduationDate}` }),
            ...(edu.description ? edu.description.split('\n').map(d => new Paragraph({ children: [new TextRun(d)], bullet: { level: 0 } })) : []),
            new Paragraph(""), // spacing
        ]),

        ...(cvData.courses && cvData.courses.length > 0 && cvData.courses.some(c => c.courseName) ? [
            new Paragraph({ text: 'Courses & Certifications', heading: HeadingLevel.HEADING_1, border: { bottom: { color: "auto", space: 1, value: "single", size: 6 } } }),
            ...cvData.courses.flatMap(course => course.courseName ? [
                new Paragraph({ children: [new TextRun({ text: course.courseName, bold: true })] }),
                new Paragraph({ text: `${course.institution} | Completed: ${course.completionDate}` }),
                new Paragraph(""), // spacing
            ] : [])
        ] : []),

        ...(cvData.technicalSkills ? [
            new Paragraph({ text: 'Technical Skills', heading: HeadingLevel.HEADING_1, border: { bottom: { color: "auto", space: 1, value: "single", size: 6 } } }),
            new Paragraph(cvData.technicalSkills),
        ] : []),

        ...(cvData.softSkills ? [
            new Paragraph({ text: 'Soft Skills', heading: HeadingLevel.HEADING_1, border: { bottom: { color: "auto", space: 1, value: "single", size: 6 } } }),
            new Paragraph(cvData.softSkills),
        ] : []),

        ...(cvData.languages && cvData.languages.length > 0 && cvData.languages.some(l => l.language) ? [
            new Paragraph({ text: 'Languages', heading: HeadingLevel.HEADING_1, border: { bottom: { color: "auto", space: 1, value: "single", size: 6 } } }),
            ...cvData.languages.flatMap(lang => lang.language ? [
                new Paragraph({ children: [
                    new TextRun({ text: `${lang.language}: `, bold: true }),
                    new TextRun(lang.proficiency),
                ]}),
            ] : []),
            new Paragraph(""),
        ] : []),
      ],
    }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${cvData.personalDetails.fullName.replace(/ /g, '_')}_CV.docx`);
};

export const exportCvToPdf = (cvData: CVData) => {
    const doc = new jsPDF();
    let y = 20;

    doc.setFontSize(22);
    doc.text(cvData.personalDetails.fullName, 105, y, { align: 'center' });
    y += 10;
    doc.setFontSize(10);
    doc.text(`${cvData.personalDetails.email} | ${cvData.personalDetails.phone} | ${cvData.personalDetails.address}`, 105, y, { align: 'center' });
    y += 5;
     if (cvData.personalDetails.linkedIn) {
        doc.text(`LinkedIn: ${cvData.personalDetails.linkedIn}`, 105, y, { align: 'center' });
        y += 5;
    }
    if (cvData.personalDetails.website) {
        doc.text(`Website: ${cvData.personalDetails.website}`, 105, y, { align: 'center' });
    }
    
    y += 10;
    doc.setFontSize(16);
    doc.text('Summary', 15, y);
    y += 2;
    doc.setLineWidth(0.5);
    doc.line(15, y, 195, y);
    y += 8;
    doc.setFontSize(11);
    const summaryLines = doc.splitTextToSize(cvData.summary, 180);
    doc.text(summaryLines, 15, y);
    y += summaryLines.length * 5 + 5;
    
    doc.setFontSize(16);
    doc.text('Work Experience', 15, y);
    y += 2;
    doc.line(15, y, 195, y);
    y += 8;
    doc.setFontSize(11);

    cvData.experience.forEach(exp => {
        if (y > 270) { doc.addPage(); y = 20; }
        doc.setFont(undefined, 'bold');
        doc.text(`${exp.jobTitle} | ${exp.company}`, 15, y);
        doc.setFont(undefined, 'normal');
        y += 5;
        doc.setFontSize(10);
        doc.text(`${exp.startDate} | ${exp.location}`, 15, y);
        y += 5;
        doc.setFontSize(11);
        const descLines = doc.splitTextToSize(exp.description, 175);
        descLines.forEach((line: string) => {
             if (y > 280) { doc.addPage(); y = 20; }
             doc.text(`• ${line}`, 20, y);
             y+= 5;
        })
        y += 5;
    });
    
    if (y > 250) { doc.addPage(); y = 20; }
    doc.setFontSize(16);
    doc.text('Education', 15, y);
    y += 2;
    doc.line(15, y, 195, y);
    y += 8;
    doc.setFontSize(11);
     cvData.education.forEach(edu => {
        if (y > 270) { doc.addPage(); y = 20; }
        doc.setFont(undefined, 'bold');
        doc.text(edu.degree, 15, y);
        y += 5;
        doc.setFont(undefined, 'normal');
        doc.text(`${edu.school} | ${edu.location} | Graduated: ${edu.graduationDate}`, 15, y);
        y += 5;
        if (edu.description) {
            doc.setFontSize(10);
            const descLines = doc.splitTextToSize(edu.description, 175);
            descLines.forEach((line: string) => {
                if (y > 280) { doc.addPage(); y = 20; }
                doc.text(`• ${line}`, 20, y);
                y+= 5;
            });
            doc.setFontSize(11);
        }
        y += 5;
    });

    if (cvData.courses && cvData.courses.length > 0 && cvData.courses.some(c => c.courseName)) {
        if (y > 250) { doc.addPage(); y = 20; }
        doc.setFontSize(16);
        doc.text('Courses & Certifications', 15, y);
        y += 2;
        doc.line(15, y, 195, y);
        y += 8;
        doc.setFontSize(11);
        cvData.courses.forEach(course => {
            if (y > 270) { doc.addPage(); y = 20; }
            if (course.courseName) {
                doc.setFont(undefined, 'bold');
                doc.text(course.courseName, 15, y);
                y += 5;
                doc.setFont(undefined, 'normal');
                doc.text(`${course.institution} | Completed: ${course.completionDate}`, 15, y);
                y += 10;
            }
        });
    }

    if (cvData.technicalSkills) {
        if (y > 260) { doc.addPage(); y = 20; }
        doc.setFontSize(16);
        doc.text('Technical Skills', 15, y);
        y += 2;
        doc.line(15, y, 195, y);
        y += 8;
        doc.setFontSize(11);
        const technicalSkillsLines = doc.splitTextToSize(cvData.technicalSkills, 180);
        doc.text(technicalSkillsLines, 15, y);
        y += technicalSkillsLines.length * 5 + 5;
    }

    if (cvData.softSkills) {
        if (y > 260) { doc.addPage(); y = 20; }
        doc.setFontSize(16);
        doc.text('Soft Skills', 15, y);
        y += 2;
        doc.line(15, y, 195, y);
        y += 8;
        doc.setFontSize(11);
        const softSkillsLines = doc.splitTextToSize(cvData.softSkills, 180);
        doc.text(softSkillsLines, 15, y);
        y += softSkillsLines.length * 5 + 5;
    }

    if (cvData.languages && cvData.languages.length > 0 && cvData.languages.some(l => l.language)) {
        if (y > 260) { doc.addPage(); y = 20; }
        doc.setFontSize(16);
        doc.text('Languages', 15, y);
        y += 2;
        doc.line(15, y, 195, y);
        y += 8;
        doc.setFontSize(11);
        cvData.languages.forEach(lang => {
            if (lang.language) {
                if (y > 280) { doc.addPage(); y = 20; }
                doc.text(`• ${lang.language}: ${lang.proficiency}`, 20, y);
                y += 7;
            }
        });
    }

    doc.save(`${cvData.personalDetails.fullName.replace(/ /g, '_')}_CV.pdf`);
};
