import React, { useRef, useEffect, useState } from 'react';
import { Video } from '@/types';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Play, Pause, Volume2, VolumeX, Maximize } from 'lucide-react';
import { Progress } from "@/components/ui/progress";

interface VideoPlayerProps {
  video: Video;
  onClose: () => void;
  onProgress: (progress: number) => void;
  initialProgress?: number;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  video,
  onClose,
  onProgress,
  initialProgress = 0
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [progress, setProgress] = useState(initialProgress);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    const updateTime = () => {
      setCurrentTime(videoElement.currentTime);
      const newProgress = (videoElement.currentTime / videoElement.duration) * 100;
      setProgress(newProgress);
      onProgress(newProgress);
    };

    const updateDuration = () => {
      setDuration(videoElement.duration);
    };

    videoElement.addEventListener('timeupdate', updateTime);
    videoElement.addEventListener('loadedmetadata', updateDuration);

    // Set initial position if resuming
    if (initialProgress > 0 && initialProgress < 100) {
      videoElement.currentTime = (initialProgress / 100) * videoElement.duration;
    }

    return () => {
      videoElement.removeEventListener('timeupdate', updateTime);
      videoElement.removeEventListener('loadedmetadata', updateDuration);
    };
  }, [initialProgress, onProgress]);

  const togglePlay = () => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    if (isPlaying) {
      videoElement.pause();
    } else {
      videoElement.play();
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    videoElement.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const newTime = percentage * duration;
    
    videoElement.currentTime = newTime;
    setCurrentTime(newTime);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{video.title}</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Video Player */}
          <div className="relative bg-black rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              src={video.videoUrl}
              className="w-full"
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onEnded={() => {
                setIsPlaying(false);
                onProgress(100);
              }}
            />
            
            {/* Controls Overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <Button
                variant="ghost"
                size="icon"
                className="h-16 w-16 rounded-full bg-black/50 hover:bg-black/70"
                onClick={togglePlay}
              >
                {isPlaying ? (
                  <Pause className="h-8 w-8 text-white" />
                ) : (
                  <Play className="h-8 w-8 text-white" />
                )}
              </Button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div 
              className="relative h-2 bg-muted rounded-full cursor-pointer"
              onClick={handleSeek}
            >
              <div 
                className="absolute h-full bg-primary rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={togglePlay}>
              {isPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </Button>
            <Button variant="outline" size="icon" onClick={toggleMute}>
              {isMuted ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </Button>
            <div className="flex-1" />
            <div className="text-sm text-muted-foreground">
              {Math.round(progress)}% set
            </div>
          </div>

          {/* Description */}
          {video.description && (
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground">{video.description}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default VideoPlayer;

