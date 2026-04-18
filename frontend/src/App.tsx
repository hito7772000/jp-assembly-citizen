import { Routes, Route } from "react-router-dom";
import AreaPage from "./pages/AreaPage";
import MunicipalityPage from "./pages/MunicipalityPage";
import MapPage from "./pages/MapPage";
import VoicePage from "./pages/VoicePage.tsx";
import MindmapPage from "./pages/MindmapPage";
import MindmapListPage from "./pages/MindmapListPage";

function App() {
    return (
        <Routes>
            <Route path="/" element={<AreaPage />} />
            <Route path="/areaPage" element={<AreaPage />} />
            <Route path="/municipalityPage" element={<MunicipalityPage />} />
            <Route path="/mapPage" element={<MapPage />} />
            <Route path="/voicePage" element={<VoicePage />} />
            <Route path="/mindmap" element={<MindmapPage />} />
            <Route path="/mindmapPage" element={<MindmapPage />} />
            <Route path="/mindmaps" element={<MindmapListPage />} />
        </Routes>
    );
}

export default App;
