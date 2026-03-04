import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AbstractWalletProvider } from "@abstract-foundation/agw-react";
import { abstract } from "viem/chains";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { MobileNavProvider } from "@/contexts/MobileNavContext";
import { MobileNavLayout } from "@/components/MobileNavLayout";
import NavBar from "@/components/NavBar";
import Index from "./pages/Index";
import FreeMoney from "./pages/FreeMoney";
import Test from "./pages/Test";
import Memes from "./pages/Memes";
import XPCard from "./pages/XPCard";
import PFP from "./pages/PFP";
import Wallpapers from "./pages/Wallpapers";
import CreateAccount from "./pages/CreateAccount";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";

const App = () => {
  return (
    <LanguageProvider>
      <AbstractWalletProvider chain={abstract}>
        <MobileNavProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              {/* NavBar outside MobileNavLayout so it doesn't get pushed */}
              <NavBar />
              <MobileNavLayout>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/freemoney" element={<FreeMoney />} />
                  <Route path="/test" element={<Test />} />
                  <Route path="/memes" element={<Memes />} />
                  <Route path="/xp" element={<XPCard />} />
                  <Route path="/pfp" element={<PFP />} />
                  <Route path="/wallpapers" element={<Wallpapers />} />
                  <Route path="/createaccount" element={<CreateAccount />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </MobileNavLayout>
            </BrowserRouter>
          </TooltipProvider>
        </MobileNavProvider>
      </AbstractWalletProvider>
    </LanguageProvider>
  );
}

export default App;