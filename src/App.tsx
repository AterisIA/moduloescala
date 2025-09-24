import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import Index from "./pages/Index";
import Contatos from "./pages/Contatos";
import Verificacao from "./pages/Verificacao";
import Escalas from "./pages/Escalas";
import Calendario from "./pages/Calendario";
import Presenca from "./pages/Presenca";
import Relatorio from "./pages/Relatorio";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/contatos" element={<Layout><Contatos /></Layout>} />
          <Route path="/verificacao" element={<Layout><Verificacao /></Layout>} />
          <Route path="/escalas" element={<Layout><Escalas /></Layout>} />
          <Route path="/calendario" element={<Layout><Calendario /></Layout>} />
          <Route path="/presenca" element={<Layout><Presenca /></Layout>} />
          <Route path="/relatorio" element={<Layout><Relatorio /></Layout>} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
