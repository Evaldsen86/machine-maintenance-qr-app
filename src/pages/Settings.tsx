import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { 
  UserCog, 
  Settings as SettingsIcon, 
  Database, 
  Bell,
  Check,
  AtSign,
  Clock,
  Calendar,
  Droplets,
  Wrench,
  Download,
  Trash2,
  PlusCircle
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { EquipmentSpecificInterval, EquipmentType, NotificationSettings } from '@/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ToggleGroup,
  ToggleGroupItem
} from "@/components/ui/toggle-group";
import { Separator } from "@/components/ui/separator";
import { equipmentTranslations } from '@/utils/equipmentTranslations';

const Settings = () => {
  const { user, canManageUsers } = useAuth();
  const navigate = useNavigate();
  
  const [notificationDialogOpen, setNotificationDialogOpen] = useState(false);
  const [serviceDialogOpen, setServiceDialogOpen] = useState(false);
  const [lubricationDialogOpen, setLubricationDialogOpen] = useState(false);
  const [equipmentSpecificDialogOpen, setEquipmentSpecificDialogOpen] = useState(false);
  
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    maintenance: true,
    tasks: true,
    documents: true,
    
    serviceRemindersEnabled: true,
    serviceReminderInterval: 'monthly',
    serviceCustomInterval: 30,
    serviceIntervalUnit: 'days',
    serviceRecipients: [],
    
    lubricationRemindersEnabled: true,
    lubricationReminderInterval: 'biweekly',
    lubricationCustomInterval: 14,
    lubricationIntervalUnit: 'days',
    lubricationRecipients: [],
    
    equipmentSpecificIntervals: [
      { equipmentType: 'crane', interval: 14, unit: 'days', enabled: true },
      { equipmentType: 'hooklift', interval: 30, unit: 'days', enabled: false },
      { equipmentType: 'winch', interval: 30, unit: 'days', enabled: false },
      { equipmentType: 'truck', interval: 30, unit: 'days', enabled: false }
    ],
    
    taskAssignments: true,
    systemUpdates: false,
    documentUploads: true,
    
    email: true,
    sms: false,
    push: true,
    advanceNotice: 3,
    advanceUnit: 'days',
    emailNotifications: true,
    daysBeforeDeadline: 3
  });
  
  const [serviceEmailRecipient, setServiceEmailRecipient] = useState('');
  const [lubricationEmailRecipient, setLubricationEmailRecipient] = useState('');
  const [selectedEquipmentType, setSelectedEquipmentType] = useState<EquipmentType | null>(null);
  const [exportProgress, setExportProgress] = useState(0);
  const [isExporting, setIsExporting] = useState(false);

  const handleUserManagement = () => {
    navigate('/user-management');
  };

  const handleNotificationChange = (key: keyof NotificationSettings, value: any) => {
    setNotificationSettings(prev => ({
      ...prev,
      [key]: typeof value === 'boolean' ? !prev[key as keyof typeof prev] : value
    }));
  };
  
  const handleEquipmentIntervalChange = (equipmentType: EquipmentType, key: keyof Omit<EquipmentSpecificInterval, 'equipmentType'>, value: any) => {
    setNotificationSettings(prev => ({
      ...prev,
      equipmentSpecificIntervals: prev.equipmentSpecificIntervals.map(item => 
        item.equipmentType === equipmentType 
          ? { ...item, [key]: typeof value === 'boolean' ? !item[key as keyof typeof item] : value }
          : item
      )
    }));
  };

  const saveNotificationSettings = () => {
    toast({
      title: "Notifikationer opdateret",
      description: "Dine notifikationsindstillinger er blevet gemt.",
    });
    setNotificationDialogOpen(false);
  };
  
  const saveServiceSettings = () => {
    toast({
      title: "Service notifikationer opdateret",
      description: "Dine service notifikationsindstillinger er blevet gemt.",
    });
    setServiceDialogOpen(false);
  };
  
  const saveLubricationSettings = () => {
    toast({
      title: "Smørings notifikationer opdateret",
      description: "Dine smørings notifikationsindstillinger er blevet gemt.",
    });
    setLubricationDialogOpen(false);
  };
  
  const saveEquipmentSpecificSettings = () => {
    toast({
      title: "Udstyr-specifikke intervaller opdateret",
      description: "Dine indstillinger for udstyr-specifikke smøringsintervaller er blevet gemt.",
    });
    setEquipmentSpecificDialogOpen(false);
  };

  const addServiceEmailRecipient = () => {
    if (!serviceEmailRecipient.trim() || !serviceEmailRecipient.includes('@')) {
      toast({
        variant: "destructive",
        title: "Ugyldig e-mail",
        description: "Indtast venligst en gyldig e-mailadresse.",
      });
      return;
    }

    setNotificationSettings(prev => ({
      ...prev,
      serviceRecipients: [...prev.serviceRecipients, serviceEmailRecipient.trim()]
    }));
    setServiceEmailRecipient('');
  };

  const removeServiceEmailRecipient = (email: string) => {
    setNotificationSettings(prev => ({
      ...prev,
      serviceRecipients: prev.serviceRecipients.filter(r => r !== email)
    }));
  };
  
  const addLubricationEmailRecipient = () => {
    if (!lubricationEmailRecipient.trim() || !lubricationEmailRecipient.includes('@')) {
      toast({
        variant: "destructive",
        title: "Ugyldig e-mail",
        description: "Indtast venligst en gyldig e-mailadresse.",
      });
      return;
    }

    setNotificationSettings(prev => ({
      ...prev,
      lubricationRecipients: [...prev.lubricationRecipients, lubricationEmailRecipient.trim()]
    }));
    setLubricationEmailRecipient('');
  };

  const removeLubricationEmailRecipient = (email: string) => {
    setNotificationSettings(prev => ({
      ...prev,
      lubricationRecipients: prev.lubricationRecipients.filter(r => r !== email)
    }));
  };

  const handleDatabaseExport = () => {
    setIsExporting(true);
    setExportProgress(0);
    
    toast({
      title: "Eksport påbegyndt",
      description: "Data eksporteres. Dette kan tage et øjeblik...",
    });

    const interval = setInterval(() => {
      setExportProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 200);

    setTimeout(() => {
      clearInterval(interval);
      setExportProgress(100);
      
      const dummyData = {
        machines: [
          { id: 1, name: "Maskine 1", type: "Gravemaskine" },
          { id: 2, name: "Maskine 2", type: "Traktor" }
        ],
        serviceRecords: [
          { id: 1, machineId: 1, date: "2023-04-01", description: "Oliefilter skiftet" },
          { id: 2, machineId: 1, date: "2023-05-15", description: "Årlig service" }
        ],
        notificationSettings: notificationSettings
      };

      const dataStr = JSON.stringify(dummyData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `transport-greenland-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      setIsExporting(false);
      
      toast({
        title: "Eksport fuldført",
        description: "Data er blevet eksporteret til en fil.",
        variant: "default",
      });
    }, 2000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1 page-container py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Indstillinger</h1>
            <p className="text-muted-foreground">
              Administrer systemindstillinger og konfiguration
            </p>
          </div>
        </div>
        
        <Tabs defaultValue="general" className="space-y-8">
          <TabsList>
            <TabsTrigger value="general">Generelt</TabsTrigger>
            <TabsTrigger value="notifications">Notifikationer</TabsTrigger>
            {canManageUsers() && (
              <TabsTrigger value="users">Brugere</TabsTrigger>
            )}
          </TabsList>
          
          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Generelle Indstillinger</CardTitle>
                <CardDescription>
                  Konfigurer grundlæggende systemindstillinger
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4">
                  <div className="flex items-center justify-between border-b pb-4">
                    <div>
                      <h3 className="font-medium">Virksomhedsnavn</h3>
                      <p className="text-sm text-muted-foreground">
                        Det navn der vises overalt i systemet
                      </p>
                    </div>
                    <div className="font-medium">Transport Greenland</div>
                  </div>
                  
                  <div className="flex items-center justify-between border-b pb-4">
                    <div>
                      <h3 className="font-medium">Standardsprog</h3>
                      <p className="text-sm text-muted-foreground">
                        Det primære sprog brugt i systemet
                      </p>
                    </div>
                    <div className="font-medium">Dansk</div>
                  </div>
                  
                  <div className="flex items-center justify-between pb-4">
                    <div>
                      <h3 className="font-medium">System Version</h3>
                      <p className="text-sm text-muted-foreground">
                        Nuværende system version
                      </p>
                    </div>
                    <div className="font-medium">1.0.0</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Database & Backup</CardTitle>
                <CardDescription>
                  Administrer data og backups
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Eksporter data</h3>
                      <p className="text-sm text-muted-foreground">
                        Eksporter alle systemdata til en fil
                      </p>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={handleDatabaseExport}
                      disabled={isExporting}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      {isExporting ? `Eksporterer (${exportProgress}%)` : 'Eksporter'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Notifikationsindstillinger</CardTitle>
                <CardDescription>
                  Konfigurer hvordan og hvornår systemet sender meddelelser
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid gap-4">
                    <div className="flex items-center justify-between border-b pb-4">
                      <div>
                        <h3 className="font-medium">Service Påmindelser</h3>
                        <p className="text-sm text-muted-foreground">
                          Send påmindelser om kommende servicetidspunkter
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <span className={notificationSettings.serviceRemindersEnabled ? "text-green-600 font-medium" : "text-gray-400"}>
                            {notificationSettings.serviceRemindersEnabled ? "Aktiveret" : "Deaktiveret"}
                          </span>
                          <Switch 
                            checked={notificationSettings.serviceRemindersEnabled}
                            onCheckedChange={() => handleNotificationChange('serviceRemindersEnabled', true)}
                          />
                        </div>
                        <Button size="sm" variant="outline" onClick={() => setServiceDialogOpen(true)}>
                          <Wrench className="w-4 h-4 mr-2" />
                          Konfigurer
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between border-b pb-4">
                      <div>
                        <h3 className="font-medium">Smørings Påmindelser</h3>
                        <p className="text-sm text-muted-foreground">
                          Bliv påmindet om at smøre maskiner efter tidsplan
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <span className={notificationSettings.lubricationRemindersEnabled ? "text-green-600 font-medium" : "text-gray-400"}>
                            {notificationSettings.lubricationRemindersEnabled ? "Aktiveret" : "Deaktiveret"}
                          </span>
                          <Switch 
                            checked={notificationSettings.lubricationRemindersEnabled}
                            onCheckedChange={() => handleNotificationChange('lubricationRemindersEnabled', true)}
                          />
                        </div>
                        <Button size="sm" variant="outline" onClick={() => setLubricationDialogOpen(true)}>
                          <Droplets className="w-4 h-4 mr-2" />
                          Konfigurer
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between border-b pb-4">
                      <div>
                        <h3 className="font-medium">Udstyr-specifikke Smøringsintervaller</h3>
                        <p className="text-sm text-muted-foreground">
                          Konfigurer separate smøringsintervaller for forskellige udstyrsdele
                        </p>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => setEquipmentSpecificDialogOpen(true)}>
                        <Calendar className="w-4 h-4 mr-2" />
                        Konfigurer
                      </Button>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">Administrer notifikationer</h3>
                        <p className="text-sm text-muted-foreground">
                          Opsæt detaljerede notifikationsindstillinger
                        </p>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => setNotificationDialogOpen(true)}>
                        <Bell className="w-4 h-4 mr-2" />
                        Konfigurer
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {canManageUsers() && (
            <TabsContent value="users" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Brugeradministration</CardTitle>
                  <CardDescription>
                    Administrer systembrugere og rettigheder
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p>
                      Her kan du administrere alle systembrugere, tildele roller og rettigheder, 
                      og håndtere brugeradgang.
                    </p>
                    <Button onClick={handleUserManagement}>
                      <UserCog className="w-4 h-4 mr-2" />
                      Gå til brugeradministration
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </main>

      <Dialog open={notificationDialogOpen} onOpenChange={setNotificationDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Generelle Notifikationsindstillinger</DialogTitle>
            <DialogDescription>
              Vælg hvilke typer af generelle notifikationer du ønsker at modtage.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h4 className="font-medium">Service påmindelser</h4>
                <p className="text-sm text-muted-foreground">
                  Bliv påmindet om kommende servicetidspunkter
                </p>
              </div>
              <Switch
                checked={notificationSettings.serviceRemindersEnabled}
                onCheckedChange={() => handleNotificationChange('serviceRemindersEnabled', true)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h4 className="font-medium">Smøring påmindelser</h4>
                <p className="text-sm text-muted-foreground">
                  Bliv påmindet om at smøre maskiner efter tidsplan
                </p>
              </div>
              <Switch
                checked={notificationSettings.lubricationRemindersEnabled}
                onCheckedChange={() => handleNotificationChange('lubricationRemindersEnabled', true)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h4 className="font-medium">Opgave tildeling</h4>
                <p className="text-sm text-muted-foreground">
                  Få besked når nye opgaver bliver tildelt til dig
                </p>
              </div>
              <Switch
                checked={notificationSettings.taskAssignments}
                onCheckedChange={() => handleNotificationChange('taskAssignments', true)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h4 className="font-medium">System opdateringer</h4>
                <p className="text-sm text-muted-foreground">
                  Bliv informeret om nye funktioner og system opdateringer
                </p>
              </div>
              <Switch
                checked={notificationSettings.systemUpdates}
                onCheckedChange={() => handleNotificationChange('systemUpdates', true)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h4 className="font-medium">Dokument uploads</h4>
                <p className="text-sm text-muted-foreground">
                  Få besked når nye dokumenter bliver uploadet til maskiner
                </p>
              </div>
              <Switch
                checked={notificationSettings.documentUploads}
                onCheckedChange={() => handleNotificationChange('documentUploads', true)}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setNotificationDialogOpen(false)}>
              Annuller
            </Button>
            <Button onClick={saveNotificationSettings}>
              <Check className="mr-2 h-4 w-4" />
              Gem indstillinger
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={serviceDialogOpen} onOpenChange={setServiceDialogOpen}>
        <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Service Notifikationsindstillinger</DialogTitle>
            <DialogDescription>
              Konfigurer påmindelser for service og kontrol af maskiner.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h4 className="font-medium">Aktivér service påmindelser</h4>
                <p className="text-sm text-muted-foreground">
                  Send påmindelser om kommende service deadlines
                </p>
              </div>
              <Switch
                checked={notificationSettings.serviceRemindersEnabled}
                onCheckedChange={() => handleNotificationChange('serviceRemindersEnabled', true)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Påmindelsesinterval</label>
              <Select
                value={notificationSettings.serviceReminderInterval || 'monthly'}
                onValueChange={(value: string) => handleNotificationChange('serviceReminderInterval', value)}
                disabled={!notificationSettings.serviceRemindersEnabled}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Vælg interval" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Ugentlig</SelectItem>
                  <SelectItem value="biweekly">Hver anden uge</SelectItem>
                  <SelectItem value="monthly">Månedlig</SelectItem>
                  <SelectItem value="1.5months">1,5 måned</SelectItem>
                  <SelectItem value="quarterly">Kvartalvis</SelectItem>
                  <SelectItem value="yearly">Årlig</SelectItem>
                  <SelectItem value="custom">Tilpasset interval</SelectItem>
                </SelectContent>
              </Select>

              {notificationSettings.serviceReminderInterval === 'custom' && (
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <Input
                    type="number"
                    min="1"
                    value={notificationSettings.serviceCustomInterval || 30}
                    onChange={(e) => handleNotificationChange('serviceCustomInterval', parseInt(e.target.value))}
                    disabled={!notificationSettings.serviceRemindersEnabled}
                  />
                  <Select
                    value={notificationSettings.serviceIntervalUnit || 'days'}
                    onValueChange={(value: any) => handleNotificationChange('serviceIntervalUnit', value)}
                    disabled={!notificationSettings.serviceRemindersEnabled}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="days">Dage</SelectItem>
                      <SelectItem value="months">Måneder</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">E-mail notifikationer for service</h4>
                <Switch
                  checked={notificationSettings.emailNotifications}
                  onCheckedChange={() => handleNotificationChange('emailNotifications', true)}
                  disabled={!notificationSettings.serviceRemindersEnabled}
                />
              </div>
              
              <div className="space-y-2 mt-4">
                <label className="text-sm font-medium">Dage før deadline</label>
                <Select
                  value={notificationSettings.daysBeforeDeadline.toString()}
                  onValueChange={(value) => 
                    handleNotificationChange('daysBeforeDeadline', parseInt(value))
                  }
                  disabled={!notificationSettings.emailNotifications || !notificationSettings.serviceRemindersEnabled}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Vælg antal dage" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 dag</SelectItem>
                    <SelectItem value="2">2 dage</SelectItem>
                    <SelectItem value="3">3 dage</SelectItem>
                    <SelectItem value="5">5 dage</SelectItem>
                    <SelectItem value="7">7 dage</SelectItem>
                    <SelectItem value="14">14 dage</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Hvor mange dage før en deadline der skal sendes påmindelse
                </p>
              </div>
              
              <div className="space-y-2 mt-4">
                <label className="text-sm font-medium">Service E-mail Modtagere</label>
                <div className="flex space-x-2">
                  <Input
                    placeholder="Indtast e-mailadresse"
                    value={serviceEmailRecipient}
                    onChange={(e) => setServiceEmailRecipient(e.target.value)}
                    className="flex-1"
                    disabled={!notificationSettings.emailNotifications || !notificationSettings.serviceRemindersEnabled}
                  />
                  <Button 
                    type="button" 
                    onClick={addServiceEmailRecipient}
                    disabled={!notificationSettings.emailNotifications || !notificationSettings.serviceRemindersEnabled}
                  >
                    Tilføj
                  </Button>
                </div>
                
                {notificationSettings.serviceRecipients.length > 0 ? (
                  <div className="mt-2 space-y-2 max-h-[150px] overflow-y-auto">
                    {notificationSettings.serviceRecipients.map((email) => (
                      <div key={email} className="flex items-center justify-between bg-muted p-2 rounded-md">
                        <span className="text-sm flex items-center">
                          <AtSign className="h-3 w-3 mr-1" />
                          {email}
                        </span>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => removeServiceEmailRecipient(email)}
                          disabled={!notificationSettings.emailNotifications || !notificationSettings.serviceRemindersEnabled}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground mt-2">
                    Ingen service-modtagere tilføjet endnu
                  </p>
                )}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setServiceDialogOpen(false)}>
              Annuller
            </Button>
            <Button onClick={saveServiceSettings}>
              <Check className="mr-2 h-4 w-4" />
              Gem indstillinger
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={lubricationDialogOpen} onOpenChange={setLubricationDialogOpen}>
        <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Smørings Notifikationsindstillinger</DialogTitle>
            <DialogDescription>
              Konfigurer påmindelser for smøring af maskiner og udstyr.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h4 className="font-medium">Aktivér smørings påmindelser</h4>
                <p className="text-sm text-muted-foreground">
                  Send påmindelser når udstyr skal smøres
                </p>
              </div>
              <Switch
                checked={notificationSettings.lubricationRemindersEnabled}
                onCheckedChange={() => handleNotificationChange('lubricationRemindersEnabled', true)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Generelt smøringsinterval</label>
              <Select
                value={notificationSettings.lubricationReminderInterval || 'biweekly'}
                onValueChange={(value: string) => handleNotificationChange('lubricationReminderInterval', value)}
                disabled={!notificationSettings.lubricationRemindersEnabled}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Vælg interval" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Ugentlig</SelectItem>
                  <SelectItem value="biweekly">Hver anden uge</SelectItem>
                  <SelectItem value="monthly">Månedlig</SelectItem>
                  <SelectItem value="quarterly">Kvartalvis</SelectItem>
                  <SelectItem value="yearly">Årlig</SelectItem>
                  <SelectItem value="custom">Tilpasset interval</SelectItem>
                </SelectContent>
              </Select>

              {notificationSettings.lubricationReminderInterval === 'custom' && (
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <Input
                    type="number"
                    min="1"
                    value={notificationSettings.lubricationCustomInterval || 14}
                    onChange={(e) => handleNotificationChange('lubricationCustomInterval', parseInt(e.target.value))}
                    disabled={!notificationSettings.lubricationRemindersEnabled}
                  />
                  <Select
                    value={notificationSettings.lubricationIntervalUnit || 'days'}
                    onValueChange={(value: any) => handleNotificationChange('lubricationIntervalUnit', value)}
                    disabled={!notificationSettings.lubricationRemindersEnabled}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="days">Dage</SelectItem>
                      <SelectItem value="months">Måneder</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">E-mail notifikationer for smøring</h4>
                <Switch
                  checked={notificationSettings.emailNotifications}
                  onCheckedChange={() => handleNotificationChange('emailNotifications', true)}
                  disabled={!notificationSettings.lubricationRemindersEnabled}
                />
              </div>
              
              <div className="space-y-2 mt-4">
                <label className="text-sm font-medium">Smørings E-mail Modtagere</label>
                <div className="flex space-x-2">
                  <Input
                    placeholder="Indtast e-mailadresse"
                    value={lubricationEmailRecipient}
                    onChange={(e) => setLubricationEmailRecipient(e.target.value)}
                    className="flex-1"
                    disabled={!notificationSettings.emailNotifications || !notificationSettings.lubricationRemindersEnabled}
                  />
                  <Button 
                    type="button" 
                    onClick={addLubricationEmailRecipient}
                    disabled={!notificationSettings.emailNotifications || !notificationSettings.lubricationRemindersEnabled}
                  >
                    Tilføj
                  </Button>
                </div>
                
                {notificationSettings.lubricationRecipients.length > 0 ? (
                  <div className="mt-2 space-y-2 max-h-[150px] overflow-y-auto">
                    {notificationSettings.lubricationRecipients.map((email) => (
                      <div key={email} className="flex items-center justify-between bg-muted p-2 rounded-md">
                        <span className="text-sm flex items-center">
                          <AtSign className="h-3 w-3 mr-1" />
                          {email}
                        </span>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => removeLubricationEmailRecipient(email)}
                          disabled={!notificationSettings.emailNotifications || !notificationSettings.lubricationRemindersEnabled}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground mt-2">
                    Ingen smørings-modtagere tilføjet endnu
                  </p>
                )}
              </div>
              
              <p className="text-sm text-muted-foreground mt-4">
                <strong>Bemærk:</strong> Du kan også konfigurere separate påmindelsesintervaller for 
                specifikke udstyrsdele under "Udstyr-specifikke Smøringsintervaller".
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setLubricationDialogOpen(false)}>
              Annuller
            </Button>
            <Button onClick={saveLubricationSettings}>
              <Check className="mr-2 h-4 w-4" />
              Gem indstillinger
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={equipmentSpecificDialogOpen} onOpenChange={setEquipmentSpecificDialogOpen}>
        <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Udstyr-specifikke Smøringsintervaller</DialogTitle>
            <DialogDescription>
              Konfigurer smøringsintervaller for forskellige typer udstyr.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-6">
            <p className="text-sm">
              Indstil separate smøringsintervaller for forskellige udstyrsdele. 
              Når du aktiverer et specifikt udstyr, vil påmindelser blive sendt baseret 
              på de angivne intervaller, når smøring bliver overskrevet.
            </p>
            
            <div className="space-y-4">
              {notificationSettings.equipmentSpecificIntervals?.map((equipment) => (
                <div key={equipment.equipmentType} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{equipmentTranslations[equipment.equipmentType] || equipment.equipmentType}</h4>
                      <p className="text-sm text-muted-foreground">
                        Specifikt smøringsinterval for {equipmentTranslations[equipment.equipmentType] || equipment.equipmentType}
                      </p>
                    </div>
                    <Switch 
                      checked={equipment.enabled}
                      onCheckedChange={() => handleEquipmentIntervalChange(equipment.equipmentType, 'enabled', true)}
                      disabled={!notificationSettings.lubricationRemindersEnabled}
                    />
                  </div>
                  
                  {equipment.enabled && (
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <label className="text-sm font-medium">Interval (dage)</label>
                        <div className="flex space-x-2 items-center mt-1">
                          <Input
                            type="number"
                            min="1"
                            value={equipment.interval}
                            onChange={(e) => handleEquipmentIntervalChange(
                              equipment.equipmentType, 'interval', parseInt(e.target.value) || 1
                            )}
                            disabled={!notificationSettings.lubricationRemindersEnabled}
                            className="max-w-[120px]"
                          />
                          <span className="text-sm">dage</span>
                        </div>
                      </div>
                      
                      {equipment.equipmentType === 'crane' && (
                        <div className="text-sm bg-blue-50 text-blue-800 p-2 rounded-md flex-1">
                          <p className="font-medium">Kran udskudssmøring</p>
                          <p className="text-xs mt-1">Standard er 14 dage interval som anbefalet af leverandør</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                <strong>Vigtigt:</strong> For at e-mail notifikationer skal sendes ved overskridelse 
                af et udstyr-specifikt interval, skal du sikre dig, at e-mail notifikationer er aktiveret 
                under "Smørings notifikationsindstillinger" og at der er tilføjet gyldige e-mailadresser.
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setEquipmentSpecificDialogOpen(false)}>
              Annuller
            </Button>
            <Button 
              onClick={saveEquipmentSpecificSettings}
              disabled={!notificationSettings.lubricationRemindersEnabled}
            >
              <Check className="mr-2 h-4 w-4" />
              Gem indstillinger
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Settings;
