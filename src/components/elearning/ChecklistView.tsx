import React, { useState } from 'react';
import { MachineChecklist, Machine, ChecklistItem, ChecklistFrequency } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, CheckCircle, Circle, Edit, Trash2, Copy } from 'lucide-react';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';

interface ChecklistViewProps {
  machine: Machine | null;
  checklists: MachineChecklist[];
  onEdit?: (checklist: MachineChecklist) => void;
  onDelete?: (checklistId: string) => void;
  onCopy?: (machineId: string) => void;
  canEdit?: boolean;
}

const ChecklistView: React.FC<ChecklistViewProps> = ({ machine, checklists, onEdit, onDelete, onCopy, canEdit = false }) => {
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  // Get checklist for current machine
  const checklist = machine 
    ? checklists.find(c => c.machineId === machine.id)
    : null;

  // Load checked items from localStorage
  React.useEffect(() => {
    if (machine) {
      const stored = localStorage.getItem(`checklist_${machine.id}`);
      if (stored) {
        setCheckedItems(JSON.parse(stored));
      }
    }
  }, [machine]);

  const handleCheck = (itemId: string, frequency: ChecklistFrequency) => {
    const key = `${itemId}_${frequency}`;
    const newChecked = {
      ...checkedItems,
      [key]: !checkedItems[key],
    };
    setCheckedItems(newChecked);
    
    if (machine) {
      localStorage.setItem(`checklist_${machine.id}`, JSON.stringify(newChecked));
    }
  };

  const renderChecklistItems = (items: ChecklistItem[], frequency: ChecklistFrequency) => {
    if (items.length === 0) {
      return (
        <p className="text-sm text-muted-foreground py-4">
          Ingen checkpunkter for denne frekvens
        </p>
      );
    }

    return (
      <div className="space-y-3">
        {items.map(item => {
          const key = `${item.id}_${frequency}`;
          const isChecked = checkedItems[key] || false;
          
          return (
            <div
              key={item.id}
              className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
            >
              <Checkbox
                checked={isChecked}
                onCheckedChange={() => handleCheck(item.id, frequency)}
                className="mt-1"
              />
              <div className="flex-1">
                <label
                  className={`text-sm font-medium cursor-pointer ${
                    isChecked ? 'line-through text-muted-foreground' : ''
                  }`}
                  onClick={() => handleCheck(item.id, frequency)}
                >
                  {item.title}
                </label>
                {item.description && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {item.description}
                  </p>
                )}
              </div>
              {isChecked && (
                <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  if (!machine) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">
            Vælg en lastbil for at se checklister
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!checklist) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">
            Ingen checklist tilgængelig for {machine.name}
          </p>
        </CardContent>
      </Card>
    );
  }

  const dailyChecked = checklist.dailyChecks.filter(
    item => checkedItems[`${item.id}_daily`]
  ).length;
  const weeklyChecked = checklist.weeklyChecks.filter(
    item => checkedItems[`${item.id}_weekly`]
  ).length;
  const monthlyChecked = checklist.monthlyChecks.filter(
    item => checkedItems[`${item.id}_monthly`]
  ).length;

  return (
    <Card className="relative">
      {canEdit && (
        <div className="absolute top-4 right-4 flex gap-2 z-10">
          {onCopy && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onCopy(checklist.machineId)}
            >
              <Copy className="h-4 w-4 mr-1" />
              Kopiér
            </Button>
          )}
          {onEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(checklist)}
            >
              <Edit className="h-4 w-4 mr-1" />
              Rediger
            </Button>
          )}
          {onDelete && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onDelete(checklist.id)}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Slet
            </Button>
          )}
        </div>
      )}
      <CardHeader>
        <CardTitle>Checkliste for {checklist.machineName}</CardTitle>
        <CardDescription>
          Daglige, ugentlige og månedlige kontroller
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="daily" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="daily">
              Daglige
              <Badge variant="secondary" className="ml-2">
                {dailyChecked}/{checklist.dailyChecks.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="weekly">
              Ugentlige
              <Badge variant="secondary" className="ml-2">
                {weeklyChecked}/{checklist.weeklyChecks.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="monthly">
              Månedlige
              <Badge variant="secondary" className="ml-2">
                {monthlyChecked}/{checklist.monthlyChecks.length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="daily" className="mt-6">
            <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Daglige kontroller - {format(new Date(), 'dd MMMM yyyy', { locale: da })}</span>
            </div>
            {renderChecklistItems(checklist.dailyChecks, 'daily')}
          </TabsContent>

          <TabsContent value="weekly" className="mt-6">
            <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Ugentlige kontroller - Uge {format(new Date(), 'w', { locale: da })}</span>
            </div>
            {renderChecklistItems(checklist.weeklyChecks, 'weekly')}
          </TabsContent>

          <TabsContent value="monthly" className="mt-6">
            <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Månedlige kontroller - {format(new Date(), 'MMMM yyyy', { locale: da })}</span>
            </div>
            {renderChecklistItems(checklist.monthlyChecks, 'monthly')}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ChecklistView;

