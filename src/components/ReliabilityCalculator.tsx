"use client";
import { useState } from "react";

type CalculatedResults = {
    F: string;
    R: string;
    f: string;
    lambda: string;
};

export default function ReliabilityCalculator() {
    const [times, setTimes] = useState<number[]>([]);
    const [inputValue, setInputValue] = useState<string>("");
    const [tValue, setTValue] = useState<string>("");
    const [errorMessage, setErrorMessage] = useState<string>("");

    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [calculatedResults, setCalculatedResults] = useState<CalculatedResults | null>(null);

    const handleAddTime = () => {
        const time = parseFloat(inputValue);
        if (isNaN(time) || time < 0) {
            setErrorMessage("Czas do awarii nie może być ujemny ani pusty.");
            return;
        }

        setTimes((prevTimes) => [...prevTimes, time]);
        setInputValue("");
        setErrorMessage("");
    };

    const handleRemoveTime = (index: number) => {
        setTimes((prevTimes) => prevTimes.filter((_, i) => i !== index));
    };

    const calculateF = (t: number): number => {
        const failuresBeforeT = times.filter((time) => time < t).length;
        return failuresBeforeT / times.length;
    };

    const calculateR = (t: number): number => {
        return 1 - calculateF(t);
    };

    const calculateDensity = (t: number): number => {
        const exactFailuresAtT = times.filter((time) => time <= t).length;
        return exactFailuresAtT / (times.length * exactFailuresAtT || 1);
    };

    const calculateLambda = (t: number): number => {
        const R_t = calculateR(t);
        if (R_t === 0) return 0;
        return calculateDensity(t) / R_t;
    };

    const calculateMeanTime = (): number => {
        if (times.length === 0) return 0;
        const total = times.reduce((acc, time) => acc + time, 0);
        return total / times.length;
    };

    const handleCalculate = () => {
        const t = parseFloat(tValue);
        if (isNaN(t) || t < 0) {
            setErrorMessage("Wartość t nie może być ujemna ani pusta.");
            return;
        }

        const results: CalculatedResults = {
            F: calculateF(t).toFixed(3),
            R: calculateR(t).toFixed(3),
            f: calculateDensity(t).toFixed(3),
            lambda: calculateLambda(t).toFixed(10),
        };
        setCalculatedResults(results);
        setIsModalOpen(true);
        setErrorMessage("");
    };

    const closeModal = () => {
        setIsModalOpen(false);
    };

    const resetAll = () => {
        setTimes([]);
        setInputValue("");
        setTValue("");
        setCalculatedResults(null);
        setIsModalOpen(false);
        setErrorMessage("");
    };

    const exportToTextFile = () => {
        let content = "Raport Niezawodności\n\n";
        content += "Wprowadzone czasy do awarii:\n";
        times.forEach((time, index) => {
            content += `${index + 1}. ${time} godzin\n`;
        });

        if (calculatedResults) {
            content += `\nWyniki obliczeń dla t = ${tValue}:\n`;
            content += `F*(t): ${calculatedResults.F}\n`;
            content += `R*(t): ${calculatedResults.R}\n`;
            content += `f*(t): ${calculatedResults.f}\n`;
            content += `λ*(t): ${calculatedResults.lambda}\n`;
            content += `E*T (średni czas do awarii): ${calculateMeanTime().toFixed(2)} godzin\n`;
        }

        const blob = new Blob([content], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "reliability_report.txt";
        link.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="container mx-auto p-4 sm:p-6 bg-white shadow-lg rounded-lg m-2 max-w-2xl">
            <h1 className="text-2xl font-bold mb-6 text-center">Obliczanie empirycznych wskaźników niezawodności</h1>

            <div className="mb-4">
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Wprowadź czas do awarii"
                    className="border border-gray-400 p-2 rounded-md w-full"
                />
                <button
                    onClick={handleAddTime}
                    className="bg-blue-500 text-white p-2 rounded-md mt-2 w-full hover:bg-blue-600"
                >
                    Dodaj
                </button>
                {errorMessage && <p className="text-red-500 mt-2">{errorMessage}</p>}
            </div>

            <div className="mb-6">
                <h2 className="text-xl font-semibold p-2">Wprowadzone czasy do awarii:</h2>
                <div className="flex flex-wrap gap-2">
                    {times.map((time, index) => (
                        <div key={index} className="relative bg-gray-200 p-2 rounded-md shadow w-24">
                            <button
                                onClick={() => handleRemoveTime(index)}
                                className="absolute top-[-8px] left-[-8px] bg-red-500 text-white rounded-full p-1 text-xs w-4 h-4 flex items-center justify-center"
                            >
                                X
                            </button>
                            {time} godzin
                        </div>
                    ))}
                </div>
                <p className="text-lg mt-4">Liczba wprowadzonych czasów do awarii: <b>{times.length}</b></p>
            </div>

            <div className="mb-6">
                <h2 className="text-xl font-semibold">Oblicz wskaźniki dla danego t</h2>
                <div className="flex flex-col sm:flex-row items-center">
                    <input
                        type="number"
                        value={tValue}
                        onChange={(e) => setTValue(e.target.value)}
                        placeholder="Wartość t"
                        className="border border-gray-400 p-2 rounded-md mb-2 sm:mb-0 sm:mr-2 flex-grow"
                    />
                    <button
                        onClick={handleCalculate}
                        className="bg-green-500 text-white p-2 rounded-md hover:bg-green-600"
                    >
                        Oblicz wskaźniki
                    </button>
                </div>
                {errorMessage && <p className="text-red-500 mt-2">{errorMessage}</p>}
            </div>

            <div className="mb-6">
                <h2 className="text-xl font-semibold">Wzory obliczeń:</h2>
                <ul className="list-disc list-inside text-sm sm:text-base">
                    <li>
                        <b>F*(t)</b>: Prawdopodobieństwo awarii przed czasem t. {"F*(t) = P(T < t)"}
                    </li>
                    <li>
                        <b>R*(t)</b>: Prawdopodobieństwo działania do czasu t. {"R*(t) = 1 - F*(t)"}
                    </li>
                    <li>
                        <b>f*(t)</b>: Funkcja gęstości. {"f*(t) = liczba awarii dokładnie w czasie t / liczba urządzeń"}
                    </li>
                    <li>
                        <b>λ*(t)</b>: Intensywność uszkodzeń. {"λ*(t) = f*(t) / R*(t)"}
                    </li>
                    <li>
                        <b>E*T</b>: Oczekiwany czas do awarii. {"E*T = średnia z wprowadzonych czasów"}
                    </li>
                </ul>
            </div>

            {isModalOpen && calculatedResults && (
                <div className="fixed z-10 inset-0 flex items-center justify-center">
                    <div className="bg-white p-6 rounded-lg shadow-lg w-11/12 sm:w-1/2 relative z-20">
                        <h2 className="text-2xl font-bold mb-4">Wyniki obliczeń</h2>
                        <p><b>F*(t)</b>: {calculatedResults.F}</p>
                        <p><b>R*(t)</b>: {calculatedResults.R}</p>
                        <p><b>f*(t)</b>: {calculatedResults.f}</p>
                        <p><b>λ*(t)</b>: {calculatedResults.lambda}</p>
                        <p><b>E*T</b>: {calculateMeanTime().toFixed(2)} godzin</p>
                        <button
                            onClick={exportToTextFile}
                            className="bg-green-500 text-white p-2 rounded-md mt-4 m-2 hover:bg-green-600"
                        >
                            Pobierz plik tekstowy
                        </button>
                        <button
                            onClick={closeModal}
                            className="mt-4 bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600"
                        >
                            Zamknij
                        </button>
                    </div>
                    <div className="fixed inset-0 bg-black opacity-50 z-10" onClick={closeModal}></div>
                </div>
            )}

            <div className="mb-6">
                <button
                    onClick={resetAll}
                    className="bg-red-500 text-white p-2 rounded-md w-full hover:bg-red-600"
                >
                    Resetuj
                </button>
            </div>
        </div>
    );
}
