import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import logo from "@/assets/logo.png";
const Navbar = () => {
  const navigate = useNavigate();
  return <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto px-4 h-14 sm:h-16 flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-3 cursor-pointer" onClick={() => navigate("/")}>
          <img src={logo} alt="Elyon Builder" className="h-6 w-6 sm:h-8 sm:w-8" />
          
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/auth")} className="text-muted-foreground hover:text-foreground">
            <span className="hidden sm:inline">Entrar</span>
            <span className="sm:hidden">Login</span>
          </Button>
          <Button size="sm" onClick={() => navigate("/auth?signup=true")} className="bg-gradient-primary hover:opacity-90 transition-smooth">
            <span className="hidden sm:inline">Começar Grátis</span>
            <span className="sm:hidden">Criar</span>
          </Button>
        </div>
      </div>
    </nav>;
};
export default Navbar;