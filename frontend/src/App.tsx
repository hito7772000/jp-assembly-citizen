import { Routes, Route } from "react-router-dom";
import AreaPage from "./pages/AreaPage";
import MunicipalityPage from "./pages/MunicipalityPage";
import MapPage from "./pages/MapPage";
import VoicePage from "./pages/VoicePage.tsx";

function App() {
    return (
        <Routes>
            <Route path="/" element={<AreaPage />} />
            <Route path="/areaPage" element={<AreaPage />} />
            <Route path="/municipalityPage" element={<MunicipalityPage />} />
            <Route path="/mapPage" element={<MapPage />} />
            <Route path="/voicePage" element={<VoicePage />} />
        </Routes>
    );
}

export default App;
