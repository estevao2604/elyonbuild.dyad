import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LogOut, BookOpen, User, Settings } from 'lucide-react'

interface Project {
  id: string
  name: string
  description: string
}

interface Module {
  id: string
  title: string
  description: string
  display_order: number
}

interface Lesson {
  id: string
  module_id: string
  title: string
  description: string
  content_type: string
  duration_minutes: number | null
}

export default function MemberArea() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [project, setProject] = useState<Project | null>(null)
  const [modules, setModules] = useState<Module[]>([])
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [activeTab, setActiveTab] = useState('modules')

  useEffect(() => {
    checkAuth()
    if (id) {
      fetchProjectData(id)
    }
  }, [id])

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      navigate(`/member/${id}/login`)
    } else {
      setUser(session.user)
    }
  }

  const fetchProjectData = async (projectId: string) => {
    try {
      // Fetch project
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single()

      if (projectError) throw projectError
      setProject(projectData)

      // Fetch modules the member has access to
      const { data: accessData, error: accessError } = await supabase
        .from('member_module_access')
        .select('module_id')
        .eq('member_id', (await supabase.auth.getUser()).data.user?.id)

      if (accessError) throw accessError

      const moduleIds = accessData?.map(a => a.module_id) || []
      
      if (moduleIds.length > 0) {
        // Fetch modules
        const { data: modulesData, error: modulesError } = await supabase
          .from('modules')
          .select('*')
          .in('id', moduleIds)
          .eq('is_published', true)
          .order('display_order', { ascending: true })

        if (modulesError) throw modulesError
        setModules(modulesData || [])

        // Fetch lessons
        const { data: lessonsData, error: lessonsError } = await supabase
          .from('lessons')
          .select('*')
          .in('module_id', moduleIds)
          .eq('is_published', true)
          .order('display_order', { ascending: true })

        if (lessonsError) throw lessonsError
        setLessons(lessonsData || [])
      }
    } catch (error) {
      console.error('Erro ao buscar dados do projeto:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate(`/member/${id}/login`)
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
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Área de Membros Não Encontrada</h1>
          <p className="text-gray-600 mb-6">O projeto solicitado não existe ou foi removido.</p>
          <Button onClick={() => navigate('/')}>
            Voltar para o início
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">{project.name}</h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Avatar>
                <AvatarImage src={user?.user_metadata?.avatar_url} />
                <AvatarFallback>
                  {user?.email?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm text-gray-600">
                {user?.email}
              </span>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="modules" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Módulos
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Perfil
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Configurações
            </TabsTrigger>
          </TabsList>

          <TabsContent value="modules">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
              {modules.map((module) => {
                const moduleLessons = lessons.filter(l => l.module_id === module.id)
                return (
                  <Card key={module.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <CardTitle>{module.title}</CardTitle>
                      <CardDescription>{module.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 mb-4">
                        {moduleLessons.length} aula{moduleLessons.length !== 1 ? 's' : ''}
                      </p>
                      <Button className="w-full">
                        Acessar Módulo
                      </Button>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </TabsContent>

          <TabsContent value="profile">
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Meu Perfil</CardTitle>
                <CardDescription>
                  Gerencie suas informações pessoais
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 mb-6">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={user?.user_metadata?.avatar_url} />
                    <AvatarFallback className="text-2xl">
                      {user?.email?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-xl font-semibold">{user?.email}</h3>
                    <p className="text-gray-600">Membro</p>
                  </div>
                </div>
                <Button>Editar Perfil</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Configurações</CardTitle>
                <CardDescription>
                  Configure suas preferências da área de membros
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Configurações da área de membros serão implementadas aqui.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}