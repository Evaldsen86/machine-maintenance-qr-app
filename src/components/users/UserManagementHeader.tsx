
import React from 'react';
import { Button } from "@/components/ui/button";
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const UserManagementHeader: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <div className="flex items-center gap-3 mb-6">
      <Button 
        variant="outline" 
        size="sm" 
        className="h-8"
        onClick={() => navigate('/dashboard')}
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Tilbage til dashboard
      </Button>
      <h1 className="text-2xl font-semibold">Brugeradministration</h1>
    </div>
  );
};

export default UserManagementHeader;
