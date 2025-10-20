import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'
import { useAuthGuard } from '@/hooks/useAuthGuard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft, Save, Palette, BookOpen, Users } from 'lucide-react'

interface Project {
  id: string
  name: string
  description: string
}

interface Branding {
  primary_color: string
  secondary_color: string
  accent_color: string
  background_color: string
  container_color: string
  button_color: string
  text_color: string
  header_background_color: string
  header_text_color: string
  card_text_color: string
  muted_text_color: string
}

export default function ProjectBuilder() {
  useAuthGuard()
  const { id } = useParams()
  const navigate = useNavigate()
  const [project, setProject] = useState<Project | null>(null)
  const [branding, setBranding] = useState<Branding>({
    primary_color: '#3b82f6',
    secondary_color: '#10b981',
    accent_color: '#f59e0b',
    background_color: '#f9fafb',
    container_color: '#ffffff',
    button_color: '#3b82f6',
    text_color: '#1f2937',
    header_background_color: '#ffffff',
    header_text_color: '#1f2937',
    card_text_color: '#1f2937',
    muted_text_color: '#6b7280'
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('general')

  useEffect(() => {
    if (id) {
      fetchProject(id)
      fetchBranding(id)
    }
  }, [id])

  const fetchProject = async (projectId: string) => {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single()

    if (error) {
      console.error('Erro ao buscar projeto:', error)
    } else {
      setProject(data)
    }
    setLoading(false)
  }

  const fetchBranding = async (projectId: string) => {
    const { data, error } = await supabase
      .from('project_branding')
      .select('*')
      .eq('project_id', projectId)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Erro ao buscar branding:', error)
    } else if (data) {
      setBranding({
        primary_color: data.primary_color,
        secondary_color: data.secondary_color,
        accent_color: data.accent_color,
        background_color: data.background_color,
        container_color: data.container_color,
        button_color: data.button_color,
        text_color: data.text_color,
        header_background_color: data.header_background_color,
        header_text_color: data.header_text_color,
        card_text_color: data.card_text_color,
        muted_text_color: data.muted_text_color
      })
    }
  }

  const handleSave = async () => {
    if (!project) return

    setSaving(true)
    
    try {
      // Save project
      const { error: projectError } = await supabase
        .from('projects')
        .update({
          name: project.name,
          description: project.description
        })
        .eq('id', project.id)

      if (projectError) throw projectError

      // Save branding
      const { error: brandingError } = await supabase
        .from('project_branding')
        .upsert({
          project_id: project.id,
          ...branding
        }, {
          onConflict: 'project_id'
        })

      if (brandingError) throw brandingError

      alert('Projeto salvo com sucesso!')
    } catch (error) {
      console.error('Erro ao salvar projeto:', error)
      alert('Erro ao salvar projeto')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Projeto não encontrado</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold">Construtor de Projeto</h1>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Geral
            </TabsTrigger>
            <TabsTrigger value="branding" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Design
            </TabsTrigger>
            <TabsTrigger value="members" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Membros
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Configurações do Projeto</CardTitle>
                <CardDescription>
                  Configure as informações básicas do seu projeto
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Projeto</Label>
                  <Input
                    id="name"
                    value={project.name}
                    onChange={(e) => setProject({...project, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={project.description}
                    onChange={(e) => setProject({...project, description: e.target.value})}
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="branding">
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Design da Área de Membros</CardTitle>
                <CardDescription>
                  Personalize a aparência da sua área de membros
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="primary_color">Cor Primária</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="primary_color"
                        type="color"
                        value={branding.primary_color}
                        onChange={(e) => setBranding({...branding, primary_color: e.target.value})}
                        className="w-16 h-10 p-1"
                      />
                      <Input
                        type="text"
                        value={branding.primary_color}
                        onChange={(e) => setBranding({...branding, primary_color: e.target.value})}
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="secondary_color">Cor Secundária</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="secondary_color"
                        type="color"
                        value={branding.secondary_color}
                        onChange={(e) => setBranding({...branding, secondary_color: e.target.value})}
                        className="w-16 h-10 p-1"
                      />
                      <Input
                        type="text"
                        value={branding.secondary_color}
                        onChange={(e) => setBranding({...branding, secondary_color: e.target.value})}
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="accent_color">Cor de Destaque</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="accent_color"
                        type="color"
                        value={branding.accent_color}
                        onChange={(e) => setBranding({...branding, accent_color: e.target.value})}
                        className="w-16 h-10 p-1"
                      />
                      <Input
                        type="text"
                        value={branding.accent_color}
                        onChange={(e) => setBranding({...branding, accent_color: e.target.value})}
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="background_color">Cor de Fundo</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="background_color"
                        type="color"
                        value={branding.background_color}
                        onChange={(e) => setBranding({...branding, background_color: e.target.value})}
                        className="w-16 h-10 p-1"
                      />
                      <Input
                        type="text"
                        value={branding.background_color}
                        onChange={(e) => setBranding({...branding, background_color: e.target.value})}
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="button_color">Cor dos Botões</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="button_color"
                        type="color"
                        value={branding.button_color}
                        onChange={(e) => setBranding({...branding, button_color: e.target.value})}
                        className="w-16 h-10 p-1"
                      />
                      <Input
                        type="text"
                        value={branding.button_color}
                        onChange={(e) => setBranding({...branding, button_color: e.target.value})}
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="text_color">Cor do Texto</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="text_color"
                        type="color"
                        value={branding.text_color}
                        onChange={(e) => setBranding({...branding, text_color: e.target.value})}
                        className="w-16 h-10 p-1"
                      />
                      <Input
                        type="text"
                        value={branding.text_color}
                        onChange={(e) => setBranding({...branding, text_color: e.target.value})}
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="members">
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Gestão de Membros</CardTitle>
                <CardDescription>
                  Gerencie os membros da sua área de membros
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Funcionalidades de gestão de membros serão implementadas aqui.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}