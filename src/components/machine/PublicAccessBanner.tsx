
import React from 'react';
import { Button } from "@/components/ui/button";
import { LogIn } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

const PublicAccessBanner: React.FC = () => {
  const navigate = useNavigate();
  const { isPublicAccess, isAuthenticated } = useAuth();

  if (!isPublicAccess || isAuthenticated) {
    return null;
  }

  return (
    <div className="bg-primary/10 py-2">
      <div className="page-container">
        <div className="flex items-center justify-between">
          <p className="text-sm text-primary font-medium">
            Du ser offentlig adgang til maskindata. 
            <span className="hidden sm:inline"> Log ind for at tilføje eller redigere data.</span>
          </p>
          <Button 
            size="sm" 
            variant="outline" 
            className="ml-2" 
            onClick={() => navigate('/')}
          >
            <LogIn className="h-4 w-4 mr-1" />
            Log ind
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PublicAccessBanner;
