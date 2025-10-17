import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Sparkles, Users, Palette, BarChart3, MessageSquare, Shield } from "lucide-react";
import Navbar from "@/components/Navbar";
import heroImage from "@/assets/hero-bg.jpg";

const Index = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Sparkles,
      title: "Sem Código",
      description: "Crie áreas de membros completas sem escrever uma linha de código",
    },
    {
      icon: Users,
      title: "Gestão de Membros",
      description: "Gerencie membros, acessos e permissões de forma intuitiva",
    },
    {
      icon: Palette,
      title: "Design Personalizado",
      description: "Customize cores, logos e identidade visual do seu projeto",
    },
    {
      icon: BarChart3,
      title: "Analytics Integrado",
      description: "Acompanhe métricas e engajamento em tempo real",
    },
    {
      icon: MessageSquare,
      title: "Comunidade",
      description: "Crie fóruns e interações entre seus membros",
    },
    {
      icon: Shield,
      title: "White Label",
      description: "100% sua marca, sem referências da plataforma",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `url(${heroImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/80 to-background" />

        <div className="container mx-auto px-4 relative z-10 pt-16 sm:pt-20">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl sm:text-5xl md:text-7xl font-bold mb-6 animate-fade-in leading-tight">
              Crie Áreas de Membros{" "}
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                Sem Programar
              </span>
            </h1>
            <p className="text-base sm:text-xl md:text-2xl text-muted-foreground mb-8 animate-fade-in px-4">
              Plataforma SaaS white label completa para construir e gerenciar suas áreas de membros
              personalizadas
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center animate-scale-in px-4">
              <Button
                size="lg"
                onClick={() => navigate("/auth?signup=true")}
                className="bg-gradient-primary hover:opacity-90 transition-smooth shadow-glow text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 w-full sm:w-auto"
              >
                Começar Gratuitamente
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate("/auth")}
                className="border-primary/50 hover:bg-primary/10 text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 w-full sm:w-auto"
              >
                Fazer Login
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 sm:py-24 bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
              Tudo que Você Precisa
            </h2>
            <p className="text-base sm:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
              Recursos completos para criar experiências incríveis para seus membros
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group p-6 rounded-2xl bg-card border border-border/50 hover-lift shadow-card"
              >
                <div className="rounded-xl bg-primary/10 w-14 h-14 flex items-center justify-center mb-4 group-hover:shadow-glow transition-smooth">
                  <feature.icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-primary opacity-10" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6">
              Pronto para Começar?
            </h2>
            <p className="text-base sm:text-xl text-muted-foreground mb-8 px-4">
              Crie sua primeira área de membros em minutos
            </p>
            <Button
              size="lg"
              onClick={() => navigate("/auth?signup=true")}
              className="bg-gradient-primary hover:opacity-90 transition-smooth shadow-glow text-base sm:text-lg px-8 sm:px-12 py-5 sm:py-6 w-full sm:w-auto max-w-md mx-4"
            >
              Criar Conta Grátis
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; 2024 Elyon Builder. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
