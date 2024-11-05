// app/page.tsx
"use client";

import { useState } from "react";
import { useDropzone } from "react-dropzone";
import { BsMoon, BsSun } from "react-icons/bs";

export default function Home() {
    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [query, setQuery] = useState<string>("");
    const [topN, setTopN] = useState<number>(5);
    const [fileError, setFileError] = useState<string | null>(null);
    const [results, setResults] = useState<Result[]>([]);
    const [modalContent, setModalContent] = useState<string>("");
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [darkMode, setDarkMode] = useState<boolean>(false);

    interface Result {
        content: string;
        similarity_score: number;
    }

    const onDrop = (acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (file && file.type === "application/pdf") {
            setPdfFile(file);
            setFileError(null);
        } else {
            setFileError("Only PDF files are allowed.");
            setPdfFile(null);
        }
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { "application/pdf": [] },
        maxFiles: 1,
    });

    const handleSubmit = async () => {
        if (!pdfFile || !query) return;
    
        setLoading(true);
        setError(null);
        setResults([]); // Clear previous results
    
        const formData = new FormData();
        formData.append("pdf", pdfFile);
        formData.append("query", query);
        formData.append("top_n", String(topN));
    
        try {
            const response = await fetch(`http://localhost:5000/upload_pdf`, {
                method: "POST",
                body: formData,
            });
            const data = await response.json();
    
            if (response.ok) {
                setResults(data.results);
            } else {
                setError(data.error || "An error occurred while processing your request.");
            }
        } catch {
            setError("An unexpected error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`max-h-screen flex flex-col ${darkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-black"}`}>
            {/* Header and Dark Mode Toggle */}
            <header className="w-full p-4 flex justify-between items-center bg-opacity-30 shadow-md border-b rounded-b-3xl">
                <h1 className="text-xl font-semibold">Search Engine for Pdf</h1>
                <button
                    onClick={() => setDarkMode(!darkMode)}
                    className="text-2xl p-2 focus:outline-none"
                >
                    {darkMode ? <BsSun /> : <BsMoon />}
                </button>
            </header>

            {/* Results Area */}
            <div className="h-[80vh] flex-grow p-6 overflow-y-auto px-40">
                <h2 className="text-xl font-semibold mb-4 text-center">Results</h2>
                {error && (
                    <p className="text-center text-red-500 mb-5">{error}</p>
                )}
                {loading ? (
                    <div className="flex justify-center items-center space-x-2">
                        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        <span>Searching...</span>
                    </div>
                ) : results.length > 0 ? (
                    results.map((result, index) => (
                        <div
                            key={index}
                            className="relative border-b border-gray-300 py-4 cursor-pointer transform transition duration-300 ease-in-out hover:scale-105 hover:border-blue-500"
                            onClick={() => {
                                setModalContent(result.content);
                                setIsModalOpen(true);
                            }}
                        >
                            <p className="hover:underline hover:text-purple-600 mb-2 text-cyan-600 text-2xl pb-3">
                                {result.content.slice(0, 100)}...
                            </p>
                            <p className="absolute bottom-2 right-2 text-md">
                                Similarity Score: {result.similarity_score < 0.01 ? "Less than 1%" : `${(result.similarity_score * 100).toFixed(2)}%`}
                            </p>
                        </div>
                    ))
                ) : (
                    !loading && <p className="text-gray-500 text-center">No results to display</p>
                )}
            </div>

            {/* Querying Container */}
            <div className="w-full p-4 bg-opacity-30 border-t shadow-md rounded-t-3xl border-t-2 border-white">
                <div className="flex items-center space-x-4">
                    <div {...getRootProps()} className={`flex-1 text-center p-4 border rounded-lg ${isDragActive ? "border-blue-500" : "border-gray-300"}`}>
                        <input {...getInputProps()} />
                        <p>{pdfFile ? pdfFile.name : "Add a PDF file"}</p>
                    </div>
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="what to search?"
                        className={`flex-1 p-4 border rounded-lg ${darkMode ? "bg-gray-800 text-white" : "bg-white text-black"}`}
                    />
                    <input
                        type="number"
                        value={topN}
                        onChange={(e) => setTopN(Number(e.target.value))}
                        min="1"
                        max="20"
                        className={`w-24 p-4 border rounded-lg text-center ${darkMode ? "bg-gray-800 text-white" : "bg-white text-black"}`}
                        placeholder="Results"
                    />
                    <button
                        onClick={handleSubmit}
                        disabled={!pdfFile || !query || loading}
                        className={`px-4 py-2 rounded-lg text-white ${loading ? "bg-blue-500 animate-pulse" : "bg-blue-600 hover:bg-blue-700"}`}
                    >
                        Search
                    </button>
                </div>
                {fileError && <p className="text-red-500 text-center mt-2">{fileError}</p>}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50 z-50" onClick={() => setIsModalOpen(false)}>
                    <div className="text-black bg-white p-6 rounded-lg shadow-lg max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <button
                            className="absolute top-2 right-2 text-xl font-bold text-gray-500 hover:text-gray-700"
                            onClick={() => setIsModalOpen(false)}
                        >
                            &times;
                        </button>
                        <p>{modalContent}</p>
                    </div>
                </div>
            )}
        </div>
    );
}
