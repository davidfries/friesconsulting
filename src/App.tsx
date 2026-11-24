import { useEffect } from "react";
import { Link, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { Layout } from "./components/Layout";
import { ScrollManager } from "./components/ScrollManager";
import { usePageMeta } from "./hooks/usePageMeta";
import { registerWebMcpTools } from "./lib/webmcp";
import { CalculatorPage } from "./pages/CalculatorPage";
import { ContactPage } from "./pages/ContactPage";
import { HomePage } from "./pages/HomePage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { PostDetailPage } from "./pages/PostDetailPage";
import { PostsPage } from "./pages/PostsPage";
import { ServicesPage } from "./pages/ServicesPage";

function WelcomeRedirectPage() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/services/", { replace: true });
  }, [navigate]);

  return (
    <section className="section section--flush-top">
      <div className="container">
        <h1>Services</h1>
        <p className="lead">
          This page moved to <Link to="/services/">/services/</Link>.
        </p>
      </div>
    </section>
  );
}

export function App() {
  const location = useLocation();
  usePageMeta(location.pathname);

  useEffect(() => {
    return registerWebMcpTools();
  }, []);

  return (
    <Layout>
      <ScrollManager />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/services/" element={<ServicesPage />} />
        <Route path="/posts" element={<PostsPage />} />
        <Route path="/posts/" element={<PostsPage />} />
        <Route path="/posts/welcome" element={<WelcomeRedirectPage />} />
        <Route path="/posts/welcome/" element={<WelcomeRedirectPage />} />
        <Route path="/posts/:slug" element={<PostDetailPage />} />
        <Route path="/posts/:slug/" element={<PostDetailPage />} />
        <Route path="/calculator" element={<CalculatorPage />} />
        <Route path="/calculator/" element={<CalculatorPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/contact/" element={<ContactPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Layout>
  );
}

export default App;
