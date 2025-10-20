import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'
import { useAuthGuard } from '@/hooks/useAuthGuard'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { PlusCircle, LogOut, Users, Copy, ExternalLink } from 'lucide-react'

interface Project {
  id: string
  name: string
  description: string
  created_at: string
}

export default function Dashboard() {
  useAuthGuard()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newProject, setNewProject] = useState({ name: '', description: '' })
  const navigate = useNavigate()

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Erro ao buscar projetos:', error)
      } else {
        setProjects(data || [])
      }
      setLoading(false)
    }
  }

  const handleCreateProject = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user && newProject.name.trim()) {
      const { data, error } = await supabase
        .from('projects')
        .insert([
          {
            name: newProject.name,
            description: newProject.description,
            owner_id: user.id
          }
        ])
        .select()

      if (error) {
        console.error('Erro ao criar projeto:', error)
      } else if (data && data.length > 0) {
        // Create default branding
        await supabase
          .from('project_branding')
          .insert([
            {
              project_id: data[0].id
            }
          ])
        
        setIsCreateDialogOpen(false)
        setNewProject({ name: '', description: '' })
        fetchProjects()
      }
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const getMemberAreaUrl = (projectId: string) => {
    return `${window.location.origin}/member/${projectId}/login`
  }

  const copyMemberAreaUrl = (projectId: string) => {
    navigator.clipboard.writeText(getMemberAreaUrl(projectId))
    alert('URL copiada para a área de transferência!')
  }

  const openMemberArea = (projectId: string) => {
    window.open(getMemberAreaUrl(projectId), '_blank')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Meus Projetos</h1>
          <div className="flex gap-2">
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Novo Projeto
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Criar Novo Projeto</DialogTitle>
                  <DialogDescription>
                    Crie uma nova área de membros
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="project-name">Nome do Projeto</Label>
                    <Input
                      id="project-name"
                      value={newProject.name}
                      onChange={(e) => setNewProject({...newProject, name: e.target.value})}
                      placeholder="Nome do projeto"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="project-description">Descrição</Label>
                    <Input
                      id="project-description"
                      value={newProject.description}
                      onChange={(e) => setNewProject({...newProject, description: e.target.value})}
                      placeholder="Descrição do projeto"
                    />
                  </div>
                  <Button onClick={handleCreateProject} className="w-full">
                    Criar Projeto
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">Você ainda não tem projetos</p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Criar seu primeiro projeto
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Card key={project.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle>{project.name}</CardTitle>
                  <CardDescription>{project.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-500 mb-4">
                    Criado em: {new Date(project.created_at).toLocaleDateString()}
                  </p>
                  <div className="space-y-2">
                    <Button 
                      className="w-full" 
                      variant="outline"
                      onClick={() => navigate(`/project/${project.id}`)}
                    >
                      Editar Projeto
                    </Button>
                    <div className="flex gap-2">
                      <Button 
                        className="flex-1" 
                        variant="outline"
                        onClick={() => copyMemberAreaUrl(project.id)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button 
                        className="flex-1" 
                        onClick={() => openMemberArea(project.id)}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button 
                      className="w-full" 
                      variant="outline"
                      onClick={() => navigate(`/member/${project.id}/area`)}
                    >
                      <Users className="mr-2 h-4 w-4" />
                      Gerenciar Membros
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}