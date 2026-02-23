import React from 'react';
import { Course, VideoProgress } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Play, CheckCircle, Clock, Edit, Trash2 } from 'lucide-react';

interface CourseListProps {
  courses: Course[];
  videoProgress: VideoProgress[];
  onVideoClick: (video: any) => void;
  onEdit?: (course: Course) => void;
  onDelete?: (courseId: string) => void;
  canEdit?: boolean;
}

const CourseList: React.FC<CourseListProps> = ({ courses, videoProgress, onVideoClick, onEdit, onDelete, canEdit = false }) => {
  const getCourseProgress = (course: Course, userId?: string): number => {
    if (!userId || course.videos.length === 0) return 0;
    
    const completedVideos = course.videos.filter(video => {
      const progress = videoProgress.find(
        p => p.videoId === video.id && p.userId === userId && p.completed
      );
      return !!progress;
    });
    
    return (completedVideos.length / course.videos.length) * 100;
  };

  if (courses.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Ingen kurser tilgængelige</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {courses.map(course => {
        const progress = getCourseProgress(course);
        const isCompleted = progress >= 100;
        
        return (
          <Card key={course.id} className="hover:shadow-lg transition-shadow relative">
            {canEdit && (
              <div className="absolute top-2 right-2 flex gap-1 z-10">
                {onEdit && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(course)}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                )}
                {onDelete && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => onDelete(course.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
            )}
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle>{course.title}</CardTitle>
                  {course.description && (
                    <CardDescription className="mt-2">{course.description}</CardDescription>
                  )}
                </div>
                {isCompleted && (
                  <Badge variant="default" className="ml-2">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Færdig
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Progress */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Fremgang</span>
                  <span className="font-medium">{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} />
              </div>

              {/* Videos in Course */}
              <div className="space-y-2">
                <p className="text-sm font-medium">Videoer i kurset ({course.videos.length}):</p>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {course.videos.map((video, index) => {
                    const videoProg = videoProgress.find(p => p.videoId === video.id);
                    const isVideoCompleted = videoProg?.completed || false;
                    
                    return (
                      <div
                        key={video.id}
                        className="flex items-center gap-2 p-2 rounded hover:bg-muted cursor-pointer"
                        onClick={() => onVideoClick(video)}
                      >
                        <div className="flex-shrink-0">
                          {isVideoCompleted ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <Clock className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm truncate">{index + 1}. {video.title}</p>
                          {videoProg && (
                            <p className="text-xs text-muted-foreground">
                              {Math.round(videoProg.progress)}% set
                            </p>
                          )}
                        </div>
                        <Play className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Category Badges */}
              <div className="flex flex-wrap gap-2 pt-2 border-t">
                <Badge variant="outline">{course.category}</Badge>
                {course.truckBrands && course.truckBrands.length > 0 && (
                  <Badge variant="outline">
                    {course.truckBrands.join(', ')}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default CourseList;

