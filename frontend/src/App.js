import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import "@/App.css";
import Layout from "@/components/Layout";
import FloatingAsk from "@/components/FloatingAsk";
import Home from "@/pages/Home";
import SearchResults from "@/pages/SearchResults";
import ProductDetail from "@/pages/ProductDetail";
import Compare from "@/pages/Compare";
import Recommend from "@/pages/Recommend";
import SharedVerdict from "@/pages/SharedVerdict";
import Chat from "@/pages/Chat";

function App() {
  return (
    <div className="App grain">
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/search" element={<SearchResults />} />
            <Route path="/product/:productId" element={<ProductDetail />} />
            <Route path="/compare" element={<Compare />} />
            <Route path="/recommend" element={<Recommend />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/s/:shareId" element={<SharedVerdict />} />
          </Route>
        </Routes>
        <FloatingAsk />
      </BrowserRouter>
      <Toaster position="top-right" richColors closeButton />
    </div>
  );
}

export default App;
