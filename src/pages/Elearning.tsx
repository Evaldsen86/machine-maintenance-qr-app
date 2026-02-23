import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useAuth } from '@/hooks/useAuth';
import { 
  Video, 
  VideoProgress, 
  Approval, 
  MachineChecklist,
  Machine,
  User
} from '@/types';
import { 
  Play, 
  Search, 
  CheckCircle, 
  Clock, 
  Truck, 
  Film,
  CheckSquare,
  UserCheck,
  Filter
} from 'lucide-react';
import VideoPlayer from '@/components/elearning/VideoPlayer';
import ChecklistView from '@/components/elearning/ChecklistView';
import ApprovalStatus from '@/components/elearning/ApprovalStatus';
import VideoUploadForm from '@/components/elearning/VideoUploadForm';
import ChecklistForm from '@/components/elearning/ChecklistForm';
import ApprovalForm from '@/components/elearning/ApprovalForm';
import CopyToMachinesDialog from '@/components/elearning/CopyToMachinesDialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { Plus, Trash2, Copy } from 'lucide-react';

const Elearning = () => {
  const { id } = useParams<{ id?: string }>();
  const { user } = useAuth();
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [videoProgress, setVideoProgress] = useState<VideoProgress[]>([]);
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [checklists, setChecklists] = useState<MachineChecklist[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);
  const [showVideoUpload, setShowVideoUpload] = useState(false);
  const [showChecklistForm, setShowChecklistForm] = useState(false);
  const [showApprovalForm, setShowApprovalForm] = useState(false);
  const [showCopyDialog, setShowCopyDialog] = useState(false);
  const [copySourceMachine, setCopySourceMachine] = useState<Machine | null>(null);
  const [copyType, setCopyType] = useState<'videos' | 'checklist'>('videos');
  const [editingChecklist, setEditingChecklist] = useState<MachineChecklist | null>(null);
  const [editingApproval, setEditingApproval] = useState<Approval | null>(null);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  // Load data
  useEffect(() => {
    loadElearningData();
  }, [id, user]);

  // Reload machines periodically to catch new machines
  useEffect(() => {
    const reloadMachines = () => {
      const storedMachines = localStorage.getItem('machines');
      if (storedMachines) {
        const allMachines = JSON.parse(storedMachines);
        setMachines(allMachines);
      } else {
        const dashboardMachines = localStorage.getItem('dashboard_machines');
        if (dashboardMachines) {
          const allMachines = JSON.parse(dashboardMachines);
          setMachines(allMachines);
        }
      }
    };

    // Reload immediately
    reloadMachines();

    // Set up interval to check for new machines
    const interval = setInterval(reloadMachines, 3000);

    return () => clearInterval(interval);
  }, []);

  const loadElearningData = () => {
    setLoading(true);
    try {
      // Load videos from localStorage
      const storedVideos = localStorage.getItem('elearning_videos');
      if (storedVideos) {
        setVideos(JSON.parse(storedVideos));
      }

      // Load video progress for all users (needed for approval form)
      const allProgress: VideoProgress[] = [];
      // Try to load progress for all known users
      const storedUsers = localStorage.getItem('users');
      const usersList = storedUsers ? JSON.parse(storedUsers) : [];
      usersList.forEach((u: User) => {
        const userProgress = localStorage.getItem(`elearning_progress_${u.id}`);
        if (userProgress) {
          allProgress.push(...JSON.parse(userProgress));
        }
      });
      // Also load current user's progress if logged in
      if (user) {
        const currentUserProgress = localStorage.getItem(`elearning_progress_${user.id}`);
        if (currentUserProgress) {
          const parsed = JSON.parse(currentUserProgress);
          // Merge with existing, avoiding duplicates
          parsed.forEach((p: VideoProgress) => {
            if (!allProgress.find(ap => ap.id === p.id)) {
              allProgress.push(p);
            }
          });
        }
      }
      setVideoProgress(allProgress);

      // Load approvals (global, not per user)
      const storedApprovals = localStorage.getItem('elearning_approvals');
      if (storedApprovals) {
        setApprovals(JSON.parse(storedApprovals));
      }

      // Load users for approval form
      const storedUsersForForm = localStorage.getItem('users');
      if (storedUsersForForm) {
        setUsers(JSON.parse(storedUsersForForm));
      } else {
        // Fallback to mock users if not in localStorage
        const mockUsers: User[] = [
          { id: '1', name: 'Anders Andersen', email: 'anders@example.com', role: 'driver' },
          { id: '2', name: 'Mette Mikkelsen', email: 'mette@example.com', role: 'mechanic' },
          { id: '3', name: 'Lars Larsen', email: 'lars@example.com', role: 'admin' },
          { id: '4', name: 'Peter Petersen', email: 'peter@example.com', role: 'technician' },
        ];
        setUsers(mockUsers);
      }

      // Load checklists
      const storedChecklists = localStorage.getItem('elearning_checklists');
      if (storedChecklists) {
        setChecklists(JSON.parse(storedChecklists));
      }

      // Load machines - reload every time to get latest
      const storedMachines = localStorage.getItem('machines');
      if (storedMachines) {
        const allMachines = JSON.parse(storedMachines);
        setMachines(allMachines);
        
        // Load machine if ID provided
        if (id) {
          const machine = allMachines.find((m: Machine) => m.id === id);
          if (machine) {
            setSelectedMachine(machine);
          }
        }
      } else {
        // Try to load from dashboard_machines as fallback
        const dashboardMachines = localStorage.getItem('dashboard_machines');
        if (dashboardMachines) {
          const allMachines = JSON.parse(dashboardMachines);
          setMachines(allMachines);
        }
      }
    } catch (error) {
      console.error("Error loading e-learning data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filter videos based on machine and search
  const filteredVideos = videos.filter(video => {
    const matchesSearch = !searchQuery || 
      video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      video.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || video.category === selectedCategory;
    
    const matchesMachine = !selectedMachine || 
      !video.machineIds || 
      video.machineIds.length === 0 ||
      video.machineIds.includes(selectedMachine.id);
    
    return matchesSearch && matchesCategory && matchesMachine;
  });

  // Get categories
  const categories = Array.from(new Set(videos.map(v => v.category)));

  // Get progress for a video
  const getVideoProgress = (videoId: string): VideoProgress | undefined => {
    return videoProgress.find(p => p.videoId === videoId && p.userId === user?.id);
  };

  // Save video
  const handleSaveVideo = (video: Video) => {
    const updated = [...videos, video];
    setVideos(updated);
    localStorage.setItem('elearning_videos', JSON.stringify(updated));
    loadElearningData();
  };

  // Save checklist
  const handleSaveChecklist = (checklist: MachineChecklist) => {
    if (editingChecklist) {
      const updated = checklists.map(c => c.id === checklist.id ? checklist : c);
      setChecklists(updated);
      localStorage.setItem('elearning_checklists', JSON.stringify(updated));
      setEditingChecklist(null);
    } else {
      const updated = [...checklists, checklist];
      setChecklists(updated);
      localStorage.setItem('elearning_checklists', JSON.stringify(updated));
    }
    loadElearningData();
  };

  // Delete video
  const handleDeleteVideo = (videoId: string) => {
    if (confirm('Er du sikker på, at du vil slette denne video?')) {
      const updated = videos.filter(v => v.id !== videoId);
      setVideos(updated);
      localStorage.setItem('elearning_videos', JSON.stringify(updated));
      loadElearningData();
      toast({
        title: "Video slettet",
        description: "Videoen er blevet slettet.",
      });
    }
  };

  // Save approval
  const handleSaveApproval = (approval: Approval) => {
    if (editingApproval) {
      const updated = approvals.map(a => a.id === approval.id ? approval : a);
      setApprovals(updated);
      localStorage.setItem('elearning_approvals', JSON.stringify(updated));
      setEditingApproval(null);
    } else {
      const updated = [...approvals, approval];
      setApprovals(updated);
      localStorage.setItem('elearning_approvals', JSON.stringify(updated));
    }
    loadElearningData();
  };

  // Delete checklist
  const handleDeleteChecklist = (checklistId: string) => {
    if (confirm('Er du sikker på, at du vil slette denne checkliste?')) {
      const updated = checklists.filter(c => c.id !== checklistId);
      setChecklists(updated);
      localStorage.setItem('elearning_checklists', JSON.stringify(updated));
      loadElearningData();
      toast({
        title: "Checkliste slettet",
        description: "Checklisten er blevet slettet.",
      });
    }
  };

  // Copy videos to other machines
  const handleCopyVideos = (sourceMachineId: string) => {
    const machine = machines.find(m => m.id === sourceMachineId);
    if (machine) {
      setCopySourceMachine(machine);
      setCopyType('videos');
      setShowCopyDialog(true);
    }
  };

  // Copy checklist to other machines
  const handleCopyChecklist = (sourceMachineId: string) => {
    const machine = machines.find(m => m.id === sourceMachineId);
    if (machine) {
      setCopySourceMachine(machine);
      setCopyType('checklist');
      setShowCopyDialog(true);
    }
  };

  // Handle copy action
  const handleCopyToMachines = (targetMachineIds: string[]) => {
    if (!copySourceMachine) return;

    if (copyType === 'videos') {
      // Copy videos linked to source machine to target machines
      const sourceVideos = videos.filter(v => 
        v.machineIds && v.machineIds.includes(copySourceMachine.id)
      );

      const updatedVideos = videos.map(video => {
        if (sourceVideos.find(sv => sv.id === video.id)) {
          // This is a source video - add target machine IDs
          const existingMachineIds = video.machineIds || [];
          const newMachineIds = [...new Set([...existingMachineIds, ...targetMachineIds])];
          return {
            ...video,
            machineIds: newMachineIds
          };
        }
        return video;
      });

      setVideos(updatedVideos);
      localStorage.setItem('elearning_videos', JSON.stringify(updatedVideos));
      
      toast({
        title: "Videoer kopieret",
        description: `${sourceVideos.length} videoer er blevet kopieret til ${targetMachineIds.length} maskine${targetMachineIds.length !== 1 ? 'r' : ''}.`,
      });
    } else {
      // Copy checklist from source machine to target machines
      const sourceChecklist = checklists.find(c => c.machineId === copySourceMachine.id);
      
      if (sourceChecklist) {
        const newChecklists = targetMachineIds.map(machineId => {
          const targetMachine = machines.find(m => m.id === machineId);
          if (!targetMachine) return null;

          // Check if checklist already exists for this machine
          const existing = checklists.find(c => c.machineId === machineId);
          if (existing) {
            // Update existing
            return {
              ...sourceChecklist,
              id: existing.id,
              machineId: machineId,
              machineName: targetMachine.name,
              updatedAt: new Date().toISOString(),
            };
          } else {
            // Create new
            return {
              ...sourceChecklist,
              id: `checklist-${Date.now()}-${Math.random()}`,
              machineId: machineId,
              machineName: targetMachine.name,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
          }
        }).filter(Boolean) as MachineChecklist[];

        // Merge with existing checklists
        const updatedChecklists = checklists.map(c => {
          const updated = newChecklists.find(nc => nc.id === c.id);
          return updated || c;
        });

        // Add new checklists
        newChecklists.forEach(nc => {
          if (!updatedChecklists.find(c => c.id === nc.id)) {
            updatedChecklists.push(nc);
          }
        });

        setChecklists(updatedChecklists);
        localStorage.setItem('elearning_checklists', JSON.stringify(updatedChecklists));
        
        toast({
          title: "Checkliste kopieret",
          description: `Checklisten er blevet kopieret til ${targetMachineIds.length} maskine${targetMachineIds.length !== 1 ? 'r' : ''}.`,
        });
      }
    }

    loadElearningData();
  };

  // Mark video as watched
  const markVideoWatched = (video: Video, progress: number = 100) => {
    if (!user) return;

    const existing = videoProgress.find(p => p.videoId === video.id && p.userId === user.id);
    const progressEntry: VideoProgress = {
      id: existing?.id || `progress-${Date.now()}`,
      userId: user.id,
      userName: user.name,
      videoId: video.id,
      videoTitle: video.title,
      watchedAt: new Date().toISOString(),
      progress,
      completed: progress >= 90, // Consider 90% as completed
    };

    const updated = existing 
      ? videoProgress.map(p => p.id === existing.id ? progressEntry : p)
      : [...videoProgress, progressEntry];
    
    setVideoProgress(updated);
    localStorage.setItem(`elearning_progress_${user.id}`, JSON.stringify(updated));
    
    toast({
      title: "Fremgang gemt",
      description: `Du har set ${Math.round(progress)}% af "${video.title}"`,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-lg text-muted-foreground">Indlæser e-learning...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1 container py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">E-Learning</h1>
            <p className="text-muted-foreground">
              Videoer, kurser og checklister for chauffører
            </p>
          </div>
          {(user?.role === 'admin' || user?.role === 'mechanic') && (
            <div className="flex gap-2">
              <Button onClick={() => setShowVideoUpload(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Tilføj Video
              </Button>
              <Button variant="outline" onClick={() => {
                setEditingChecklist(null);
                setShowChecklistForm(true);
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Opret Checkliste
              </Button>
            </div>
          )}
        </div>

        {/* Machine Selector */}
        {selectedMachine && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Truck className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{selectedMachine.name}</p>
                    <p className="text-sm text-muted-foreground">{selectedMachine.brand} {selectedMachine.model}</p>
                  </div>
                </div>
                <Button variant="outline" onClick={() => setSelectedMachine(null)}>
                  Vis alle videoer
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="videos" className="space-y-6">
          <TabsList>
            <TabsTrigger value="videos">
              <Film className="h-4 w-4 mr-2" />
              Videoer
            </TabsTrigger>
            <TabsTrigger value="checklists">
              <CheckSquare className="h-4 w-4 mr-2" />
              Checklister
            </TabsTrigger>
            {user && user.role !== 'guest' && user.role !== 'viewer' && (
              <TabsTrigger value="approvals">
                <UserCheck className="h-4 w-4 mr-2" />
                Godkendelser
              </TabsTrigger>
            )}
          </TabsList>

          {/* Videos Tab */}
          <TabsContent value="videos" className="space-y-6">
            {/* Search and Filters */}
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Søg efter videoer..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[200px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle kategorier</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Video List */}
            {selectedVideo ? (
              <VideoPlayer
                video={selectedVideo}
                onClose={() => setSelectedVideo(null)}
                onProgress={(progress) => markVideoWatched(selectedVideo, progress)}
                initialProgress={getVideoProgress(selectedVideo.id)?.progress || 0}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredVideos.map(video => {
                  const progress = getVideoProgress(video.id);
                  return (
                    <Card 
                      key={video.id} 
                      className="cursor-pointer hover:shadow-lg transition-shadow relative"
                    >
                      <div onClick={() => setSelectedVideo(video)}>
                        <div className="relative">
                          {video.thumbnailUrl ? (
                            <img 
                              src={video.thumbnailUrl} 
                              alt={video.title}
                              className="w-full h-48 object-cover rounded-t-lg"
                            />
                          ) : (
                            <div className="w-full h-48 bg-muted flex items-center justify-center rounded-t-lg">
                              <Play className="h-12 w-12 text-muted-foreground" />
                            </div>
                          )}
                          {progress && (
                            <div className="absolute top-2 right-2">
                              <Badge variant={progress.completed ? "default" : "secondary"}>
                                {progress.completed ? (
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                ) : (
                                  <Clock className="h-3 w-3 mr-1" />
                                )}
                                {Math.round(progress.progress)}%
                              </Badge>
                            </div>
                          )}
                        </div>
                        <CardHeader>
                          <CardTitle className="text-lg">{video.title}</CardTitle>
                          <CardDescription>
                            {video.description || 'Ingen beskrivelse'}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="outline">{video.category}</Badge>
                            {video.subCategory && (
                              <Badge variant="outline">{video.subCategory}</Badge>
                            )}
                            {video.duration && (
                              <Badge variant="outline">
                                <Clock className="h-3 w-3 mr-1" />
                                {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}
                              </Badge>
                            )}
                          </div>
                        </CardContent>
                      </div>
                      {(user?.role === 'admin' || user?.role === 'mechanic') && (
                        <div className="absolute top-2 left-2 flex gap-1">
                          {video.machineIds && video.machineIds.length > 0 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                const firstMachineId = video.machineIds![0];
                                handleCopyVideos(firstMachineId);
                              }}
                              title="Kopiér til andre maskiner"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          )}
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteVideo(video.id);
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            )}

            {filteredVideos.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center">
                  <Film className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Ingen videoer fundet</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Checklists Tab */}
          <TabsContent value="checklists">
            <ChecklistView
              machine={selectedMachine}
              checklists={checklists}
              onEdit={(checklist) => {
                setEditingChecklist(checklist);
                setShowChecklistForm(true);
              }}
              onDelete={handleDeleteChecklist}
              onCopy={(machineId) => handleCopyChecklist(machineId)}
              canEdit={user?.role === 'admin' || user?.role === 'mechanic'}
            />
          </TabsContent>

          {/* Approvals Tab - Only for non-guests */}
          {user && user.role !== 'guest' && user.role !== 'viewer' && (
            <TabsContent value="approvals" className="space-y-4">
              {(user.role === 'admin' || user.role === 'mechanic' || user.role === 'technician') && (
                <div className="flex justify-end">
                  <Button onClick={() => {
                    setEditingApproval(null);
                    setShowApprovalForm(true);
                  }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Opret Godkendelse
                  </Button>
                </div>
              )}
              <ApprovalStatus
                approvals={approvals}
                machine={selectedMachine}
                user={user}
                videos={videos}
                onEdit={(approval) => {
                  setEditingApproval(approval);
                  setShowApprovalForm(true);
                }}
                canEdit={user.role === 'admin' || user.role === 'mechanic'}
              />
            </TabsContent>
          )}
        </Tabs>

        {/* Admin Forms */}
        <VideoUploadForm
          isOpen={showVideoUpload}
          onClose={() => setShowVideoUpload(false)}
          onSave={handleSaveVideo}
          machines={machines}
        />

        <ApprovalForm
          isOpen={showApprovalForm}
          onClose={() => {
            setShowApprovalForm(false);
            setEditingApproval(null);
          }}
          onSave={handleSaveApproval}
          machines={machines}
          videos={videos}
          videoProgress={videoProgress}
          users={users}
          existingApproval={editingApproval || undefined}
        />

        <ChecklistForm
          isOpen={showChecklistForm}
          onClose={() => {
            setShowChecklistForm(false);
            setEditingChecklist(null);
          }}
          onSave={handleSaveChecklist}
          machines={machines}
          existingChecklist={editingChecklist || undefined}
        />

        {copySourceMachine && (
          <CopyToMachinesDialog
            isOpen={showCopyDialog}
            onClose={() => {
              setShowCopyDialog(false);
              setCopySourceMachine(null);
            }}
            onCopy={handleCopyToMachines}
            sourceMachine={copySourceMachine}
            machines={machines}
            type={copyType}
            itemCount={copyType === 'videos' 
              ? videos.filter(v => v.machineIds && v.machineIds.includes(copySourceMachine.id)).length
              : 1
            }
          />
        )}
      </main>
    </div>
  );
};

export default Elearning;

