import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { 
  User, 
  Pencil, 
  Save, 
  UserCircle,
  Phone,
  Mail,
  FileText,
  GraduationCap,
  Info,
  Upload,
  X
} from 'lucide-react';

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/use-toast";

import { useAuth } from '@/hooks/useAuth';

// Form schema for profile update
const profileFormSchema = z.object({
  name: z.string().min(2, { message: "Navnet skal være mindst 2 tegn." }),
  email: z.string().email({ message: "Ugyldig e-mailadresse." }),
  phone: z.string().optional(),
  certificates: z.string().optional(),
  skills: z.string().optional(),
  notes: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

const Profile = () => {
  const { user, updateUserProfile } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(user?.profileImage || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Redirect if not logged in
  if (!user) {
    navigate('/');
    return null;
  }
  
  // Initialize form with user data
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: user.name,
      email: user.email,
      phone: user.phone || "",
      certificates: user.certificates ? user.certificates.join(", ") : "",
      skills: user.skills ? user.skills.join(", ") : "",
      notes: user.notes || "",
    },
  });
  
  // Function to get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase();
  };
  
  // Handle form submission
  const onSubmit = (data: ProfileFormValues) => {
    const updatedUser = {
      name: data.name,
      email: data.email,
      phone: data.phone,
      profileImage: profileImage,
      certificates: data.certificates ? data.certificates.split(',').map(cert => cert.trim()) : [],
      skills: data.skills ? data.skills.split(',').map(skill => skill.trim()) : [],
      notes: data.notes,
    };
    
    updateUserProfile(updatedUser);
    setIsEditing(false);
  };
  
  // Handle profile image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // In a real app, this would upload to a server
    // For demo purposes, we'll use a FileReader to convert to data URL
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setProfileImage(result);
      toast({
        title: "Billede uploadet",
        description: "Dit profilbillede er blevet opdateret.",
      });
    };
    reader.readAsDataURL(file);
  };
  
  // Remove profile image
  const removeProfileImage = () => {
    setProfileImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    toast({
      title: "Billede fjernet",
      description: "Dit profilbillede er blevet fjernet.",
    });
  };
  
  // Get the role name in Danish
  const getRoleName = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Administrator';
      case 'driver':
        return 'Chauffør';
      case 'mechanic':
        return 'Mekaniker';
      case 'technician':
        return 'Tekniker';
      case 'blacksmith':
        return 'Smed';
      case 'viewer':
        return 'Gæst';
      default:
        return role;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1 container py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Profile sidebar */}
          <div className="lg:w-1/3">
            <Card>
              <CardHeader>
                <CardTitle>Din profil</CardTitle>
                <CardDescription>
                  Se og administrer dine personlige oplysninger
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center space-y-4">
                <div className="relative">
                  <Avatar className="h-32 w-32">
                    <AvatarImage src={profileImage || ""} alt={user.name} />
                    <AvatarFallback className="text-2xl">{getInitials(user.name)}</AvatarFallback>
                  </Avatar>
                  
                  {isEditing && (
                    <div className="absolute bottom-0 right-0 flex gap-1">
                      <Button 
                        type="button" 
                        size="icon" 
                        variant="outline" 
                        className="h-8 w-8 rounded-full bg-background shadow-md"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Upload className="h-4 w-4" />
                      </Button>
                      
                      {profileImage && (
                        <Button 
                          type="button" 
                          size="icon" 
                          variant="destructive" 
                          className="h-8 w-8 rounded-full shadow-md"
                          onClick={removeProfileImage}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                      
                      <input 
                        ref={fileInputRef}
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleImageUpload}
                      />
                    </div>
                  )}
                </div>
                
                <div className="text-center">
                  <h2 className="text-xl font-bold">{user.name}</h2>
                  <Badge variant="outline" className="mt-1">
                    {getRoleName(user.role)}
                  </Badge>
                </div>
                
                <Separator />
                
                <div className="w-full space-y-3">
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>{user.email}</span>
                  </div>
                  {user.phone && (
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>{user.phone}</span>
                    </div>
                  )}
                </div>
                
                <Button 
                  onClick={() => setIsEditing(!isEditing)} 
                  variant="outline" 
                  className="w-full"
                >
                  {isEditing ? (
                    <>
                      <UserCircle className="mr-2 h-4 w-4" />
                      Afbryd redigering
                    </>
                  ) : (
                    <>
                      <Pencil className="mr-2 h-4 w-4" />
                      Rediger profil
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
          
          {/* Profile content */}
          <div className="lg:w-2/3">
            <Tabs defaultValue={isEditing ? "edit" : "info"} value={isEditing ? "edit" : "info"}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger 
                  value="info" 
                  onClick={() => setIsEditing(false)}
                  disabled={isEditing}
                >
                  Profiloplysninger
                </TabsTrigger>
                <TabsTrigger 
                  value="edit" 
                  onClick={() => setIsEditing(true)}
                  disabled={!isEditing}
                >
                  Rediger profil
                </TabsTrigger>
              </TabsList>
              
              {/* Rest of existing tabs content */}
              {/* View mode */}
              <TabsContent value="info" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <User className="mr-2 h-5 w-5" />
                      Personlige oplysninger
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-1">Navn</h3>
                        <p className="text-lg">{user.name}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-1">Email</h3>
                        <p className="text-lg">{user.email}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-1">Telefon</h3>
                        <p className="text-lg">{user.phone || "Ikke angivet"}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-1">Rolle</h3>
                        <p className="text-lg">{getRoleName(user.role)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <FileText className="mr-2 h-5 w-5" />
                      Certifikater & Kvalifikationer
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">Certifikater</h3>
                      {user.certificates && user.certificates.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {user.certificates.map((cert, index) => (
                            <Badge key={index} variant="secondary">
                              {cert}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground">Ingen certifikater tilføjet</p>
                      )}
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">Kompetencer</h3>
                      {user.skills && user.skills.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {user.skills.map((skill, index) => (
                            <Badge key={index} variant="outline">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground">Ingen kompetencer tilføjet</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
                
                {user.notes && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Info className="mr-2 h-5 w-5" />
                        Noter
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="whitespace-pre-line">{user.notes}</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
              
              {/* Edit mode */}
              <TabsContent value="edit" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Rediger profil</CardTitle>
                    <CardDescription>
                      Opdater dine personlige oplysninger og kvalifikationer
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Navn</FormLabel>
                                <FormControl>
                                  <Input placeholder="Dit navn" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                  <Input placeholder="Din email" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="phone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Telefon</FormLabel>
                                <FormControl>
                                  <Input placeholder="Dit telefonnummer" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <FormField
                          control={form.control}
                          name="certificates"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Certifikater</FormLabel>
                              <FormControl>
                                <Input placeholder="Certifikater (adskil med komma)" {...field} />
                              </FormControl>
                              <FormDescription>
                                Skriv dine certifikater adskilt med komma, f.eks. "Truckcertifikat, Krancertifikat"
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="skills"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Kompetencer</FormLabel>
                              <FormControl>
                                <Input placeholder="Kompetencer (adskil med komma)" {...field} />
                              </FormControl>
                              <FormDescription>
                                Skriv dine kompetencer adskilt med komma, f.eks. "Lastbilchauffør, Kranfører"
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="notes"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Noter</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Yderligere oplysninger om dig"
                                  className="min-h-[120px]"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsEditing(false)}
                          >
                            Annuller
                          </Button>
                          <Button type="submit">
                            <Save className="mr-2 h-4 w-4" />
                            Gem ændringer
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Profile;
