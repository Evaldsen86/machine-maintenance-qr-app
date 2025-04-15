
import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { User } from '@/types';
import { mockUsers } from '@/data/mockData';
import { Search, UserPlus } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import UserTable from '@/components/users/UserTable';
import UserForm from '@/components/users/UserForm';
import UserViewDialog from '@/components/users/UserViewDialog';
import UserManagementHeader from '@/components/users/UserManagementHeader';
import { UserFormValues, userFormSchema } from '@/types/userManagement';

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddUserDialog, setShowAddUserDialog] = useState(false);
  const [showEditUserDialog, setShowEditUserDialog] = useState(false);
  const [showViewUserDialog, setShowViewUserDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  // Form for creating new users
  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      name: "",
      email: "",
      role: "driver",
      phone: "",
      passcode: "",
      notes: ""
    }
  });
  
  // Form for editing existing users
  const editForm = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      name: "",
      email: "",
      role: "driver",
      phone: "",
      passcode: "",
      notes: ""
    }
  });
  
  // Filter users by search query
  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.role.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const handleAddUser = (values: UserFormValues) => {
    const newUserObj: User = {
      id: `user-${Date.now()}`,
      name: values.name,
      email: values.email,
      role: values.role === "viewer" ? "guest" as User['role'] : values.role as User['role'],
      phone: values.phone || undefined,
      profileImage: null,
      passcode: values.passcode || undefined,
      notes: values.notes || undefined
    };
    
    setUsers([...users, newUserObj]);
    
    form.reset();
    setShowAddUserDialog(false);
    
    toast({
      title: "Bruger oprettet",
      description: `${values.name} er blevet tilføjet som ${values.role.toLowerCase()}.`,
    });
  };
  
  const openEditUserDialog = (user: User) => {
    setSelectedUser(user);
    editForm.reset({
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone || "",
      passcode: user.passcode || "",
      notes: user.notes || ""
    });
    setShowEditUserDialog(true);
  };

  const openViewUserDialog = (user: User) => {
    setSelectedUser(user);
    setShowViewUserDialog(true);
  };
  
  const handleEditUser = (values: UserFormValues) => {
    if (!selectedUser) return;
    
    const updatedUser: User = {
      ...selectedUser,
      name: values.name,
      email: values.email,
      role: values.role as User['role'],
      phone: values.phone || undefined,
      passcode: values.passcode || undefined,
      notes: values.notes || undefined
    };
    
    setUsers(users.map(user => user.id === selectedUser.id ? updatedUser : user));
    
    editForm.reset();
    setShowEditUserDialog(false);
    setSelectedUser(null);
    
    toast({
      title: "Bruger opdateret",
      description: `${values.name}'s oplysninger er blevet opdateret.`,
    });
  };
  
  const handleDeleteUser = (userId: string) => {
    setUsers(users.filter(user => user.id !== userId));
    
    toast({
      title: "Bruger slettet",
      description: "Brugeren er blevet fjernet fra systemet.",
    });
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1">
        <div className="page-container py-6">
          <UserManagementHeader />
          
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Brugere</CardTitle>
              <CardDescription>
                Administrer brugere og deres rettigheder i systemet
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                <div className="relative w-full max-w-sm">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Søg efter brugere..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Button onClick={() => setShowAddUserDialog(true)}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Tilføj ny bruger
                </Button>
              </div>
              
              <UserTable 
                users={filteredUsers}
                onViewUser={openViewUserDialog}
                onEditUser={openEditUserDialog}
                onDeleteUser={handleDeleteUser}
              />
            </CardContent>
          </Card>
        </div>
      </main>
      
      {/* Add User Dialog */}
      <Dialog open={showAddUserDialog} onOpenChange={setShowAddUserDialog}>
        <DialogContent className="sm:max-w-md max-w-[95%]">
          <DialogHeader>
            <DialogTitle>Tilføj ny bruger</DialogTitle>
            <DialogDescription>
              Opret en ny bruger og tildel dem en rolle i systemet.
            </DialogDescription>
          </DialogHeader>
          
          <UserForm 
            form={form} 
            onSubmit={handleAddUser} 
            onCancel={() => setShowAddUserDialog(false)}
          />
        </DialogContent>
      </Dialog>
      
      {/* Edit User Dialog */}
      <Dialog open={showEditUserDialog} onOpenChange={setShowEditUserDialog}>
        <DialogContent className="sm:max-w-md max-w-[95%]">
          <DialogHeader>
            <DialogTitle>Rediger bruger</DialogTitle>
            <DialogDescription>
              Opdater brugerens oplysninger og rolle.
            </DialogDescription>
          </DialogHeader>
          
          <UserForm 
            form={editForm} 
            onSubmit={handleEditUser} 
            onCancel={() => setShowEditUserDialog(false)}
            isEditing
          />
        </DialogContent>
      </Dialog>
      
      {/* View User Dialog */}
      <Dialog open={showViewUserDialog} onOpenChange={setShowViewUserDialog}>
        <DialogContent className="sm:max-w-md max-w-[95%]">
          <DialogHeader>
            <DialogTitle>Brugerdetaljer</DialogTitle>
            <DialogDescription>
              Se detaljerede oplysninger om brugeren
            </DialogDescription>
          </DialogHeader>
          
          {selectedUser && (
            <UserViewDialog 
              user={selectedUser}
              onClose={() => setShowViewUserDialog(false)}
              onEdit={() => {
                setShowViewUserDialog(false);
                openEditUserDialog(selectedUser);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagement;
