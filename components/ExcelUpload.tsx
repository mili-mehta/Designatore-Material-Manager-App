import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
// FIX: Corrected icon import path to resolve file casing issue.
import { ArrowUpTrayIcon, CheckCircleIcon, XMarkIcon } from './Icons';

interface ExcelUploadProps<T> {
  onDataParsed: (data: T[]) => void;
  title: string;
  instructions: string;
}

const ExcelUpload = <T extends unknown>({ onDataParsed, title, instructions }: ExcelUploadProps<T>) => {
  const [fileName, setFileName] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsProcessing(true);
    setError(null);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      // Normalize keys to lowercase to handle variations in Excel column headers (e.g., 'Name' vs 'name')
      const normalizedData = jsonData.map(row => {
          const newRow: { [key: string]: any } = {};
          for (const key in row) {
              if (Object.prototype.hasOwnProperty.call(row, key)) {
                newRow[key.toLowerCase()] = (row as any)[key];
              }
          }
          return newRow;
      }) as T[];

      onDataParsed(normalizedData);
    } catch (e) {
      console.error("Error parsing Excel file:", e);
      setError("Failed to parse file. Please ensure it's a valid Excel or CSV file with the correct headers.");
    } finally {
      setIsProcessing(false);
      // Reset file input to allow re-uploading the same file
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleClear = () => {
    setFileName(null);
    setError(null);
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
      <h4 className="font-semibold text-gray-800 text-sm">{title}</h4>
      <p className="text-xs text-gray-500 leading-5" dangerouslySetInnerHTML={{ __html: instructions }} />
      
      <div className="flex items-center gap-2">
        <label htmlFor={`excel-upload-${title.replace(/\s/g, '')}`} className="cursor-pointer flex-shrink-0 px-4 py-2 bg-white hover:bg-gray-100 rounded-md text-gray-800 font-medium transition border border-gray-300 text-sm flex items-center justify-center gap-2">
          <ArrowUpTrayIcon className="w-4 h-4" />
          Choose File
        </label>
        <input
          id={`excel-upload-${title.replace(/\s/g, '')}`}
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".xlsx, .xls, .csv"
          onChange={handleFileChange}
          disabled={isProcessing}
        />
        {isProcessing && <div className="text-sm text-gray-600">Processing...</div>}
        
        {fileName && !isProcessing && (
            <div className="flex items-center gap-2 text-sm bg-green-50 text-green-800 border border-green-200 px-3 py-1.5 rounded-md">
                <CheckCircleIcon className="w-4 h-4"/>
                <span>{fileName}</span>
                <button onClick={handleClear} className="ml-2 text-green-600 hover:text-green-800"><XMarkIcon className="w-4 h-4"/></button>
            </div>
        )}
      </div>

      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
};

export default ExcelUpload;