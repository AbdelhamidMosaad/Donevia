import React, { useState, useCallback, ChangeEvent, useRef } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import './lecture-notes-generator.css'; // Assuming you'll create this for styling

// Ensure you have your API key securely loaded, e.g., from environment variables
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

if (!API_KEY) {
  console.error('GEMINI_API_KEY is not set. Please set it in your environment variables or .env file.');
  // In a real application, you might want to throw an error or disable functionality.
}

const LectureNotesGenerator: React.FC = () => {
  const [inputText, setInputText] = useState<string>('');
  const [generatedNotes, setGeneratedNotes] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

  const handleInputChange = useCallback((e: ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
  }, []);

  const handleFileChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        setInputText(content);
      };
      reader.onerror = (event) => {
        setError('Error reading file: ' + event.target?.error);
      };
      reader.readAsText(file);
    }
  }, []);

  const generateContent = useCallback(async () => {
    if (!genAI) {
      setError("Gemini API key is not configured.");
      return;
    }
    if (!inputText.trim()) {
      setError('Please provide some text or upload a file to generate notes.');
      return;
    }

    setIsLoading(true);
    setGeneratedNotes('');
    setError(null);

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });

      const prompt = `Generate professional, concise, and structured lecture notes from the following text.
      The notes should include a title, main headings, subheadings, and bullet points where appropriate.
      Focus on key concepts, definitions, examples, and summaries.
      Ensure the output is easy to read and understand.

      Text to summarize:
      "${inputText}"`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      setGeneratedNotes(text);
    } catch (err: any) {
      console.error('Error generating lecture notes:', err);
      setError('Failed to generate notes. Please try again. Error: ' + (err.message || 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  }, [inputText, genAI]);

  const handleDownload = useCallback(() => {
    if (generatedNotes) {
      const element = document.createElement("a");
      const file = new Blob([generatedNotes], { type: "text/plain" });
      element.href = URL.createObjectURL(file);
      element.download = "lecture_notes.txt";
      document.body.appendChild(element); // Required for Firefox
      element.click();
      document.body.removeChild(element); // Clean up
    }
  }, [generatedNotes]);

  return (
    <div className="lecture-notes-container">
      <h1>Lecture Notes Generator</h1>

      <div className="input-section">
        <textarea
          placeholder="Paste your lecture content here, or upload a file..."
          value={inputText}
          onChange={handleInputChange}
          rows={10}
          className="input-textarea"
          disabled={isLoading}
        ></textarea>
        <div className="file-upload-section">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".txt,.md,.rtf" // Accept common text file types
            style={{ display: 'none' }} // Hide default input
          />
          <button
            className="upload-button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
          >
            Upload File
          </button>
        </div>
        <button
          onClick={generateContent}
          disabled={isLoading || !inputText.trim()}
          className="generate-button"
        >
          {isLoading ? 'Generating...' : 'Generate Lecture Notes'}
        </button>
      </div>

      {error && <p className="error-message">{error}</p>}

      {generatedNotes && (
        <div className="output-section">
          <h2>Generated Lecture Notes:</h2>
          <div className="notes-display">
            <pre>{generatedNotes}</pre>
          </div>
          <button onClick={handleDownload} className="download-button">
            Download Notes
          </button>
        </div>
      )}
    </div>
  );
};

export default LectureNotesGenerator;
