import React, { useState, useRef } from 'react';

const ResumeAnalyzer = () => {
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [showResponse, setShowResponse] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadedFile(file);
      setShowResponse(false);
      setAnalysis('');
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      setUploadedFile(file);
      setShowResponse(false);
      setAnalysis('');
    }
  };

  const analyzeResume = async () => {
    if (!uploadedFile) return;

    setIsAnalyzing(true);
    setShowResponse(false);
    setAnalysis('');

    try {
      if (typeof window !== 'undefined' && window.puter) {
        // Upload file
        const puterFile = await window.puter.fs.write(
          `temp_resume_${Date.now()}.${uploadedFile.name.split('.').pop()}`,
          uploadedFile
        );

        const uploadedPath = puterFile.path;

        // Analyze with AI (stream mode)
        const completion = await window.puter.ai.chat(
          [
            {
              role: 'user',
              content: [
                { type: 'file', puter_path: uploadedPath },
                {
                  type: 'text',
                  text: 'ช่วยวิเคราะห์ Resume หรือ CV มีความเหมาะสมกับอาชีพอะไร รวมถึงทักษะที่ควรเพิ่มเติมและแหล่งการเรียนรู้ทักษะนั้นๆ โดย list เป็น <ol> ของแต่ละอาชีพ โดยมี subcontent เป็น <ul> และให้ลิ้งค์สำหรับการพัฒนาทักษะมาด้วย รวมถึงให้คะแนนความเหมาะสมของ resume กับอาชีพนั้นๆเป็น format 2d.ff% ข้อมูลทั้งหมดต้องอยู่ภายในประเทศไทยเท่านั้น'
                }
              ]
            }
          ],
          { model: 'claude-sonnet-4', stream: true }
        );

        let text = '';
        setShowResponse(true);

        for await (const part of completion) {
          if (part?.content) {
            for (const c of part.content) {
              if (c.type === 'text') {
                text += c.text;
                setAnalysis(text);
              }
            }
          }
        }

        // Clean up
        await window.puter.fs.delete(uploadedPath);
      } else {
        setAnalysis('Error: This component requires the Puter environment.');
        setShowResponse(true);
      }
    } catch (error) {
      setAnalysis(`<strong>Error:</strong><br>${error.message}`);
      setShowResponse(true);
    }

    setIsAnalyzing(false);
  };

  return (
    <div className="max-w-2xl mx-auto p-5 font-sans">
      <div className="border border-gray-300 p-5 rounded-md">
        <h1 className="text-2xl font-bold mb-4">มาวิเคราะห์เรซูเม่กัน!</h1>
        <p className="mb-5 text-gray-700">
          อัพโหลไฟล์ (PDF, DOC, หรือ TXT) เพื่อที่จะทราบว่าคุณเหมาะกับงานอะไรและมีทักษะใดๆที่ขาดอีกบ้าง.
        </p>

        <div
          className={`border-2 border-dashed p-10 text-center my-5 rounded-md cursor-pointer transition-colors duration-300 ${
            isDragOver
              ? 'border-blue-500 bg-gray-50'
              : 'border-gray-300 hover:border-blue-500'
          }`}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <p className="text-gray-600">คลิ๊กหรือลากเพื่ออัปโหลดไฟล์</p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.txt"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {uploadedFile && (
          <div className="mt-2 text-sm italic text-gray-600">
            Selected: {uploadedFile.name}
          </div>
        )}

        <button
          onClick={analyzeResume}
          disabled={!uploadedFile || isAnalyzing}
          className={`w-full p-3 text-white border-none rounded-md cursor-pointer mt-3 transition-colors ${
            !uploadedFile || isAnalyzing
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-500 hover:bg-blue-600'
          }`}
        >
          {isAnalyzing ? 'กำลังวิเคราะห์...' : 'ส่งเรซูเม่'}
        </button>

        {showResponse && (
          <div
            className="mt-5 p-4 bg-gray-50 rounded-md"
            dangerouslySetInnerHTML={{ __html: analysis }}
          />
        )}
      </div>
    </div>
  );
};

export default ResumeAnalyzer;
