
import React, { useState, useCallback } from 'react';
import { AppView, AnalysisMode, AnalysisResult, WasteClassificationResult, DiseasePredictionResult } from './types';
import { classifyWaste, predictDiseases } from './services/geminiService';
import Loader from './components/Loader';
import { LeafIcon, RecycleIcon, AlertTriangleIcon, UploadCloudIcon, Trash2Icon, SyringeIcon } from './components/Icons';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.HOME);
  const [analysisMode, setAnalysisMode] = useState<AnalysisMode | null>(null);
  const [image, setImage] = useState<{ file: File; dataUrl: string } | null>(null);
  const [result, setResult] = useState<AnalysisResult>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState<string>('');

  const handleModeSelect = (mode: AnalysisMode) => {
    setAnalysisMode(mode);
    setCurrentView(AppView.ANALYZING);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if(file.size > 2 * 1024 * 1024) { // 2MB limit
          setError("File size exceeds 2MB. Please upload a smaller image.");
          return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage({ file, dataUrl: reader.result as string });
        setError(null);
      };
      reader.onerror = () => {
        setError("Failed to read the image file.");
      }
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = useCallback(async () => {
    if (!image || !analysisMode) return;

    setCurrentView(AppView.ANALYZING);
    setLoadingMessage(analysisMode === AnalysisMode.WASTE ? 'Classifying waste...' : 'Predicting diseases...');
    setError(null);
    setResult(null);

    try {
      const base64Data = image.dataUrl.split(',')[1];
      let analysisResult;
      if (analysisMode === AnalysisMode.WASTE) {
        analysisResult = await classifyWaste(base64Data, image.file.type);
      } else {
        analysisResult = await predictDiseases(base64Data, image.file.type);
      }
      setResult(analysisResult);
      setCurrentView(AppView.RESULT);
    } catch (err) {
      setError("An error occurred during analysis. Please try again.");
      console.error(err);
      setCurrentView(AppView.ANALYZING); // Stay on analyzing page to show error
    } finally {
      setLoadingMessage('');
    }
  }, [image, analysisMode]);

  const handleReset = () => {
    setCurrentView(AppView.HOME);
    setAnalysisMode(null);
    setImage(null);
    setResult(null);
    setError(null);
  };
  
  const Header = () => (
    <header className="bg-white shadow-md">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <LeafIcon className="w-8 h-8 text-green-600" />
          <h1 className="text-2xl font-bold text-gray-800">EcoGuard</h1>
        </div>
         {currentView !== AppView.HOME && (
             <button
                onClick={handleReset}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-300 font-semibold"
             >
                Start Over
            </button>
         )}
      </div>
    </header>
  );

  const HomePage = () => (
    <div className="text-center p-8">
      <h2 className="text-4xl font-extrabold text-gray-800 mb-2">Smart Waste & Health Protection</h2>
      <p className="text-lg text-gray-600 mb-12 max-w-2xl mx-auto">Upload an image to classify waste or predict potential health risks from improper disposal.</p>
      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        <ModeCard
          icon={<Trash2Icon className="w-16 h-16 mx-auto mb-4 text-green-600" />}
          title="Waste Classifier"
          description="Identify waste type and get suggestions for recycling, reuse, and safe disposal."
          onClick={() => handleModeSelect(AnalysisMode.WASTE)}
        />
        <ModeCard
          icon={<SyringeIcon className="w-16 h-16 mx-auto mb-4 text-red-500" />}
          title="Disease Predictor"
          description="Analyze waste dumps or drainage to predict potential diseases and learn prevention tips."
          onClick={() => handleModeSelect(AnalysisMode.DISEASE)}
        />
      </div>
    </div>
  );

  const ModeCard = ({ icon, title, description, onClick }: { icon: React.ReactNode; title: string; description: string; onClick: () => void; }) => (
    <div
      onClick={onClick}
      className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 cursor-pointer border border-gray-200"
    >
      {icon}
      <h3 className="text-2xl font-bold text-gray-800 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );

  const AnalyzingPage = () => (
    <div className="max-w-4xl mx-auto p-8">
      <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">
        {analysisMode === AnalysisMode.WASTE ? 'Waste Classifier' : 'Disease Predictor'}
      </h2>
      <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-200">
        {!image ? (
            <div className="border-4 border-dashed border-gray-300 rounded-xl p-12 text-center">
                <UploadCloudIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <label htmlFor="file-upload" className="cursor-pointer font-semibold text-green-600 hover:text-green-700">
                    <span>Upload an image</span>
                    <input id="file-upload" name="file-upload" type="file" className="sr-only" accept="image/*" onChange={handleImageUpload} />
                </label>
                <p className="text-xs text-gray-500 mt-2">PNG, JPG, GIF up to 2MB</p>
            </div>
        ) : (
            <div className="text-center">
                <img src={image.dataUrl} alt="Upload preview" className="max-h-80 mx-auto rounded-lg shadow-md mb-6" />
                <div className="flex justify-center items-center gap-4">
                     <button
                        onClick={() => setImage(null)}
                        className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
                    >
                        Change Image
                    </button>
                    <button
                        onClick={handleAnalyze}
                        disabled={loadingMessage !== ''}
                        className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold text-lg"
                    >
                        Analyze Now
                    </button>
                </div>
            </div>
        )}
         {error && <p className="text-red-500 text-center mt-4 font-semibold">{error}</p>}
      </div>
    </div>
  );

  const ResultPage = () => (
    <div className="max-w-6xl mx-auto p-4 md:p-8">
        <div className="grid lg:grid-cols-2 gap-8 items-start">
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200">
                 <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">Uploaded Image</h2>
                <img src={image?.dataUrl} alt="Analyzed content" className="w-full max-h-96 object-contain rounded-lg shadow-md" />
            </div>
            {result && analysisMode === AnalysisMode.WASTE && <WasteResult result={result as WasteClassificationResult} />}
            {result && analysisMode === AnalysisMode.DISEASE && <DiseaseResult result={result as DiseasePredictionResult} />}
        </div>
    </div>
  );
  
  const WasteResult = ({ result }: { result: WasteClassificationResult }) => (
    <div className="space-y-6">
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200">
            <h3 className="text-3xl font-extrabold text-green-700 text-center mb-4">{result.wasteType}</h3>
        </div>
        
        <InfoCard icon={<RecycleIcon className="w-6 h-6 text-blue-500" />} title="Recycling & Reuse">
            <p className="font-semibold text-gray-700 mb-1">{result.recycling.possible ? "✅ Recyclable" : "❌ Not easily recyclable"}</p>
            <p className="text-gray-600 mb-3">{result.recycling.instructions}</p>
            <p className="font-semibold text-gray-700 mt-3 border-t pt-3">Reuse Ideas:</p>
            <p className="text-gray-600">{result.reuse}</p>
        </InfoCard>

        <InfoCard icon={<Trash2Icon className="w-6 h-6 text-gray-600" />} title="Proper Disposal">
            <p className="text-gray-600">{result.disposal}</p>
        </InfoCard>

        <InfoCard icon={<LeafIcon className="w-6 h-6 text-green-500" />} title="Environmental Impact">
            <p className="text-gray-600">{result.environmentalImpact}</p>
        </InfoCard>

        <InfoCard icon={<AlertTriangleIcon className="w-6 h-6 text-red-500" />} title="Health Risks">
            <ul className="space-y-3">
                {result.healthRisks.map((risk, index) => (
                    <li key={index}>
                        <p className="font-semibold text-gray-800">{risk.name}</p>
                        <p className="text-gray-600 text-sm">{risk.description}</p>
                    </li>
                ))}
            </ul>
        </InfoCard>
    </div>
  );

  const DiseaseResult = ({ result }: { result: DiseasePredictionResult }) => {
    const riskColor = result.overallRiskLevel === 'High' ? 'text-red-500' : result.overallRiskLevel === 'Medium' ? 'text-yellow-500' : 'text-green-500';
    
    return (
        <div className="space-y-6">
             <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200 text-center">
                <h3 className="text-xl font-bold text-gray-800 mb-2">Overall Risk Level</h3>
                <p className={`text-4xl font-extrabold ${riskColor}`}>{result.overallRiskLevel}</p>
            </div>

            {result.predictedDiseases.map((disease, index) => (
                 <div key={index} className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200">
                    <h4 className="text-2xl font-bold text-red-600 mb-3">{disease.name}</h4>
                    <p className="font-semibold text-gray-700 mb-1">Cause:</p>
                    <p className="text-gray-600 mb-4">{disease.cause}</p>
                    <p className="font-semibold text-gray-700 mb-2">Prevention Tips:</p>
                    <ul className="list-disc list-inside space-y-1 text-gray-600">
                        {disease.preventionTips.map((tip, i) => (
                            <li key={i}>{tip}</li>
                        ))}
                    </ul>
                 </div>
            ))}
        </div>
    );
  };
  
  const InfoCard = ({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode; }) => (
     <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200">
        <div className="flex items-center mb-3">
            {icon}
            <h4 className="text-xl font-bold text-gray-800 ml-3">{title}</h4>
        </div>
        <div>{children}</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      <Header />
      <main className="container mx-auto px-4 py-8">
        {loadingMessage && <Loader message={loadingMessage} />}
        {currentView === AppView.HOME && <HomePage />}
        {currentView === AppView.ANALYZING && <AnalyzingPage />}
        {currentView === AppView.RESULT && <ResultPage />}
      </main>
    </div>
  );
};

export default App;
